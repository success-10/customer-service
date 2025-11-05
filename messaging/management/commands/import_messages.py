import os
from pathlib import Path
import pandas as pd
from django.core.management.base import BaseCommand
from django.utils import timezone
from dateutil import parser  # more flexible date parsing
from messaging.models import Customer, Message
from messaging.utils import calculate_priority


BASE_DIR = Path(__file__).resolve().parent.parent.parent  
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
        imported = 0
        failed = 0

        for idx, row in df.iterrows():
            cust_id = str(row.get("User ID")).strip() if pd.notna(row.get("User ID")) else None
            body = str(row.get("Message Body")).strip() if pd.notna(row.get("Message Body")) else None
            timestamp_str = row.get("Timestamp (UTC)")

            # Validate essential fields
            if not cust_id or not body:
                failed += 1
                continue

            # Parse timestamp safely
            if pd.notna(timestamp_str):
                try:
                    created_at = parser.parse(str(timestamp_str))
                    if timezone.is_naive(created_at):
                        created_at = timezone.make_aware(created_at, timezone=timezone.get_current_timezone())
                except Exception:
                    created_at = timezone.now()
            else:
                created_at = timezone.now()

            # Create or get the customer
            customer, _ = Customer.objects.get_or_create(user_id=cust_id)

            # Calculate priority
            priority = calculate_priority(body, created_at, "unassigned")

            # Create message safely
            Message.objects.create(
                customer=customer,
                body=body,
                timestamp=created_at,  
                created_at=created_at,
                priority=priority,
                status=Message.STATUS_UNASSIGNED
            )
            imported += 1

        self.stdout.write(self.style.SUCCESS(f" CSV import completed: {imported} messages imported, {failed} skipped."))
