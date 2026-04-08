from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Message, CannedResponse, Agent
from .serializers import (
    MessageSerializer, 
    CannedResponseSerializer,
    AgentSerializer,
    MessageCreateSerializer,
    MessageClaimSerializer,
    MessageReplySerializer,
    MessageCannedReplySerializer,
    CustomerReplySerializer
)
from .services import MessageService, ApplicationError
from .selectors import MessageSelector
from .utils import generic_response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling messages (List, Create, Claim, Reply, Canned).
    """
    serializer_class = MessageSerializer
    lookup_field = 'external_id'
    
    def get_queryset(self):
        status_q = self.request.query_params.get('status')
        search_q = self.request.query_params.get('q')
        return MessageSelector.get_priority_inbox(status_q, search_q)

    @swagger_auto_schema(
        request_body=MessageCreateSerializer,
        responses={201: "Message created"}
    )
    def create(self, request, *args, **kwargs):
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        msg = MessageService.create_message(
            user_id=serializer.validated_data.get("user_id"), 
            body=serializer.validated_data.get("body"),
            name=serializer.validated_data.get("name"),
            phone=serializer.validated_data.get("phone"),
            email=serializer.validated_data.get("email")
        )
        
        return generic_response(
            data={"external_id": str(msg.external_id)}, 
            message="Message created successfully",
            status_code=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(
        method='post',
        request_body=MessageClaimSerializer,
        responses={200: "Successfully claimed", 409: "Already claimed", 404: "Message not found"}
    )
    @action(detail=True, methods=['post'])
    def claim(self, request, external_id=None):
        serializer = MessageClaimSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            msg = MessageService.claim_message(
                message_external_id=external_id, 
                agent_external_id=str(serializer.validated_data['agent_id'])
            )
            return generic_response(
                data={
                    "message_external_id": str(msg.external_id), 
                    "claimed_by": msg.assigned_to.name
                },
                message="Message successfully claimed"
            )
        except ApplicationError as e:
            msg_str = str(e)
            if "already_claimed" in msg_str:
                return generic_response(
                    data={"by": msg_str.split(":")[1] if ":" in msg_str else "Unknown"},
                    message="already_claimed",
                    success=False,
                    status_code=status.HTTP_409_CONFLICT
                )
            return generic_response(
                message=msg_str,
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @swagger_auto_schema(
        method='post',
        request_body=MessageReplySerializer
    )
    @action(detail=True, methods=['post'])
    def reply(self, request, external_id=None):
        serializer = MessageReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            MessageService.reply_message(
                message_external_id=external_id, 
                agent_external_id=str(serializer.validated_data['agent_id']), 
                text=serializer.validated_data['text']
            )
            return generic_response(message="Reply sent successfully")
        except ApplicationError as e:
            return generic_response(
                message=str(e),
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @swagger_auto_schema(
        method='post',
        request_body=MessageCannedReplySerializer
    )
    @action(detail=True, methods=['post'])
    def use_canned(self, request, external_id=None):
        serializer = MessageCannedReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            MessageService.use_canned_reply(
                message_external_id=external_id, 
                agent_external_id=str(serializer.validated_data['agent_id']), 
                canned_external_id=str(serializer.validated_data['canned_id'])
            )
            return generic_response(message="Replied with canned response")
        except ApplicationError as e:
            return generic_response(
                message=str(e),
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @swagger_auto_schema(
        method='post',
        request_body=CustomerReplySerializer
    )
    @action(detail=True, methods=['post'])
    def customer_reply(self, request, external_id=None):
        serializer = CustomerReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            MessageService.customer_reply(
                message_external_id=external_id, 
                text=serializer.validated_data['text']
            )
            return generic_response(message="Customer reply sent successfully")
        except ApplicationError as e:
            return generic_response(
                message=str(e),
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST
            )


class CannedResponseViewSet(viewsets.ModelViewSet):
    queryset = CannedResponse.objects.all()
    serializer_class = CannedResponseSerializer
    lookup_field = 'external_id'

    @method_decorator(cache_page(60 * 60 * 2))  # Cache for 2 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class AgentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    lookup_field = 'external_id'
