# WebSocket 테스트용 코드
'''
http://127.0.0.1:8000/ 로 접속
여러 창 열어서 Your ID 입력 후 Connect 누르고 채팅하기
borodcast는 전역에 뿌려서 사용(로그에 쓸지 확인 필요)
group_id는 그룹별로 뿌릴 때 사용(알림창에 사용)
=> str말고 dict로 받을 수 있음
무슨 값 주고받을지 회의 필요

로그인 하면 바로 구동

'''

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
        <script>
            var ws;
            function 접속() {
              var client_id = document.getElementById("ws-id").value;
              ws = new WebSocket(`ws://localhost:8000/ws/${client_id}`);
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            }
        </script>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <h2>Your ID: <input type="text" id="ws-id"/><button onclick="접속()">Connect</button></h2>
        <hr />
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>            
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


class ConnectionManager:
    def __init__(self):
        # self.active_connections: list[WebSocket] = []
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        # self.active_connections.append(websocket)
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: str):
        # self.active_connections.remove(websocket)
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            # 그룹에 아무도 없으면 그룹 삭제
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def send_to_group(self, message: str, group_id: str):
        # await websocket.send_text(message)
        # 특정 그룹에 속한 사람들에게만 메시지 전송
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_text(message)
    #  전역에 뿌릴때만 사용(로그는 이건지 확인 필요)
    # async def broadcast(self, message: str):
    #     for connection in self.active_connections:
    #         await connection.send_text(message)


manager = ConnectionManager()


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            # await manager.send_personal_message(f"You wrote: {data}", websocket)
            # await manager.broadcast(f"Client #{client_id} says: {data}")
            await manager.send_to_group(f"[{group_id}] 유저: {data}", group_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
        await manager.broadcast(f"Client #{group_id} left the chat")

