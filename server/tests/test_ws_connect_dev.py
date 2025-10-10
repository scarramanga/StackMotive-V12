"""
WebSocket Connection Diagnostic Test Script
Tests both Socket.IO (correct protocol) and native WebSocket (incorrect protocol)
"""
import asyncio
import socketio
import websockets
import jwt
import sys
from datetime import datetime, timedelta

def generate_dev_token():
    """Generate a test JWT token"""
    payload = {
        "sub": "1",
        "user_id": "1",
        "tier": "navigator",
        "aud": "stackmotive-app",
        "iss": "stackmotive.com",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    secret = "e2e-test-secret-key-do-not-use-in-production"
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token

async def test_socketio_connection():
    """Test with Socket.IO client (CORRECT protocol)"""
    print("\n" + "="*60)
    print("TEST 1: Socket.IO Client (Correct Protocol)")
    print("="*60)
    
    token = generate_dev_token()
    print(f"Generated JWT token: {token[:30]}...")
    
    try:
        sio = socketio.AsyncClient(logger=True, engineio_logger=True)
        
        @sio.on('connected')
        async def on_connected(data):
            print(f"✅ SUCCESS: Received 'connected' event: {data}")
        
        @sio.on('connect_error')
        async def on_connect_error(data):
            print(f"❌ Connection error: {data}")
        
        print(f"Connecting to http://localhost:8001/socket.io/ with auth token...")
        await sio.connect(
            'http://localhost:8001',
            socketio_path='/socket.io/',
            auth={'token': token},
            wait_timeout=10
        )
        
        print(f"✅ Connected! SID: {sio.sid}")
        await asyncio.sleep(2)
        
        await sio.disconnect()
        print("✅ Disconnected cleanly")
        return True
        
    except Exception as e:
        print(f"❌ Socket.IO test FAILED: {e}")
        return False

async def test_native_websocket():
    """Test with native WebSocket client (INCORRECT protocol)"""
    print("\n" + "="*60)
    print("TEST 2: Native WebSocket Client (Incorrect Protocol)")
    print("="*60)
    
    token = generate_dev_token()
    print(f"Generated JWT token: {token[:30]}...")
    
    try:
        uri = f"ws://localhost:8001/socket.io/?token={token}"
        print(f"Connecting to {uri}...")
        
        async with websockets.connect(uri) as websocket:
            print(f"✅ Raw WebSocket connected!")
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            print(f"Received: {response}")
            return True
            
    except Exception as e:
        print(f"❌ Native WebSocket test FAILED (EXPECTED): {e}")
        print("This is expected because the server uses Socket.IO protocol, not native WebSocket")
        return False

async def main():
    print("WebSocket Connection Diagnostic Tests")
    print("Backend should be running on http://localhost:8001 (docker-compose)")
    print("\nThis script tests:")
    print("1. Socket.IO client (correct protocol) - should succeed")
    print("2. Native WebSocket client (incorrect protocol) - should fail")
    
    socketio_success = await test_socketio_connection()
    
    websocket_success = await test_native_websocket()
    
    print("\n" + "="*60)
    print("DIAGNOSTIC RESULTS")
    print("="*60)
    print(f"Socket.IO Client: {'✅ PASSED' if socketio_success else '❌ FAILED'}")
    print(f"Native WebSocket: {'❌ FAILED (Expected)' if not websocket_success else '✅ PASSED (Unexpected!)'}")
    print("\nCONCLUSION:")
    if socketio_success and not websocket_success:
        print("✅ Backend works correctly with Socket.IO protocol")
        print("❌ Client in use-websocket.ts uses native WebSocket (protocol mismatch)")
        print("📝 FIX: Client needs to use socket.io-client library instead of native WebSocket")
    else:
        print("⚠️ Unexpected results - review logs")

if __name__ == "__main__":
    asyncio.run(main())
