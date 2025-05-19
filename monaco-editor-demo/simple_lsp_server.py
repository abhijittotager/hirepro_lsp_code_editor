#!/usr/bin/env python
"""
Simple Python LSP WebSocket Server

This script creates a simple WebSocket server that connects to the Python Language Server
and forwards messages between the browser and the LSP server.
"""

import asyncio
import json
import logging
import sys
import websockets
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('simple_lsp')

# Global variables
clients = set()
lsp_process = None

async def start_lsp_server():
    """Start the Python Language Server as a subprocess."""
    global lsp_process
    
    try:
        logger.info("Starting Python Language Server...")
        
        # Start the Python Language Server process
        lsp_process = await asyncio.create_subprocess_exec(
            sys.executable, '-m', 'pyls',
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        logger.info(f"Python Language Server started with PID: {lsp_process.pid}")
        return True
    except Exception as e:
        logger.error(f"Failed to start Python Language Server: {e}")
        return False

async def forward_to_lsp(message):
    """Forward a message to the LSP server."""
    if not lsp_process or not lsp_process.stdin:
        logger.error("Cannot forward message: LSP process not available")
        return False
    
    try:
        # Add newline to the message as required by the LSP protocol
        message_str = json.dumps(message) + '\r\n'
        lsp_process.stdin.write(message_str.encode('utf-8'))
        await lsp_process.stdin.drain()
        return True
    except Exception as e:
        logger.error(f"Error forwarding message to LSP: {e}")
        return False

async def read_from_lsp():
    """Read messages from the LSP server and broadcast to clients."""
    if not lsp_process or not lsp_process.stdout:
        logger.error("Cannot read from LSP: process not available")
        return
    
    buffer = b''
    
    while True:
        try:
            # Read data from the LSP server
            chunk = await lsp_process.stdout.read(4096)
            if not chunk:
                logger.info("LSP server closed the connection")
                break
            
            buffer += chunk
            
            # Process complete messages (delimited by \r\n)
            while b'\r\n' in buffer:
                message_bytes, buffer = buffer.split(b'\r\n', 1)
                
                try:
                    # Parse the message
                    message = json.loads(message_bytes.decode('utf-8'))
                    
                    # Broadcast to all clients
                    if clients:
                        message_str = json.dumps(message)
                        await asyncio.gather(*[client.send(message_str) for client in clients])
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from LSP server: {message_bytes}")
                except Exception as e:
                    logger.error(f"Error broadcasting LSP message: {e}")
        
        except asyncio.CancelledError:
            logger.info("LSP reader task cancelled")
            break
        except Exception as e:
            logger.error(f"Error reading from LSP server: {e}")
            await asyncio.sleep(0.1)  # Avoid tight loop if there's an error

async def handle_client(websocket, path):
    """Handle a WebSocket client connection."""
    client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    logger.info(f"Client connected: {client_info}")
    
    # Add the client to our set
    clients.add(websocket)
    
    try:
        # Send a welcome message
        await websocket.send(json.dumps({
            "jsonrpc": "2.0",
            "method": "window/logMessage",
            "params": {
                "type": 3,  # Info
                "message": "Connected to Simple Python LSP Server"
            }
        }))
        
        # Handle messages from the client
        async for message_str in websocket:
            try:
                message = json.loads(message_str)
                await forward_to_lsp(message)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from client: {message_str}")
            except Exception as e:
                logger.error(f"Error handling client message: {e}")
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client disconnected: {client_info}")
    except Exception as e:
        logger.error(f"Error handling client: {e}")
    finally:
        # Remove the client from our set
        clients.remove(websocket)

async def main():
    """Main entry point for the WebSocket server."""
    # Start the LSP server
    lsp_started = await start_lsp_server()
    if not lsp_started:
        logger.error("Failed to start LSP server, exiting")
        return
    
    # Start reading from the LSP server
    lsp_reader_task = asyncio.create_task(read_from_lsp())
    
    # Start the WebSocket server
    port = 2087
    server = await websockets.serve(handle_client, "localhost", port)
    
    logger.info(f"WebSocket server running at ws://localhost:{port}")
    
    try:
        # Keep the server running
        await asyncio.Future()
    finally:
        # Clean up
        server.close()
        await server.wait_closed()
        
        lsp_reader_task.cancel()
        try:
            await lsp_reader_task
        except asyncio.CancelledError:
            pass
        
        if lsp_process:
            lsp_process.terminate()
            await lsp_process.wait()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        sys.exit(1)
