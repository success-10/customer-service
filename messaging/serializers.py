from rest_framework import serializers
from .models import Message, Customer, CannedResponse, Agent, MessageReply

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['user_id', 'name', 'phone', 'email', 'external_id']

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['external_id', 'name']

class MessageReplyObjectSerializer(serializers.ModelSerializer):
    agent = AgentSerializer()

    class Meta:
        model = MessageReply
        fields = ['external_id', 'agent', 'is_customer', 'text', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()
    assigned_to = AgentSerializer()
    replies = MessageReplyObjectSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['external_id', 'customer', 'body', 'created_at', 'status', 'assigned_to', 'priority', 'replies']

class CannedResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CannedResponse
        fields = ['external_id', 'title', 'body']

class MessageCreateSerializer(serializers.Serializer):
    user_id = serializers.CharField(max_length=50)
    body = serializers.CharField()
    name = serializers.CharField(max_length=100, required=False, allow_null=True)
    phone = serializers.CharField(max_length=20, required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_null=True)

class MessageClaimSerializer(serializers.Serializer):
    agent_id = serializers.UUIDField()

class MessageReplySerializer(serializers.Serializer):
    agent_id = serializers.UUIDField()
    text = serializers.CharField()

class MessageCannedReplySerializer(serializers.Serializer):
    agent_id = serializers.UUIDField()
    canned_id = serializers.UUIDField()

class CustomerReplySerializer(serializers.Serializer):
    text = serializers.CharField()
