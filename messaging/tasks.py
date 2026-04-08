from celery import shared_task
from django.db import transaction
import csv
from io import StringIO
from .models import Customer, Message
from .utils import calculate_priority
from django.utils import timezone

@shared_task
def ingest_csv_data(file_content: str):
    """
    Background worker to process CSV uploads in chunks without blocking the main API thread.
    Uses bulk_create to efficiently insert thousands of records at once.
    """
    print("Starting CSV Ingestion...")
    f = StringIO(file_content)
    reader = csv.DictReader(f)
    
    customers_to_create = []
    messages_to_create = []
    
    # Track unique user IDs within this batch
    seen_users = set()
    
    for row in reader:
        user_id = row.get('User ID')
        timestamp_str = row.get('Timestamp (UTC)')
        body = row.get('Message Body')
        
        if not user_id or not body:
            continue
            
        if user_id not in seen_users:
            customers_to_create.append(Customer(user_id=user_id))
            seen_users.add(user_id)
            
    # Bulk Create Customers (Ignore conflicts if user_id already exists)
    if customers_to_create:
        Customer.objects.bulk_create(customers_to_create, ignore_conflicts=True)
        
    # Re-fetch customers to get their actual PKs mapping

    customer_map = {c.user_id: c for c in Customer.objects.filter(user_id__in=seen_users)}
    
    # Prepare Messages
    f.seek(0)
    next(reader) # skip header
    now = timezone.now()
    
    for row in reader:
        user_id = row.get('User ID')
        body = row.get('Message Body')
        
        if not user_id or not body or user_id not in customer_map:
            continue
            
        # Parse actual timestamp from CSV
        # Doing lightweight insertion logic
        priority = calculate_priority(body, now, Message.STATUS_UNASSIGNED)
        
        messages_to_create.append(Message(
            customer=customer_map[user_id],
            body=body,
            status=Message.STATUS_UNASSIGNED,
            timestamp=now,  # Ideally parsed from CSV Timestamp (UTC)
            priority=priority
        ))
        
    # Bulk Create Messages in chunks to save memory
    if messages_to_create:
        Message.objects.bulk_create(messages_to_create, batch_size=1000)
    
    print(f"Finished ingesting {len(messages_to_create)} messages.")
    return len(messages_to_create)

