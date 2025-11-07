from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Message, Agent, CannedResponse, Customer
from .serializers import MessageSerializer, CannedResponseSerializer
from .utils import calculate_priority
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt


# Create your views here.


channel_layer = get_channel_layer()

@csrf_exempt
@api_view(['GET', 'POST'])
def messages(request):
    """
    GET /api/messages/  -> list messages (supports ?status=unassigned)
    POST /api/messages/ -> create a new customer message
    """
    if request.method == 'GET':
        status_q = request.GET.get('status')
        search_q = request.GET.get('q')
        qs = Message.objects.all()

        if status_q:
            qs = qs.filter(status=status_q)

        if search_q:
            qs = qs.filter(Q(body__icontains=search_q) | Q(customer__user_id__icontains=search_q))

        qs = qs.order_by('-priority', 'created_at')[:200]

        serializer = MessageSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        user_id = request.data.get("user_id")
        body = request.data.get("body")

        if not user_id or not body:
            return Response({"detail": "user_id and body required"}, status=status.HTTP_400_BAD_REQUEST)

        # create or get customer
        customer, _ = Customer.objects.get_or_create(user_id=user_id)

        msg = Message.objects.create(
            customer=customer,
            body=body,
            status=Message.STATUS_UNASSIGNED,
            timestamp=timezone.now()
        )

        # Broadcast to all agents (optional)
        async_to_sync(channel_layer.group_send)(
            "agents",
            {
                "type": "message_new",
                "message_id": msg.id,
                "status": msg.status,
                "body": msg.body
            }
        )

        return Response({"id": msg.id, "status": "created"}, status=status.HTTP_201_CREATED)

@csrf_exempt   
@api_view(['POST'])
def claim_message(request, message_id):
    """
    POST /api/messages/<id>/claim
    body: {"agent_id": 1}
    Uses an atomic SQL UPDATE to claim only if still unassigned.
    """
    agent_id = request.data.get('agent_id')
    if not agent_id:
        return Response({"detail": "agent_id required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return Response({"detail": "Invalid agent_id"}, status=400)
    
    now = timezone.now()

    with transaction.atomic():
        updated_rows = Message.objects.filter(
            id=message_id,
            status=Message.STATUS_UNASSIGNED
        ).update(
            assigned_to=agent,
            status=Message.STATUS_IN_PROGRESS,
            claimed_at=now
        )

        if updated_rows == 1:
            # Successful claim; broadcast update
            async_to_sync(channel_layer.group_send)(
                "agents",
                {
                    "type": "message_update",
                    "message_id": int(message_id),
                    "status": Message.STATUS_IN_PROGRESS,
                    "assigned_to": int(agent_id)
                }
            )
            return Response({"status": "claimed",
                            "message_id": int(message_id),
                            "claimed_by": int(agent_id)
                        }, status=status.HTTP_200_OK)
        else:
            # Already claimed: fetch current assignee for message
            try:
                msg = Message.objects.get(id=message_id)
                assigned = msg.assigned_to.name if msg.assigned_to else None
                return Response({"status": "already_claimed", "by": assigned}, status=status.HTTP_409_CONFLICT)
            except Message.DoesNotExist:
                return Response({"detail": "message not found"}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(['POST'])
def reply_message(request, message_id):
    """
    POST /api/messages/<id>/reply
    body: {"agent_id":1, "text": "reply here" }
    Stores reply, marks message closed, broadcasts update.
    """
    agent_id = request.data.get('agent_id')
    text = request.data.get('text')
    if not agent_id or not text or not text.strip():
        return Response({"detail": "agent_id and non-empty text are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check agent existence first
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return Response({"detail": "agent not found"}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        msg = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({"detail": "message not found"}, status=status.HTTP_404_NOT_FOUND)

    # Prevent replying to closed messages
    if msg.status == Message.STATUS_CLOSED:
        return Response({"detail": "cannot reply to a closed message"}, status=status.HTTP_400_BAD_REQUEST)

    # Ensure same agent is replying
    if msg.assigned_to and msg.assigned_to.id != int(agent_id):
        return Response({"detail": "message assigned to another agent"}, status=status.HTTP_403_FORBIDDEN)

    msg.response = text
    msg.responded_at = timezone.now()
    msg.status = Message.STATUS_CLOSED
    msg.save()

    # Broadcast closed status to all agents
    async_to_sync(channel_layer.group_send)(
        "agents",
        {
            "type": "message_update",
            "message_id": msg.id,
            "status": Message.STATUS_CLOSED,
            "assigned_to": msg.assigned_to.id if msg.assigned_to else None
        }
    )

    return Response({"status": "replied"}, status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['GET', 'POST'])
def canned(request):
    '''
    GET /api/canned/  -> list canned_messages 
    POST /api/canned/ -> create a new canned message
    '''
    if request.method == 'GET':
        qs = CannedResponse.objects.all()
        serializer = CannedResponseSerializer(qs, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        print("Body:", request.body)
        print("Data:", request.data)
        title = request.data.get('title')
        body = request.data.get('body')
        if not title or not body:
            return Response({"detail": "title and body required"}, status=400)

        canned = CannedResponse.objects.create(title=title, body=body)
        return Response({"id": canned.id, "title": canned.title}, status=201)


@csrf_exempt
@api_view(['POST'])
def use_canned_reply(request, message_id):
    """
    POST /api/messages/<id>/use_canned
    body: {"agent_id":1, "canned_id": 3}
    Applies a canned response and marks the message as closed.
    """
    agent_id = request.data.get('agent_id')
    canned_id = request.data.get('canned_id')

    # Validate inputs
    if not agent_id or not canned_id:
        return Response(
            {"detail": "agent_id and canned_id required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate agent
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return Response({"detail": "agent not found"}, status=status.HTTP_404_NOT_FOUND)

# Validate canned response
    try:
        canned = CannedResponse.objects.get(id=canned_id)
    except CannedResponse.DoesNotExist:
        return Response({"detail": "canned reply not found"}, status=status.HTTP_404_NOT_FOUND)

    # Validate message
    try:
        msg = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({"detail": "message not found"}, status=status.HTTP_404_NOT_FOUND)

    if msg.status == Message.STATUS_CLOSED:
        return Response(
            {"detail": "cannot reply to a closed message"},
            status=status.HTTP_400_BAD_REQUEST
    )


    now = timezone.now()

    # Safely assign if message is unassigned
    with transaction.atomic():
        if msg.status == Message.STATUS_UNASSIGNED:
            updated_rows = Message.objects.filter(
                id=message_id,
                status=Message.STATUS_UNASSIGNED
            ).update(
                assigned_to=agent,
                status=Message.STATUS_IN_PROGRESS,
                claimed_at=now
            )

            # Re-fetch message if assigned successfully
            if updated_rows:
                msg.refresh_from_db()

        # Apply canned reply
        msg.response = canned.body
        msg.responded_at = now
        msg.status = Message.STATUS_CLOSED
        msg.assigned_to = agent
        msg.save()

    # Broadcast message closure to all agents
    async_to_sync(channel_layer.group_send)(
        "agents",
        {
            "type": "message_update",
            "message_id": msg.id,
            "status": Message.STATUS_CLOSED,
            "assigned_to": msg.assigned_to.id if msg.assigned_to else None
        }
    )

    return Response(
        {"status": "replied_with_canned"},
        status=status.HTTP_200_OK
    )


