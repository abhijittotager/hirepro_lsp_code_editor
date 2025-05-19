/**
 * ConnectionDiagnostics.js
 * 
 * This script will help diagnose issues with connecting to the Java LSP server
 * and provide detailed error information
 */

// Function to create visual diagnostics
function createDiagnosticsPanel() {
    // Create diagnostics panel element
    const panel = document.createElement('div');
    panel.id = 'diagnostics-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '100px';
    panel.style.right = '20px';
    panel.style.width = '350px';
    panel.style.maxHeight = '400px';
    panel.style.overflow = 'auto';
    panel.style.backgroundColor = '#2d2d2d';
    panel.style.color = '#e0e0e0';
    panel.style.padding = '15px';
    panel.style.borderRadius = '5px';
    panel.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    panel.style.zIndex = '1001';
    panel.style.fontFamily = 'Consolas, monospace';
    panel.style.fontSize = '12px';
    
    // Add header
    const header = document.createElement('h3');
    header.textContent = 'Java LSP Connection Diagnostics';
    header.style.margin = '0 0 10px 0';
    header.style.paddingBottom = '5px';
    header.style.borderBottom = '1px solid #555';
    panel.appendChild(header);
    
    // Add content container
    const content = document.createElement('div');
    content.id = 'diagnostics-content';
    panel.appendChild(content);
    
    // Add to document
    document.body.appendChild(panel);
    
    return content;
}

// Function to check if server is accessible
async function checkServerConnection(url) {
    try {
        // Create a new WebSocket connection
        const socket = new WebSocket(url);
        
        return new Promise((resolve, reject) => {
            // Set a timeout
            const timeout = setTimeout(() => {
                socket.close();
                reject(new Error(`Connection to ${url} timed out after 5 seconds`));
            }, 5000);
            
            // Connection established
            socket.onopen = () => {
                clearTimeout(timeout);
                socket.close();
                resolve(true);
            };
            
            // Connection error
            socket.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to connect to ${url}: ${error.message || 'Unknown error'}`));
            };
        });
    } catch (error) {
        return Promise.reject(error);
    }
}

// Run all diagnostic checks
async function runDiagnostics() {
    const panel = createDiagnosticsPanel();
    
    // Show loading indicator
    panel.innerHTML = '<div style="color: #aaa;">Running diagnostics...</div>';
    
    // Add a diagnostic result
    function addResult(name, status, message, details = null) {
        const item = document.createElement('div');
        item.style.marginBottom = '10px';
        item.style.padding = '5px';
        item.style.borderLeft = status === 'success' ? '3px solid #4CAF50' : 
                               status === 'warning' ? '3px solid #FF9800' : 
                               '3px solid #F44336';
        item.style.paddingLeft = '10px';
        
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.fontWeight = 'bold';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        
        const statusSpan = document.createElement('span');
        statusSpan.style.color = status === 'success' ? '#4CAF50' : 
                               status === 'warning' ? '#FF9800' : 
                               '#F44336';
        statusSpan.textContent = status === 'success' ? '✓ PASS' : 
                               status === 'warning' ? '⚠ WARN' : 
                               '✗ FAIL';
        
        header.appendChild(nameSpan);
        header.appendChild(statusSpan);
        item.appendChild(header);
        
        if (message) {
            const messageDiv = document.createElement('div');
            messageDiv.style.color = '#bbb';
            messageDiv.style.marginTop = '3px';
            messageDiv.textContent = message;
            item.appendChild(messageDiv);
        }
        
        if (details) {
            const detailsDiv = document.createElement('div');
            detailsDiv.style.marginTop = '5px';
            detailsDiv.style.padding = '5px';
            detailsDiv.style.background = '#222';
            detailsDiv.style.borderRadius = '3px';
            detailsDiv.style.maxHeight = '60px';
            detailsDiv.style.overflow = 'auto';
            detailsDiv.style.whiteSpace = 'pre-wrap';
            detailsDiv.style.fontSize = '10px';
            detailsDiv.textContent = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
            item.appendChild(detailsDiv);
        }
        
        panel.appendChild(item);
    }
    
    // Clear panel
    panel.innerHTML = '';
    
    // Check if Monaco is loaded
    try {
        addResult(
            'Monaco Editor', 
            typeof monaco !== 'undefined' ? 'success' : 'error',
            typeof monaco !== 'undefined' ? 'Monaco editor loaded successfully' : 'Monaco editor failed to load'
        );
    } catch(e) {
        addResult('Monaco Editor', 'error', 'Error checking Monaco: ' + e.message);
    }
    
    // Check if editor is initialized
    try {
        const editorInstance = window.editor;
        addResult(
            'Editor Instance', 
            editorInstance ? 'success' : 'error',
            editorInstance ? 'Editor instance initialized' : 'Editor instance not initialized'
        );
    } catch(e) {
        addResult('Editor Instance', 'error', 'Error checking editor: ' + e.message);
    }
    
    // Check if Java file is loaded
    try {
        const model = window.editor?.getModel();
        const language = model?.getLanguageId();
        addResult(
            'Java Model', 
            language === 'java' ? 'success' : 'warning',
            language === 'java' ? 'Java file loaded in editor' : `Current language is ${language || 'not set'}`
        );
    } catch(e) {
        addResult('Java Model', 'error', 'Error checking model: ' + e.message);
    }
    
    // Check for VS Code's JDT.LS connector
    try {
        addResult(
            'Fixed Connector', 
            typeof FixedJavaLSPConnector !== 'undefined' ? 'success' : 'error',
            typeof FixedJavaLSPConnector !== 'undefined' ? 
                'FixedJavaLSPConnector class loaded' : 
                'FixedJavaLSPConnector class not found'
        );
    } catch(e) {
        addResult('Fixed Connector', 'error', 'Error checking connector: ' + e.message);
    }
    
    // WebSocket connection test disabled - using Universal IntelliSense instead
    addResult(
        'IntelliSense Mode', 
        'success',
        'Using Universal Java IntelliSense (LSP-free mode)'
    );
    
    // Check if VS Code is installed with Java extension
    try {
        // Read from the jdtls-config.json file if it exists in localStorage
        const jdtlsConfig = localStorage.getItem('jdtlsConfig');
        
        if (jdtlsConfig) {
            const config = JSON.parse(jdtlsConfig);
            addResult(
                'VS Code JDT.LS', 
                'success',
                'JDT.LS configuration found in localStorage',
                config
            );
        } else {
            // No config in localStorage, show a warning
            addResult(
                'VS Code JDT.LS', 
                'warning',
                'No JDT.LS configuration found in localStorage. JDT.LS bridge may not be properly configured.'
            );
        }
    } catch(e) {
        addResult('VS Code JDT.LS', 'error', 'Error checking JDT.LS config: ' + e.message);
    }
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.marginTop = '15px';
    instructions.style.paddingTop = '10px';
    instructions.style.borderTop = '1px solid #555';
    instructions.innerHTML = `
        <strong>Troubleshooting Steps:</strong>
        <ol style="padding-left: 20px; margin-top: 5px;">
            <li>Ensure VS Code with Java Extension Pack is installed</li>
            <li>Run the WebSocket bridge with: <code>node vscode-jdtls-bridge.js</code></li>
            <li>Check browser console for additional errors</li>
            <li>Reload the page and try again</li>
        </ol>
    `;
    panel.appendChild(instructions);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#333';
    closeButton.style.color = '#fff';
    closeButton.style.border = '1px solid #555';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
        const panelElement = document.getElementById('diagnostics-panel');
        if (panelElement) {
            panelElement.remove();
        }
    };
    panel.appendChild(closeButton);
}

// Diagnostics are now manual only - Universal IntelliSense is used by default
// Uncomment to enable automatic diagnostics
/*
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for everything to initialize
    setTimeout(() => {
        runDiagnostics();
    }, 3000);
});
*/

// Instead, expose a global function to run diagnostics manually if needed
window.runJavaConnectionDiagnostics = runDiagnostics;
