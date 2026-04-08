from .models import Message
from django.db.models import QuerySet, Q

class MessageSelector:
    @staticmethod
    def get_priority_inbox(status_q: str=None, search_q: str=None) -> QuerySet[Message]:
        # Eliminates N+1 queries by fetching relationships
        qs = Message.objects.select_related('customer', 'assigned_to').prefetch_related('replies', 'replies__agent').all()

        if status_q:
            qs = qs.filter(status=status_q)

        if search_q:
            qs = qs.filter(Q(body__icontains=search_q) | Q(customer__user_id__icontains=search_q))

        # Sort by high priority then oldest first
        return qs.order_by('-priority', 'created_at')

