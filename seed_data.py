import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs_messaging.settings')
django.setup()
from messaging.models import Agent, CannedResponse


def seed():
    print("Seeding database with default agents and canned responses...")

    # Create sample agents
    agents = ["Alice Support", "Bob Support", "Charlie Support"]
    for name in agents:
        obj, created = Agent.objects.get_or_create(name=name)
        print(f"{'Created' if created else 'Already exists'} agent: {obj.name}")

    # Create canned responses
    canned_messages = [
        "Thank you for reaching out! We’ll get back to you shortly.",
        "Your loan is being processed. Expect an update within 24 hours.",
        "Please verify your account details and try again.",
    ]
    for msg in canned_messages:
        obj, created = CannedResponse.objects.get_or_create(body=msg)
        print(f"{'Created' if created else 'Already exists'} canned response ID {obj.id}")

    print("✅ Seeding complete!")

if __name__ == "__main__":
    seed()
