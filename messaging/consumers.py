import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AgentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # join a group called "agents" so we can broadcast to all agents
        await self.channel_layer.group_add("agents", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # leave the group on disconnect
        await self.channel_layer.group_discard("agents", self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # This consumer is broadcast-only from server; we can optionally accept ping messages.
        pass

    # Handler for 'message.update' events sent via channel_layer.group_send
    async def message_update(self, event):
        # event is a dict with keys: 'message_id', 'status', 'assigned_to'
        await self.send(text_data=json.dumps(event))
