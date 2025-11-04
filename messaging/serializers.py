from rest_framework import serializers
from .models import Message, Customer, CannedResponse, Agent

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['user_id', 'name', 'phone', 'email']

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name']

class MessageSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()
    assigned_to = AgentSerializer()

    class Meta:
        model = Message
        fields = ['id', 'customer', 'body', 'created_at', 'status', 'assigned_to', 'priority', 'response', 'responded_at']

class CannedResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CannedResponse
        fields = ['id', 'title', 'body']
