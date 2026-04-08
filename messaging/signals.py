import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Message

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Message)
def broadcast_message_update(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    try:
        if created:
            async_to_sync(channel_layer.group_send)(
                "agents",
                {
                    "type": "message_new",
                    "message_id": str(instance.external_id),
                    "status": instance.status,
                    "body": instance.body
                }
            )
        else:
            # It's an update (claimed, replied, etc.)
            async_to_sync(channel_layer.group_send)(
                "agents",
                {
                    "type": "message_update",
                    "message_id": str(instance.external_id),
                    "status": instance.status,
                    "assigned_to": str(instance.assigned_to.external_id) if instance.assigned_to else None
                }
            )
    except Exception as e:
        # Prevent broadcast failures from crashing the main transaction
        logger.error(f"Failed to broadcast message update for {instance.external_id}: {str(e)}")
