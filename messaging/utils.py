import re
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response as DRFResponse


# Keyword weights for priority scoring
URGENT_KEYWORDS = {
    r"\bloan\b": 5,
    r"\bdisburse\b": 8,
    r"\bdisburs(ed|ement)?\b": 8,
    r"\bapproved\b": 6,
    r"\burgent\b": 10,
    r"\bfailed\b": 4,
    r"\berror\b": 3,
    r"\btransfer\b": 4,
}

def calculate_keyword_score(body: str) -> int:
    """
    Count keyword occurrences and sum weights.
    """
    if not body:
        return 0
    text = body.lower()
    score = 0
    for pattern, weight in URGENT_KEYWORDS.items():
        if re.search(pattern, text):
            score += weight
    return score

def calculate_priority(body: str, created_at: datetime, status: str) -> int:
    """
    Combine keyword score, recency factor, and waiting penalty.
    - Keyword score measures urgency based on message content.
    - Recency gives small boost for recent messages (within 2 days).
    - Waiting penalty increases score if message has been unhandled for too long.
    """
    score = calculate_keyword_score(body)
    # recency: messages less than 2 days old get a small bonus
    now = timezone.now()

    # Make sure created_at is timezone-aware
    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, dt_timezone.utc)
    age_hours = (now - created_at).total_seconds() / 3600.0
    if age_hours < 48:
        # 2 for less than 24h, 1 for 24-48h
        recency_bonus = max(0, int(2 - (age_hours / 24)))  
        score += recency_bonus
    
    # Waiting penalty: if unhandled for long, push it higher
    if status in ["unassigned", "in_progress"]:
        if age_hours >= 24:
            score += 3  # moderately overdue
        if age_hours >= 48:
            score += 5  # very overdue (ignored too long)
    return score

def custom_exception_handler(exc, context):
    """
    Unified error response format.
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        message = "Validation error" if isinstance(exc, ValidationError) else getattr(exc, 'detail', str(exc))
        # Handle string vs dictionary detail
        if isinstance(message, dict) and 'detail' in message:
            message = message['detail']
            
        custom_data = {
            'success': False,
            'message': str(message),
            'errors': response.data if isinstance(exc, ValidationError) or isinstance(response.data, dict) else None,
            'data': None
        }
        response.data = custom_data
        
    return response

def generic_response(data=None, message="Success", success=True, status_code=200):
    """
    Unified generic response format for both success and manual errors.
    """
    return DRFResponse({
        "success": success,
        "message": message,
        "data": data,
        "errors": None if success else data
    }, status=status_code)
