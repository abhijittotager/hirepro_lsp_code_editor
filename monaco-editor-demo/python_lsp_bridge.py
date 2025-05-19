#!/usr/bin/env python
"""
Python Language Server WebSocket Bridge

This script creates a WebSocket server that bridges between the browser-based
Monaco editor and the Python Language Server Protocol (LSP) server.
"""

import asyncio
import json
import logging
import os
import sys
import signal
import websockets
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('lsp_bridge.log')
    ]
)
logger = logging.getLogger('pyls_websocket')

# Global variables
websocket_clients = set()
lsp_process = None
reader = None
writer = None

async def start_language_server():
    """Start the Python Language Server as a subprocess."""
    global lsp_process, reader, writer
    
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
        
        # Set up pipes for communication
        reader = lsp_process.stdout
        writer = lsp_process.stdin
        
        return True
    except Exception as e:
        logger.error(f"Failed to start Python Language Server: {e}")
        return False

async def handle_client_message(websocket, message_str):
    """Handle a message from a WebSocket client and forward it to the LSP server."""
    global writer
    
    try:
        # Parse the message
        message = json.loads(message_str)
        
        # Log the message (excluding potentially large content)
        log_message = message.copy()
        if 'params' in log_message and 'textDocument' in log_message.get('params', {}):
            if 'text' in log_message['params']['textDocument']:
                log_message['params']['textDocument']['text'] = '...<content omitted>...'
        logger.debug(f"Client -> LSP: {json.dumps(log_message)}")
        
        # Write the message to the LSP server
        if writer:
            message_bytes = (json.dumps(message) + '\r\n').encode('utf-8')
            writer.write(message_bytes)
            await writer.drain()
        else:
            logger.error("Cannot forward message to LSP server: writer is None")
            await websocket.send(json.dumps({
                "jsonrpc": "2.0",
                "method": "window/showMessage",
                "params": {
                    "type": 1,  # Error
                    "message": "LSP server not connected"
                }
            }))
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON received from client: {message_str}")
    except Exception as e:
        logger.error(f"Error handling client message: {e}")

async def read_from_lsp():
    """Read messages from the LSP server and broadcast them to WebSocket clients."""
    global reader
    
    if not reader:
        logger.error("Cannot read from LSP server: reader is None")
        return
    
    buffer = b''
    
    while True:
        try:
            # Read data from the LSP server
            data = await reader.read(4096)
            if not data:
                logger.info("LSP server closed the connection")
                break
            
            buffer += data
            
            # Process complete messages
            while b'\r\n' in buffer:
                message_bytes, buffer = buffer.split(b'\r\n', 1)
                message_str = message_bytes.decode('utf-8')
                
                try:
                    # Parse and log the message
                    message = json.loads(message_str)
                    logger.debug(f"LSP -> Client: {json.dumps(message)}")
                    
                    # Broadcast to all connected WebSocket clients
                    if websocket_clients:
                        await asyncio.gather(
                            *[client.send(message_str) for client in websocket_clients]
                        )
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received from LSP server: {message_str}")
                except Exception as e:
                    logger.error(f"Error broadcasting LSP message: {e}")
        
        except asyncio.CancelledError:
            logger.info("LSP reader task cancelled")
            break
        except Exception as e:
            logger.error(f"Error reading from LSP server: {e}")
            break

async def handle_websocket(websocket, path):
    """Handle WebSocket connections from clients."""
    client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    logger.info(f"New WebSocket client connected: {client_info}")
    
    # Add the client to our set
    websocket_clients.add(websocket)
    
    try:
        # Send a notification that we're connected
        await websocket.send(json.dumps({
            "jsonrpc": "2.0",
            "method": "window/showMessage",
            "params": {
                "type": 3,  # Info
                "message": "Connected to Python LSP WebSocket bridge"
            }
        }))
        
        # Handle messages from this client
        async for message in websocket:
            await handle_client_message(websocket, message)
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"WebSocket client disconnected (connection closed): {client_info}")
    except Exception as e:
        logger.error(f"Error handling WebSocket client: {e}")
    finally:
        # Remove the client from our set
        websocket_clients.remove(websocket)
        logger.info(f"WebSocket client removed: {client_info}")

async def shutdown():
    """Shutdown the LSP server and clean up resources."""
    global lsp_process
    
    logger.info("Shutting down...")
    
    # Close all WebSocket connections
    if websocket_clients:
        await asyncio.gather(*[client.close() for client in websocket_clients])
        websocket_clients.clear()
    
    # Terminate the LSP process
    if lsp_process:
        try:
            lsp_process.terminate()
            await asyncio.wait_for(lsp_process.wait(), timeout=5.0)
            logger.info("LSP process terminated")
        except asyncio.TimeoutError:
            logger.warning("LSP process did not terminate in time, killing it")
            lsp_process.kill()
        except Exception as e:
            logger.error(f"Error terminating LSP process: {e}")

async def main():
    """Main entry point for the WebSocket bridge."""
    # Start the Python Language Server
    lsp_started = await start_language_server()
    if not lsp_started:
        logger.error("Failed to start Python Language Server, exiting")
        return
    
    # Start the task to read from the LSP server
    lsp_reader_task = asyncio.create_task(read_from_lsp())
    
    # Start the WebSocket server
    port = 2087  # This should match the port in your Monaco Editor configuration
    server = await websockets.serve(handle_websocket, "localhost", port)
    
    logger.info(f"WebSocket server started on ws://localhost:{port}")
    
    # Set up signal handlers for graceful shutdown
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown()))
    
    try:
        # Keep the server running until interrupted
        await asyncio.Future()
    finally:
        # Clean up
        lsp_reader_task.cancel()
        try:
            await lsp_reader_task
        except asyncio.CancelledError:
            pass
        
        server.close()
        await server.wait_closed()
        
        await shutdown()
        
        logger.info("Python LSP WebSocket bridge stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        sys.exit(1)
