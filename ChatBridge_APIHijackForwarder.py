"""
sequenceDiagram
    participant User as 外部应用
    participant UserAPI as 用户接口
    participant WS as WebSocket
    participant ST as SillyTavern
    participant STAPI as ST接口
    participant LLMAPI as LLM接口
    participant LLM as 外部LLM

    User->>UserAPI: 1.调用API(OpenAI格式)
    UserAPI->>WS: 2.转发请求到WebSocket
    WS->>ST: 3.通知ST处理请求
    ST->>STAPI: 4.处理后调用ST接口
    STAPI->>LLMAPI: 5.转发到LLM接口
    LLMAPI->>LLM: 6.调用外部LLM
    LLM-->>LLMAPI: 7.返回响应
    LLMAPI-->>STAPI: 8a.转发响应
    LLMAPI-->>UserAPI: 8b.同时转发响应
    UserAPI-->>User: 9.返回给用户
"""
import json
import asyncio
import websockets
import aiohttp
from aiohttp import web
from typing import List, Dict, Any
import logging
import os
from collections import deque
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIKeyRotator:
    def __init__(self, api_keys: List[str]):
        self.api_keys = deque(api_keys)
    
    def get_next_key(self) -> str:
        current_key = self.api_keys[0]
        self.api_keys.rotate(-1)
        return current_key

class ChatBridgeForwarder:
    def __init__(self, settings_path: str):
        with open(settings_path, 'r') as f:
            self.settings = json.load(f)
        
        self.ws_clients = set()
        self.key_rotator = APIKeyRotator(self.settings['llm_api']['api_keys'])
        
        # 定义所有支持的API路径
        self.api_routes = [
            '/v1/chat/completions',
            '/v1/completions',
            '/v1/models',
            '/v1/embeddings',
            '/v1/moderations',
            '/v1/images/generations',
            '/v1/edits',
            '/v1/audio/transcriptions',
            '/v1/audio/translations',
            '/v1/fine-tunes',
            '/v1/files'
        ]
        self.response_futures = {}  # 用于存储请求ID和对应的Future

    async def start(self):
        # 启动WebSocket服务器
        ws_server = websockets.serve(
            self.handle_websocket,
            self.settings['websocket']['host'],
            self.settings['websocket']['port']
        )

        # 创建ST API服务器，支持所有API路径
        st_app = web.Application()
        for route in self.api_routes:
            st_app.router.add_route('*', route, self.handle_st_api)
        st_runner = web.AppRunner(st_app)
        await st_runner.setup()
        st_site = web.TCPSite(
            st_runner,
            self.settings['st_api']['host'],
            self.settings['st_api']['port']
        )

        # 创建用户API服务器
        user_app = web.Application()
        user_app.router.add_post('/v1/chat/completions', self.handle_user_api)
        user_runner = web.AppRunner(user_app)
        await user_runner.setup()
        user_site = web.TCPSite(
            user_runner,
            self.settings['user_api']['host'],
            self.settings['user_api']['port']
        )

        # 启动所有服务器
        await asyncio.gather(
            ws_server,
            st_site.start(),
            user_site.start()
        )
        
        logger.info(f"WebSocket服务器运行在 ws://{self.settings['websocket']['host']}:{self.settings['websocket']['port']}")
        logger.info(f"ST API服务器运行在 http://{self.settings['st_api']['host']}:{self.settings['st_api']['port']}")
        logger.info(f"用户API服务器运行在 http://{self.settings['user_api']['host']}:{self.settings['user_api']['port']}")

    async def handle_websocket(self, websocket):
        self.ws_clients.add(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    logger.info(f"收到WebSocket消息: {data}")
                    
                    # 处理ST的响应
                    if data.get('type') == 'st_response':
                        request_id = data.get('id')
                        if request_id in self.response_futures:
                            future = self.response_futures[request_id]
                            if not future.done():
                                future.set_result(data.get('content'))
                                
                except json.JSONDecodeError:
                    logger.error("无效的WebSocket消息格式")
        finally:
            self.ws_clients.remove(websocket)

    async def forward_request(self, request: web.Request) -> web.Response:
        """通用请求转发函数，保持完整的请求参数和响应"""
        api_key = self.key_rotator.get_next_key()
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': request.headers.get('Content-Type', 'application/json')
        }
        
        # 获取原始请求路径
        path = request.path
        # 构建目标URL
        target_url = f"{self.settings['llm_api']['base_url']}{path}"
        
        try:
            # 获取原始请求数据
            if request.headers.get('Content-Type') == 'application/json':
                data = await request.json()
            else:
                data = await request.read()

            # 获取查询参数
            params = dict(request.query)
            
            async with aiohttp.ClientSession() as session:
                method = request.method
                # 构建请求参数
                req_kwargs = {
                    'headers': headers,
                    'params': params
                }
                
                if method in ['POST', 'PUT', 'PATCH']:
                    if isinstance(data, dict):
                        req_kwargs['json'] = data
                    else:
                        req_kwargs['data'] = data

                # 发送请求
                async with session.request(method, target_url, **req_kwargs) as response:
                    # 处理流式响应
                    if response.headers.get('content-type') == 'text/event-stream':
                        return web.StreamResponse(
                            status=response.status,
                            headers={'Content-Type': 'text/event-stream'}
                        )
                    
                    # 处理普通响应
                    return web.Response(
                        status=response.status,
                        headers=response.headers,
                        body=await response.read()
                    )

        except Exception as e:
            logger.error(f"请求转发错误: {e}")
            return web.Response(status=500, text=str(e))

    async def forward_to_llm(self, request_data: Dict[str, Any], stream: bool = False) -> web.Response:
        api_key = self.key_rotator.get_next_key()
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.settings['llm_api']['base_url']}/chat/completions",
                json=request_data,
                headers=headers
            ) as response:
                if stream:
                    return web.StreamResponse(
                        status=response.status,
                        headers={'Content-Type': 'text/event-stream'}
                    )
                else:
                    return web.json_response(await response.json())

    async def handle_st_api(self, request: web.Request) -> web.Response:
        """处理来自ST的API请求，直接转发给LLM API"""
        if request.headers.get('Authorization') != f"Bearer {self.settings['st_api']['api_key']}":
            return web.Response(status=401)
        
        return await self.forward_request(request)

    async def handle_user_api(self, request: web.Request) -> web.Response:
        if request.headers.get('Authorization') != f"Bearer {self.settings['user_api']['api_key']}":
            return web.Response(status=401)

        request_data = await request.json()
        request_id = str(uuid.uuid4())  # 生成唯一请求ID
        
        # 创建Future用于等待响应
        response_future = asyncio.Future()
        self.response_futures[request_id] = response_future
        
        # 构建WebSocket消息
        ws_message = {
            'type': 'user_request',
            'id': request_id,
            'content': request_data
        }
        
        # 发送给所有连接的WebSocket客户端
        if not self.ws_clients:
            return web.Response(status=503, text="No WebSocket clients connected")
            
# 发送请求到WebSocket
        for ws in self.ws_clients:
            try:
                await ws.send(json.dumps(ws_message))
            except Exception as e:
                logger.error(f"发送WebSocket消息失败: {e}")
                continue
        
        try:
            # 等待响应,设置超时时间
            response = await asyncio.wait_for(response_future, timeout=30.0)
            
            # 处理流式响应
            if response.get('stream', False):
                stream_response = web.StreamResponse(
                    status=200,
                    headers={'Content-Type': 'text/event-stream'}
                )
                await stream_response.prepare(request)
                for chunk in response.get('chunks', []):
                    await stream_response.write(chunk.encode())
                await stream_response.write_eof()
                return stream_response
            
            # 处理普通响应
            return web.json_response(response)
            
        except asyncio.TimeoutError:
            logger.error(f"请求超时: {request_id}")
            return web.Response(status=504, text="Gateway Timeout")
        finally:
            # 清理Future
            self.response_futures.pop(request_id, None)

async def main():
    settings_path = os.path.join(os.path.dirname(__file__), 'settings.json')
    forwarder = ChatBridgeForwarder(settings_path)
    await forwarder.start()
    try:
        await asyncio.Future()  # 保持服务器运行
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    asyncio.run(main())
