# messaging/management/commands/import_messages.py
import pandas as pd
from django.core.management.base import BaseCommand
from django.utils import timezone
from messaging.models import Customer, Message
from messaging.utils import calculate_priority
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # go up to app root
CSV_PATH = BASE_DIR / "data" / "GeneralistRails_Project_MessageData.csv"


class Command(BaseCommand):
    help = "Import messages from CSV into the database"

    def add_arguments(self, parser):
        parser.add_argument("--path", type=str, help="CSV file path", default=CSV_PATH)

    def handle(self, *args, **options):
        path = options["path"]
        if not os.path.exists(path):
            self.stdout.write(self.style.ERROR(f"CSV file not found: {path}"))
            return

        df = pd.read_csv(path)
        # Normalize columns - common names used below: 'message_id', 'customer_id', 'body', 'created_at'
        for idx, row in df.iterrows():
            cust_id = str(row.get("User ID") )
            body = str(row.get("Message Body") )
            # parse created_at if exists else use now
            try:
                created_at = pd.to_datetime(row.get("Timestamp (UTC)"))
                created_at = created_at.to_pydatetime()
            except Exception:
                created_at = timezone.now()

            customer, _ = Customer.objects.get_or_create(customer_id=cust_id)
            priority = calculate_priority(body, created_at)
            Message.objects.create(
                customer=customer,
                body=body,
                created_at=created_at,
                priority=priority,
                status=Message.STATUS_UNASSIGNED
            )
        self.stdout.write(self.style.SUCCESS("CSV import completed."))
