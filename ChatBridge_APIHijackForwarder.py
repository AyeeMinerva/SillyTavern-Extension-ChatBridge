"""
sequenceDiagram
    participant User as 外部应用
    participant UserAPI as 用户接口
    participant WS as WebSocket
    participant ST as SillyTavern
    participant STAPI as ST接口
    participant LLMAPI as LLM接口
    participant LLM as 外部LLM
    
    USER,ST,LLM均属外部逻辑,此脚本不应包含具体实现

    User->>UserAPI: 1.调用API(OpenAI格式)
    UserAPI->>WS: 2.转发请求到WebSocket
    WS->>ST: 3.通知ST处理请求
    ST->>STAPI: 4.处理后调用ST接口
    STAPI->>LLMAPI: 5.转发到LLM接口
    LLMAPI->>LLM: 6.调用外部LLM
    LLM-->>LLMAPI: 7.返回响应
    LLMAPI-┬->>STAPI: 8a.转发响应
           └->>UserAPI: 8b.同时转发响应
    STAPI-->ST: 9a.返回给ST
    UserAPI-->>User: 9b.返回给用户
"""
#            "REMOVED",
#        "base_url": "https://api.aiuvdt.top",
#
        #"base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
import json
import asyncio
import websockets
import aiohttp
import logging
import os
from collections import deque
import uuid
from aiohttp import web
from typing import List, Dict, Any

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
        self.response_futures = {}
        
    async def start(self):
        # 启动WebSocket服务器
        ws_server = websockets.serve(
            self.handle_websocket,
            self.settings['websocket']['host'],
            self.settings['websocket']['port']
        )

        # 创建ST API服务器
        st_app = web.Application()
        # 修改路由处理
        st_app.router.add_get('/models', self.handle_models)
        st_app.router.add_get('/v1/models', self.handle_models)
        st_app.router.add_post('/chat/completions', self.handle_chat_completions)
        st_app.router.add_post('/v1/chat/completions', self.handle_chat_completions)
            
        #初始化ST API服务器
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
                data = json.loads(message)
                logger.info(f"Received WebSocket message: {data}")
                
                if data.get('type') == 'st_response':
                    request_id = data.get('id')
                    if request_id in self.response_futures:
                        future = self.response_futures[request_id]
                        if not future.done():
                            future.set_result(data.get('content'))
                            logger.info(f"Resolved future for request_id: {request_id}")
        finally:
            self.ws_clients.remove(websocket)

    async def handle_user_api(self, request: web.Request) -> web.Response:
        """处理来自用户的API请求"""
        if request.headers.get('Authorization') != f"Bearer {self.settings['user_api']['api_key']}":
            return web.Response(status=401)

        try:
            request_data = await request.json()
            request_id = str(uuid.uuid4())
            is_stream = request_data.get('stream', False)
            logger.info(f"用户API请求 ID={request_id}, stream={is_stream}")

            if is_stream:
                # 创建流式响应
                stream_response = web.StreamResponse(
                    status=200,
                    headers={
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    }
                )
                await stream_response.prepare(request)
                
                # 创建事件队列
                queue = asyncio.Queue() 
                self.response_futures[request_id] = queue

                try:
                    # 发送WebSocket消息
                    ws_message = {
                        'type': 'user_request',
                        'id': request_id,
                        'content': request_data
                    }
                    
                    if not self.ws_clients:
                        return web.Response(status=503, text="No WebSocket clients connected")
                    
                    for ws in self.ws_clients:
                        try:
                            await ws.send(json.dumps(ws_message))
                            logger.info(f"已发送请求到WebSocket: ID={request_id}")
                            break
                        except Exception as e:
                            logger.error(f"发送WebSocket消息失败: {e}")
                            continue

                    # 等待并转发响应块
                    received_chunks = []
                    while True:
                        try:
                            chunk = await asyncio.wait_for(queue.get(), timeout=60.0)
                            
                            # 只处理非空的有效数据
                            if chunk and isinstance(chunk, str):
                                chunk = chunk.strip()
                                if not chunk:
                                    continue
                                    
                                if chunk == '[DONE]':
                                    await stream_response.write(b'data: [DONE]\n\n')
                                    logger.info(f"发送流式响应结束标记: ID={request_id}")
                                    break
                                    
                                # 确保响应格式正确
                                if not chunk.startswith('data: '):
                                    chunk = f'data: {chunk}'
                                if not chunk.endswith('\n\n'):
                                    chunk = f'{chunk}\n\n'
                                    
                                logger.debug(f"发送响应块: {chunk.strip()}")
                                await stream_response.write(chunk.encode())
                                
                        except asyncio.TimeoutError:
                            logger.warning(f"等待响应块超时: ID={request_id}")
                            await stream_response.write(b'data: [DONE]\n\n')
                            break
                            
                    return stream_response
                    
                finally:
                    # 清理队列
                    self.response_futures.pop(request_id, None)
            else:
                # 处理非流式请求
                future = asyncio.Future()
                self.response_futures[request_id] = future
                
                # 发送WebSocket消息
                ws_message = {
                    'type': 'user_request',
                    'id': request_id,
                    'content': request_data
                }
                
                if not self.ws_clients:
                    return web.Response(status=503, text="No WebSocket clients connected")
                    
                for ws in self.ws_clients:
                    try:
                        await ws.send(json.dumps(ws_message))
                        logger.info(f"已发送请求到WebSocket: ID={request_id}")
                        break
                    except Exception as e:
                        logger.error(f"发送WebSocket消息失败: {e}")
                        continue
                
                try:
                    # 等待响应
                    response = await asyncio.wait_for(future, timeout=60.0)
                    return web.json_response(response)
                finally:
                    self.response_futures.pop(request_id, None)

        except Exception as e:
            logger.error(f"处理用户API请求失败: {str(e)}", exc_info=True)
            return web.Response(status=500, text=f"Internal Server Error: {str(e)}")
      
    async def handle_models(self, request: web.Request) -> web.Response:
        """处理模型列表请求"""
        logger.info(f"收到models请求: {request.path}")
        api_key = self.key_rotator.get_next_key()
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                #remove v1/ of llm_api
                target_url = f"{self.settings['llm_api']['base_url']}/models"
                logger.info(f"转发请求到: {target_url}")
                async with session.get(target_url, headers=headers) as response:
                    response_data = await response.json()
                    logger.info(f"模型列表响应: {response_data}")
                    return web.json_response(response_data)
        except Exception as e:
            logger.error(f"获取模型列表失败: {str(e)}")
            return web.Response(status=500, text=str(e))

    async def handle_chat_completions(self, request: web.Request) -> web.Response:
        # This function is now a simple proxy.
        # The hijacking logic has been removed.
        try:
            request_data = await request.json()
            api_key = self.key_rotator.get_next_key()
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            target_url = f"{self.settings['llm_api']['base_url']}/chat/completions"

            async with aiohttp.ClientSession() as session:
                async with session.post(target_url, json=request_data, headers=headers) as llm_response:
                    response_data = await llm_response.read()
                    return web.Response(
                        body=response_data,
                        status=llm_response.status,
                        headers=llm_response.headers
                    )
        except Exception as e:
            error_msg = f"处理聊天完成请求失败: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return web.Response(status=500, text=error_msg)
    
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
