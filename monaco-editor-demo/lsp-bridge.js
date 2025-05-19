/**
 * LSP-Bridge - Connects JDT.LS standard I/O to WebSocket for browser access
 * 
 * This script creates a WebSocket server that bridges communication between
 * the Monaco editor (client) and the Eclipse JDT.LS server (which uses standard I/O).
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const WS_PORT = 8090;
const JDTLS_SCRIPT = path.join(__dirname, 'run-jdtls.bat');

// Create WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket server for JDT.LS started on port ${WS_PORT}`);

// Track connections
let connections = [];

// Function to start the JDT.LS process
function startJDTLS() {
    console.log('Starting JDT.LS process...');
    
    // Start the JDT.LS process
    const jdtls = spawn(JDTLS_SCRIPT, [], {
        shell: true,
        windowsHide: true
    });
    
    // Handle JDT.LS output
    jdtls.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`[JDT.LS OUT] ${message}`);
        
        // Forward messages to all WebSocket clients
        connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                } catch (e) {
                    console.error('Error sending message to WebSocket client:', e);
                }
            }
        });
    });
    
    // Handle JDT.LS error output
    jdtls.stderr.on('data', (data) => {
        console.error(`[JDT.LS ERR] ${data.toString()}`);
    });
    
    // Handle JDT.LS process close
    jdtls.on('close', (code) => {
        console.log(`JDT.LS process exited with code ${code}`);
        
        // Notify all clients
        connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'window/showMessage',
                        params: {
                            type: 1, // Error
                            message: `JDT.LS server stopped (exit code: ${code})`
                        }
                    }));
                } catch (e) {
                    console.error('Error sending close notification:', e);
                }
            }
        });
        
        // Restart the server after a delay if it crashes
        if (code !== 0) {
            console.log('JDT.LS crashed, restarting in 5 seconds...');
            setTimeout(startJDTLS, 5000);
        }
    });
    
    // Handle WebSocket connections
    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');
        connections.push(ws);
        
        // Handle messages from WebSocket clients
        ws.on('message', (message) => {
            console.log(`[CLIENT] ${message}`);
            
            // Forward message to JDT.LS
            jdtls.stdin.write(message + '\r\n');
        });
        
        // Handle WebSocket disconnection
        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            connections = connections.filter(conn => conn !== ws);
        });
        
        // Send initialization success message
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'window/showMessage',
            params: {
                type: 3, // Info
                message: 'Connected to JDT.LS server'
            }
        }));
    });
    
    return jdtls;
}

// Start JDT.LS process
const jdtls = startJDTLS();

// Handle script termination
process.on('SIGINT', () => {
    console.log('Stopping JDT.LS bridge...');
    
    // Close all WebSocket connections
    connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    
    // Kill JDT.LS process
    jdtls.kill();
    
    // Exit
    process.exit(0);
});
