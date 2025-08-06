# core/asgi.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from tasks.middleware import TokenAuthMiddleware
from channels.auth import AuthMiddlewareStack  # keep for fallback
import tasks.routing

print("✅ ASGI routing is being used correctly!")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(
            tasks.routing.websocket_urlpatterns  # WebSocket route comes from here
        )
    ),
})
