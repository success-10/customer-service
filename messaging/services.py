from django.db import transaction
from django.utils import timezone
from .models import Message, Agent, CannedResponse, InteractionLog, Customer, MessageReply
from .utils import calculate_priority

class ApplicationError(Exception):
    pass

class MessageService:
    @staticmethod
    def create_message(*, user_id: str, body: str, name: str = None, phone: str = None, email: str = None) -> Message:
        customer, created = Customer.objects.get_or_create(user_id=user_id)
        
        # Update customer details if provided
        if any([name, phone, email]):
            if name: customer.name = name
            if phone: customer.phone = phone
            if email: customer.email = email
            customer.save()

        now = timezone.now()
        
        # Calculate priority right on creation
        priority = calculate_priority(body, now, Message.STATUS_UNASSIGNED)
        
        msg = Message.objects.create(
            customer=customer,
            body=body,
            status=Message.STATUS_UNASSIGNED,
            timestamp=now,
            priority=priority
        )
        InteractionLog.objects.create(message=msg, action="CREATED")
        return msg

    @staticmethod
    def claim_message(*, message_external_id: str, agent_external_id: str) -> Message:
        try:
            agent = Agent.objects.get(external_id=agent_external_id)
        except Agent.DoesNotExist:
            raise ApplicationError("Invalid agent_id")

        now = timezone.now()

        with transaction.atomic():
            # Best in class concurrency control: select_for_update with skip_locked
            msg = Message.objects.select_for_update(skip_locked=True).filter(
                external_id=message_external_id,
                status=Message.STATUS_UNASSIGNED
            ).first()

            if not msg:
                # Check if it was already claimed by someone else
                existing = Message.objects.filter(external_id=message_external_id).select_related('assigned_to').first()
                if not existing:
                    raise ApplicationError("message not found")
                
                assigned_name = existing.assigned_to.name if existing.assigned_to else "Unknown Agent"
                raise ApplicationError(f"already_claimed_by:{assigned_name}")

            msg.assigned_to = agent
            msg.status = Message.STATUS_IN_PROGRESS
            msg.claimed_at = now
            msg.save(update_fields=['assigned_to', 'status', 'claimed_at'])

            InteractionLog.objects.create(message=msg, agent=agent, action="CLAIMED")
            return msg

    @staticmethod
    def reply_message(*, message_external_id: str, agent_external_id: str, text: str) -> Message:
        if not text or not text.strip():
            raise ApplicationError("non-empty text is required")

        try:
            agent = Agent.objects.get(external_id=agent_external_id)
            msg = Message.objects.get(external_id=message_external_id)
        except (Agent.DoesNotExist, Message.DoesNotExist):
            raise ApplicationError("agent or message not found")

        if msg.status == Message.STATUS_CLOSED:
            raise ApplicationError("cannot reply to a closed message")

        if msg.assigned_to_id and str(msg.assigned_to.external_id) != str(agent_external_id):
            raise ApplicationError("message assigned to another agent")

        reply = MessageReply.objects.create(
            message=msg,
            agent=agent,
            is_customer=False,
            text=text
        )

        # If it was unassigned, automatically assign it to this agent
        if not msg.assigned_to_id:
            msg.assigned_to = agent
            msg.status = Message.STATUS_IN_PROGRESS
            msg.save(update_fields=['status', 'assigned_to'])
            
        InteractionLog.objects.create(message=msg, agent=agent, action="REPLIED")
        return msg

    @staticmethod
    def customer_reply(*, message_external_id: str, text: str) -> Message:
        if not text or not text.strip():
            raise ApplicationError("non-empty text is required")
            
        try:
            msg = Message.objects.get(external_id=message_external_id)
        except Message.DoesNotExist:
            raise ApplicationError("message not found")
            
        reply = MessageReply.objects.create(
            message=msg,
            is_customer=True,
            text=text
        )
        
        # If the ticket was closed, re-open it
        if msg.status == Message.STATUS_CLOSED:
            msg.status = Message.STATUS_IN_PROGRESS
            msg.save(update_fields=['status'])
            
        InteractionLog.objects.create(message=msg, action="CUSTOMER_REPLIED")
        return msg

    @staticmethod
    def use_canned_reply(*, message_external_id: str, agent_external_id: str, canned_external_id: str) -> Message:
        try:
            canned = CannedResponse.objects.get(external_id=canned_external_id)
        except CannedResponse.DoesNotExist:
            raise ApplicationError("canned reply not found")

        # Reuse reply text logic
        return MessageService.reply_message(
            message_external_id=message_external_id,
            agent_external_id=agent_external_id,
            text=canned.body
        )
