from django.core.management.base import BaseCommand
from messaging.models import Agent, CannedResponse

class Command(BaseCommand):
    help = "Seed initial data (agents, canned replies, etc.)"

    def handle(self, *args, **kwargs):
        # Create default agents
        agents = ["Alice", "Bob", "Charlie"]
        for name in agents:
            Agent.objects.get_or_create(name=name)

        # Create canned responses
        canned_responses = [
            "Thank you for contacting us!",
            "We are looking into your issue.",
            "Your order has been shipped."
        ]
        for text in canned_responses:
            CannedResponse.objects.get_or_create(body=text)

        self.stdout.write(self.style.SUCCESS("Seed data added successfully!"))
