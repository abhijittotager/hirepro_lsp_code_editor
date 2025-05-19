#!/usr/bin/env python
"""
Python Language Server WebSocket bridge
This script starts a Python Language Server and creates a WebSocket server
that bridges between the browser-based Monaco editor and the LSP server.
"""

import asyncio
import json
import logging
import sys
import websockets
from pyls_jsonrpc.streams import JsonRpcStreamReader, JsonRpcStreamWriter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('pyls_websocket')

# Global variables
websocket_clients = set()
reader_queue = asyncio.Queue()
writer_queue = asyncio.Queue()

async def start_language_server():
    """Start the Python Language Server as a subprocess."""
    logger.info("Starting Python Language Server...")
    
    # Start the Python Language Server process
    process = await asyncio.create_subprocess_exec(
        sys.executable, '-m', 'pyls',
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    logger.info(f"Python Language Server started with PID: {process.pid}")
    
    # Create JSON-RPC readers and writers
    reader = JsonRpcStreamReader(process.stdout)
    writer = JsonRpcStreamWriter(process.stdin)
    
    return process, reader, writer

async def handle_lsp_message(reader, writer):
    """Handle messages from the LSP server and forward them to WebSocket clients."""
    while True:
        try:
            message = await reader_queue.get()
            if message is None:
                break
                
            # Send the message to the LSP server
            await writer.write(message)
            
        except Exception as e:
            logger.error(f"Error handling LSP message: {e}")
            break

async def read_from_lsp(reader):
    """Read messages from the LSP server and broadcast them to WebSocket clients."""
    while True:
        try:
            message = await reader.read()
            if message is None:
                break
                
            # Convert the message to JSON string
            message_str = json.dumps(message)
            
            # Broadcast to all connected WebSocket clients
            if websocket_clients:
                await asyncio.gather(
                    *[client.send(message_str) for client in websocket_clients]
                )
            
        except Exception as e:
            logger.error(f"Error reading from LSP: {e}")
            break

async def handle_websocket(websocket, path):
    """Handle WebSocket connections from clients."""
    logger.info(f"New WebSocket client connected: {websocket.remote_address}")
    
    # Add the client to our set
    websocket_clients.add(websocket)
    
    try:
        # Send a notification that we're connected
        await websocket.send(json.dumps({
            "jsonrpc": "2.0",
            "method": "window/logMessage",
            "params": {
                "type": 3,  # Info
                "message": "Connected to Python Language Server WebSocket bridge"
            }
        }))
        
        # Handle messages from this client
        async for message in websocket:
            try:
                # Parse the message
                data = json.loads(message)
                
                # Add to the queue for the LSP server
                await reader_queue.put(data)
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {message}")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
    
    finally:
        # Remove the client from our set
        websocket_clients.remove(websocket)
        logger.info(f"WebSocket client disconnected: {websocket.remote_address}")

async def main():
    """Main entry point for the WebSocket bridge."""
    logger.info("Starting Python LSP WebSocket bridge...")
    
    # Start the Python Language Server
    process, reader, writer = await start_language_server()
    
    # Start the tasks for handling LSP messages
    lsp_handler_task = asyncio.create_task(handle_lsp_message(reader, writer))
    lsp_reader_task = asyncio.create_task(read_from_lsp(reader))
    
    # Start the WebSocket server
    port = 2087  # This should match the port in your Monaco Editor configuration
    server = await websockets.serve(handle_websocket, "localhost", port)
    
    logger.info(f"WebSocket server started on ws://localhost:{port}")
    
    try:
        # Keep the server running until interrupted
        await asyncio.Future()
    finally:
        # Clean up
        server.close()
        await server.wait_closed()
        
        # Stop the LSP handler tasks
        lsp_handler_task.cancel()
        lsp_reader_task.cancel()
        
        # Terminate the LSP process
        process.terminate()
        await process.wait()
        
        logger.info("Python LSP WebSocket bridge stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        sys.exit(1)
