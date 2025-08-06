# tasks/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from tasks.utils import is_admin_async

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        is_admin_user = await is_admin_async(user)
        # Assign group name
        self.group_name = "admins" if is_admin_user else f"user_{user.id}"

        print(f"WebSocket trying to connect, user: {user} (auth: {user.is_authenticated})")

        if not user.is_authenticated:
            print("User not authenticated. Closing WebSocket.")
            await self.close()
            return
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass  # (optional) receive messages from frontend

    async def send_task_update(self, event):
        await self.send(text_data=json.dumps(event["content"]))
