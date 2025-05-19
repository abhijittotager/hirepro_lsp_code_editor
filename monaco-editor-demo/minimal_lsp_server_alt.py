#!/usr/bin/env python
"""
Minimal Python LSP WebSocket Server (Alternative Port)

This script creates a minimal WebSocket server that connects to the Python Language Server
and forwards messages between the browser and the LSP server.
"""

import asyncio
import json
import logging
import sys
import websockets
import subprocess
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('minimal_lsp')

# Global variables
clients = set()
message_queue = queue.Queue()

# Use an alternative port
PORT = 2088

def start_lsp_process():
    """Start the Python Language Server process."""
    try:
        logger.info("Starting Python Language Server...")
        process = subprocess.Popen(
            [sys.executable, '-m', 'pyls'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0
        )
        logger.info(f"Python Language Server started with PID: {process.pid}")
        return process
    except Exception as e:
        logger.error(f"Failed to start Python Language Server: {e}")
        return None

def read_from_lsp(process, message_queue):
    """Read messages from the LSP process and put them in the queue."""
    buffer = b''
    while True:
        try:
            # Read data from the LSP server
            chunk = process.stdout.read(1)
            if not chunk:
                logger.info("LSP server closed the connection")
                break
            
            buffer += chunk
            
            # Check for message delimiter
            if buffer.endswith(b'\r\n'):
                try:
                    # Parse the message
                    message = json.loads(buffer[:-2].decode('utf-8'))
                    message_queue.put(message)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from LSP server: {buffer}")
                except Exception as e:
                    logger.error(f"Error processing LSP message: {e}")
                
                # Reset buffer
                buffer = b''
        except Exception as e:
            logger.error(f"Error reading from LSP server: {e}")
            break

async def broadcast_messages():
    """Broadcast messages from the queue to all clients."""
    while True:
        try:
            # Check if there are any messages in the queue
            if not message_queue.empty():
                message = message_queue.get_nowait()
                message_str = json.dumps(message)
                
                # Broadcast to all clients
                if clients:
                    await asyncio.gather(*[client.send(message_str) for client in clients])
            
            # Sleep a bit to avoid busy waiting
            await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
            await asyncio.sleep(0.1)

async def handle_client(websocket, path, lsp_process):
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
                "message": "Connected to Minimal Python LSP Server"
            }
        }))
        
        # Handle messages from the client
        async for message_str in websocket:
            try:
                message = json.loads(message_str)
                
                # Forward to LSP server
                if lsp_process and lsp_process.stdin:
                    lsp_process.stdin.write((json.dumps(message) + '\r\n').encode('utf-8'))
                    lsp_process.stdin.flush()
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
    # Start the LSP process
    lsp_process = start_lsp_process()
    if not lsp_process:
        logger.error("Failed to start LSP process, exiting")
        return
    
    # Start a thread to read from the LSP process
    reader_thread = threading.Thread(
        target=read_from_lsp,
        args=(lsp_process, message_queue),
        daemon=True
    )
    reader_thread.start()
    
    # Start the broadcast task
    broadcast_task = asyncio.create_task(broadcast_messages())
    
    # Start the WebSocket server
    async with websockets.serve(
        lambda ws, path: handle_client(ws, path, lsp_process),
        "localhost", PORT
    ):
        logger.info(f"WebSocket server running at ws://localhost:{PORT}")
        
        try:
            # Keep the server running
            await asyncio.Future()
        finally:
            # Clean up
            broadcast_task.cancel()
            try:
                await broadcast_task
            except asyncio.CancelledError:
                pass
            
            if lsp_process:
                lsp_process.terminate()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        sys.exit(1)
