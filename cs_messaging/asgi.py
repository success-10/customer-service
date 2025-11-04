"""
ASGI config for cs_messaging project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from django.core.asgi import get_asgi_application
import messaging.routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs_messaging.settings')
django.setup()

# HTTP (Django views) and WebSocket (Channels consumers) routing
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handles normal HTTP requests
    "websocket": AuthMiddlewareStack(  # Wraps websocket with auth (no auth needed, but safe)
        URLRouter(
            messaging.routing.websocket_urlpatterns
        )
    ),
})