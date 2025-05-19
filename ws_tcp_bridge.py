import asyncio
import websockets
import subprocess
import sys
import os
import signal
import json
import logging
import psutil

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('lsp-bridge')

LSP_HOST = '127.0.0.1'
LSP_PORT = 2087
WS_HOST = 'localhost'
WS_PORT = 2090

def kill_existing_processes():
    """Kill any existing Python LSP server or WebSocket bridge processes"""
    current_pid = os.getpid()
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Skip the current process
            if proc.info['pid'] == current_pid:
                continue
                
            # Check if this is a Python process running our scripts
            cmdline = proc.info['cmdline']
            if cmdline and any(x in cmdline for x in ['pylsp_server.py', 'ws_tcp_bridge.py']):
                logger.info(f"Terminating existing process: {proc.info['pid']} - {cmdline}")
                proc.terminate()
                proc.wait(timeout=5)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
            pass

class LSPBridge:
    def __init__(self):
        self.lsp_process = None
        self.ws_server = None
        logger.info("LSPBridge initialized")

    async def start_lsp_server(self):
        try:
            # Start the LSP server process
            logger.info("Starting Python LSP server process")
            self.lsp_process = subprocess.Popen(
                [sys.executable, 'pylsp_server.py'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            
            # Wait a moment for the server to start
            await asyncio.sleep(1)
            
            if self.lsp_process.poll() is not None:
                stderr = self.lsp_process.stderr.read().decode('utf-8')
                raise Exception(f"LSP server failed to start: {stderr}")
                
            logger.info("Python LSP server process started successfully")
        except Exception as e:
            logger.error("Failed to start LSP server: %s", e)
            raise

    async def handle_ws(self, websocket, path):
        if not self.lsp_process or self.lsp_process.poll() is not None:
            logger.error("LSP server not running")
            await websocket.close(1011, "LSP server not running")
            return

        try:
            logger.info("New WebSocket connection established")
            
            # Set up tasks for bidirectional communication
            ws_to_lsp = asyncio.create_task(self.forward_ws_to_lsp(websocket))
            lsp_to_ws = asyncio.create_task(self.forward_lsp_to_ws(websocket))
            
            # Wait for either task to complete
            done, pending = await asyncio.wait(
                [ws_to_lsp, lsp_to_ws],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel any pending tasks
            for task in pending:
                task.cancel()
                
            logger.info("WebSocket connection closed")
        except websockets.ConnectionClosed:
            logger.info("WebSocket connection closed normally")
        except Exception as e:
            logger.error("Error in WebSocket handler: %s", e)
            await websocket.close(1011, str(e))

    async def forward_ws_to_lsp(self, websocket):
        try:
            async for message in websocket:
                if self.lsp_process.poll() is not None:
                    logger.error("LSP server process terminated")
                    break
                # Add Content-Length header
                content = message.encode('utf-8')
                header = f"Content-Length: {len(content)}\r\n\r\n".encode('utf-8')
                self.lsp_process.stdin.write(header + content)
                await self.lsp_process.stdin.drain()
        except Exception as e:
            logger.error("Error forwarding WebSocket to LSP: %s", e)

    async def forward_lsp_to_ws(self, websocket):
        try:
            while True:
                if self.lsp_process.poll() is not None:
                    logger.error("LSP server process terminated")
                    break
                    
                # Read the header
                header = await asyncio.get_event_loop().run_in_executor(
                    None, self.lsp_process.stdout.readline
                )
                if not header:
                    break
                    
                # Parse Content-Length
                content_length = int(header.decode('utf-8').split(': ')[1])
                
                # Read the message
                message = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: self.lsp_process.stdout.read(content_length)
                )
                if not message:
                    break
                    
                # Forward to WebSocket
                await websocket.send(message.decode('utf-8'))
        except Exception as e:
            logger.error("Error forwarding LSP to WebSocket: %s", e)

    async def start(self):
        try:
            # Kill any existing processes
            kill_existing_processes()
            
            # Start the LSP server
            await self.start_lsp_server()
            
            # Start the WebSocket server
            logger.info(f"Starting WebSocket server on ws://{WS_HOST}:{WS_PORT}")
            self.ws_server = await websockets.serve(
                self.handle_ws,
                WS_HOST,
                WS_PORT
            )
            
            logger.info(f"WebSocket bridge running at ws://{WS_HOST}:{WS_PORT}/")
            logger.info("Press Ctrl+C to stop")
            
            # Keep the server running
            await asyncio.Future()
            
        except Exception as e:
            logger.error("Error starting bridge: %s", e)
            self.cleanup()
            sys.exit(1)

    def cleanup(self):
        logger.info("Cleaning up resources")
        if self.lsp_process:
            try:
                logger.info("Terminating LSP server process")
                self.lsp_process.terminate()
                self.lsp_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                logger.warning("LSP server process did not terminate gracefully, killing it")
                self.lsp_process.kill()
            except Exception as e:
                logger.error("Error cleaning up LSP server process: %s", e)
        
        if self.ws_server:
            logger.info("Closing WebSocket server")
            self.ws_server.close()

def main():
    bridge = LSPBridge()
    
    # Set up signal handlers
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown(bridge)))
    
    try:
        loop.run_until_complete(bridge.start())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    finally:
        bridge.cleanup()
        loop.close()

async def shutdown(bridge):
    logger.info("Shutting down...")
    bridge.cleanup()
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    [task.cancel() for task in tasks]
    await asyncio.gather(*tasks, return_exceptions=True)
    asyncio.get_event_loop().stop()

if __name__ == '__main__':
    main() 