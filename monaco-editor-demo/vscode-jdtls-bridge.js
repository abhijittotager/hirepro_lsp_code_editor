/**
 * VS Code JDT.LS Bridge
 * Connects VS Code's Java Language Server to WebSocket for Monaco Editor
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_PORT = 8090;
const CONFIG_FILE = path.join(__dirname, 'jdtls-config.json');
const WORKSPACE_PATH = path.join(__dirname, 'workspace');

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_PATH)) {
    fs.mkdirSync(WORKSPACE_PATH, { recursive: true });
    console.log(`Created workspace directory: ${WORKSPACE_PATH}`);
}

// Load configuration
let config;
try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    console.log('Loaded JDT.LS configuration');
} catch (error) {
    console.error(`Error loading config: ${error.message}`);
    console.error('Please run find-jdtls.ps1 first to locate VS Code\'s JDT.LS server');
    process.exit(1);
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

// Track active connections
let connections = [];

// Function to start JDT.LS process
function startJDTLS() {
    console.log('Starting VS Code\'s JDT.LS server...');
    
    // Find launcher JAR (handle wildcard)
    const launcherDir = path.dirname(config.jdtls.launcher);
    const launcherPattern = path.basename(config.jdtls.launcher);
    const launcherRegex = new RegExp(launcherPattern.replace('*', '.*'));
    
    const files = fs.readdirSync(launcherDir);
    const launcherFile = files.find(file => launcherRegex.test(file));
    
    if (!launcherFile) {
        console.error('Error: Launcher JAR not found');
        process.exit(1);
    }
    
    const launcherPath = path.join(launcherDir, launcherFile);
    console.log(`Using launcher: ${launcherPath}`);
    
    // Start the JDT.LS process
    const jdtls = spawn('java', [
        '-Declipse.application=org.eclipse.jdt.ls.core.id1',
        '-Dosgi.bundles.defaultStartLevel=4',
        '-Declipse.product=org.eclipse.jdt.ls.core.product',
        '-Dlog.level=ALL',
        '-Xmx1G',
        '--add-modules=ALL-SYSTEM',
        '--add-opens', 'java.base/java.util=ALL-UNNAMED',
        '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
        '-jar', launcherPath,
        '-configuration', config.jdtls.config,
        '-data', WORKSPACE_PATH
    ]);
    
    // Handle JDT.LS standard output
    jdtls.stdout.on('data', (data) => {
        const messages = data.toString().split('\r\n').filter(msg => msg.trim());
        
        messages.forEach(message => {
            try {
                // Try to parse as JSON
                const jsonMessage = JSON.parse(message);
                
                // Forward JSON messages to all WebSocket clients
                connections.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            ws.send(message);
                        } catch (e) {
                            console.error('Error forwarding message to client:', e);
                        }
                    }
                });
                
                // Log the message type but not the full content (could be large)
                if (jsonMessage.method) {
                    console.log(`[JDT.LS -> Client] Method: ${jsonMessage.method}`);
                } else if (jsonMessage.id) {
                    console.log(`[JDT.LS -> Client] Response to ID: ${jsonMessage.id}`);
                }
            } catch (e) {
                // Not JSON, just log as text
                console.log(`[JDT.LS] ${message}`);
            }
        });
    });
    
    // Handle JDT.LS error output
    jdtls.stderr.on('data', (data) => {
        console.error(`[JDT.LS Error] ${data.toString()}`);
    });
    
    // Handle JDT.LS process exit
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
                    console.error('Error sending notification:', e);
                }
            }
        });
        
        // Restart the server after a delay if it crashes
        if (code !== 0) {
            console.log('JDT.LS crashed, restarting in 5 seconds...');
            setTimeout(startJDTLS, 5000);
        }
    });
    
    return jdtls;
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    connections.push(ws);
    
    // Start JDT.LS if this is the first connection
    if (connections.length === 1) {
        let jdtls = startJDTLS();
        
        // Forward messages from clients to JDT.LS
        ws.on('message', (message) => {
            try {
                // Parse the message to log the method
                const jsonMessage = JSON.parse(message);
                if (jsonMessage.method) {
                    console.log(`[Client -> JDT.LS] Method: ${jsonMessage.method}`);
                } else if (jsonMessage.id) {
                    console.log(`[Client -> JDT.LS] Request ID: ${jsonMessage.id}`);
                }
                
                // Write the message to JDT.LS's stdin
                // Each message must be on a new line
                jdtls.stdin.write(message + '\r\n');
            } catch (e) {
                console.error('Error handling client message:', e);
            }
        });
        
        // Handle WebSocket client disconnection
        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            connections = connections.filter(conn => conn !== ws);
            
            // If no more connections, stop JDT.LS
            if (connections.length === 0) {
                console.log('No more clients, stopping JDT.LS');
                jdtls.kill();
            }
        });
    }
    
    // Send initialization success message
    ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'window/showMessage',
        params: {
            type: 3, // Info
            message: 'Connected to VS Code\'s JDT.LS server'
        }
    }));
});

// Handle script termination
process.on('SIGINT', () => {
    console.log('Stopping JDT.LS bridge...');
    wss.close();
    process.exit(0);
});
