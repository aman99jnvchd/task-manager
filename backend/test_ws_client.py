import asyncio
import websockets

async def test_ws():
    uri = "ws://127.0.0.1:8000/ws/tasks/"
    async with websockets.connect(uri) as websocket:
        print("✅ Connected to WebSocket!")
        while True:
            message = await websocket.recv()
            print("📩 Received:", message)

asyncio.run(test_ws())
