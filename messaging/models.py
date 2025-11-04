from django.db import models
from django.utils import timezone

# Create your models here.

class Customer(models.Model):
    user_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.customer_id} - {self.name or 'Unnamed'}"

class Agent(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Message(models.Model):
    STATUS_UNASSIGNED = 'unassigned'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_CLOSED = 'closed'
    STATUS_CHOICES = [
        (STATUS_UNASSIGNED, 'Unassigned'),
        (STATUS_IN_PROGRESS, 'In progress'),
        (STATUS_CLOSED, 'Closed'),
    ]

    
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='messages')
    timestamp = models.DateTimeField()
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNASSIGNED)
    assigned_to = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_messages')
    claimed_at = models.DateTimeField(null=True, blank=True)
    priority = models.IntegerField(default=0)
    response = models.TextField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "priority", "created_at"]),
        ]

    def __str__(self):
        return f"Msg {self.id} ({self.status})"
    
class CannedResponse(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()

    def __str__(self):
        return self.title