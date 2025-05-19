/**
 * PythonLSPConnector - Connects Monaco editor to a Python LSP server via WebSocket
 * This connector provides Python language features using the Language Server Protocol
 */
class PythonLSPConnector {
    /**
     * Creates a new PythonLSPConnector
     * @param {Object} options - Connection options
     * @param {string} options.serverUrl - WebSocket URL to the Python LSP server
     */
    constructor(options = {}) {
        // Get server URL from window config or options with fallback
        const serverUrl = (window.pythonLSPConfig && window.pythonLSPConfig.serverUrl) || 
                         options.serverUrl || 
                         'ws://localhost:2087';
        
        this.options = {
            serverUrl,
            languageId: 'python',
            documentSelector: ['python'],
            name: 'Monaco Python LSP Client',
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            reconnectDelay: options.reconnectDelay || 1000,
            backoffFactor: options.backoffFactor || 1.5,
            onConnectionStatusChange: options.onConnectionStatusChange || null,
            onStatusMessage: options.onStatusMessage || null,
            pythonConfig: options.pythonConfig || {},
            fallbackToBasicFeatures: options.fallbackToBasicFeatures || false,
            connectionTimeout: options.connectionTimeout || 5000,
            retryConfig: options.retryConfig || {
                maxAttempts: 5,
                initialDelay: 1000,
                maxDelay: 10000,
                backoffFactor: 1.5
            }
        };
        
        this.socket = null;
        this.isConnected = false;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.subscriptions = [];
        this.editor = null;
        this.monaco = null;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.intentionalClose = false;
        this.documentUriMap = new Map();
        this.documentVersions = new Map();
        this.activeDocumentUri = null;
        this.defaultFilename = 'untitled.py';
        this.connectionTimeout = null;
        
        // Default Python configuration with improved settings
        this.defaultPythonConfig = {
            python: {
                pythonPath: 'python',
                venvPath: '',
                analysis: {
                    typeCheckingMode: 'strict',
                    autoSearchPaths: true,
                    useLibraryCodeForTypes: true,
                    diagnosticMode: 'workspace',
                    extraPaths: []
                }
            },
            pylint: {
                enabled: true,
                args: ['--max-line-length=100', '--disable=C0111']
            },
            formatting: {
                provider: 'black',
                blackPath: 'black',
                args: ['--line-length=100']
            },
            linting: {
                enabled: true,
                pylintEnabled: true,
                pycodestyleEnabled: true,
                pyflakesEnabled: true,
                mypyEnabled: true
            }
        };

        // Add initialization parameters
        this.initializeParams = {
            processId: null,
            clientInfo: {
                name: 'Monaco Python LSP Client',
                version: '1.0.0'
            },
            rootUri: 'file:///workspace',
            capabilities: {
                textDocument: {
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true
                    },
                    completion: {
                        dynamicRegistration: true,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: true,
                            documentationFormat: ['markdown', 'plaintext'],
                            deprecatedSupport: true,
                            preselectSupport: true
                        },
                        completionItemKind: {
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
                            ]
                        }
                    }
                },
                workspace: {
                    didChangeConfiguration: {
                        dynamicRegistration: true
                    }
                }
            }
        };
    }

    /**
     * Initialize the connector with Monaco and editor instances
     * @param {Object} monaco - Monaco API object
     * @param {Object} editor - Monaco editor instance
     */
    async initialize(monaco, editor) {
        if (!monaco || !editor) {
            throw new Error('Monaco and editor instances are required');
        }
        
        this.monaco = monaco;
        this.editor = editor;
        
        try {
            // Set up model change listener first
            this.setupModelChangeListener();
            
            // Register the current model
            const model = editor.getModel();
            if (model) {
                await this.registerDocument(model);
            }
            
            // Connect to LSP server
            await this.connect();
            await this.initializeServer();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Python LSP connector initialized');
            return this;
        } catch (error) {
            const errorMsg = `Failed to initialize Python LSP connector: ${error.message}`;
            console.error(errorMsg, error);
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(errorMsg, 1);
            }
            throw error;
        }
    }

    /**
     * Register a document with the LSP server
     * @param {Object} model - Monaco editor model
     */
    async registerDocument(model) {
        if (!model || model.isDisposed()) {
            throw new Error('Invalid or disposed model');
        }
        
        const uri = model.uri.toString();
        const languageId = model.getLanguageId();
        
        if (languageId !== 'python') {
            return null;
        }
        
        try {
            const lspUri = this.convertToLspUri(uri);
            const version = this.documentVersions.get(uri) || 0;
            
            // Update version and document state
            const documentState = {
                uri: lspUri,
                version: version + 1,
                languageId: 'python',
                text: model.getValue(),
                lastModified: new Date().toISOString()
            };
            
            this.documentVersions.set(uri, documentState.version);
            this.documentUriMap.set(uri, documentState);
            this.activeDocumentUri = uri;
            
            if (this.isConnected) {
                await this.notify('textDocument/didOpen', {
                    textDocument: {
                        uri: lspUri,
                        languageId: 'python',
                        version: documentState.version,
                        text: documentState.text
                    }
                });
                
                console.log(`Registered document: ${lspUri}`);
                if (this.options.onStatusMessage) {
                    this.options.onStatusMessage(`Connected to Python LSP: ${lspUri}`, 3);
                }
            }
            
            return lspUri;
        } catch (error) {
            const errorMsg = `Failed to register document: ${error.message}`;
            console.error(errorMsg, error);
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(errorMsg, 1);
            }
            throw error;
        }
    }

    /**
     * Convert Monaco URI to LSP URI
     * @param {string} monacoUri - Monaco editor URI
     * @returns {string} LSP-compatible URI
     */
    convertToLspUri(monacoUri) {
        try {
            // Handle in-memory models
            if (monacoUri.startsWith('inmemory://')) {
                const fileName = monacoUri.split('/').pop() || this.defaultFilename;
                return `file:///workspace/${encodeURIComponent(fileName)}`;
            }
            
            // Handle file URIs
            if (monacoUri.startsWith('file://')) {
                // Ensure proper encoding of URI components
                const uri = new URL(monacoUri);
                uri.pathname = uri.pathname.split('/').map(encodeURIComponent).join('/');
                return uri.toString();
            }
            
            // Default case - create a workspace URI
            const fileName = monacoUri.split('/').pop() || this.defaultFilename;
            return `file:///workspace/${encodeURIComponent(fileName)}`;
        } catch (error) {
            console.error('Error converting URI:', error);
            return `file:///workspace/${encodeURIComponent(this.defaultFilename)}`;
        }
    }

    /**
     * Disconnect from the LSP server
     */
    async disconnect() {
        if (this.socket) {
            this.intentionalClose = true;
            try {
                this.socket.close(1000, 'Client disconnecting');
            } catch (error) {
                console.error('Error closing WebSocket:', error);
            }
            this.socket = null;
            this.isConnected = false;
            
            // Clear all timeouts
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            
            // Notify status change
            if (this.options.onConnectionStatusChange) {
                this.options.onConnectionStatusChange(false);
            }
        }
    }

    /**
     * Connect to the LSP server
     */
    async connect() {
        // Disconnect if already connected
        if (this.socket) {
            await this.disconnect();
        }
        
        return new Promise((resolve, reject) => {
            try {
                // Set a timeout for the connection
                const timeoutId = setTimeout(() => {
                    if (this.options.fallbackToBasicFeatures) {
                        console.warn('Connection timeout, falling back to basic features');
                        if (this.options.onStatusMessage) {
                            this.options.onStatusMessage('Connection timeout, using basic features', 2);
                        }
                        this.setupFallbackFeatures();
                        resolve(); // Resolve without error to continue initialization
                    } else {
                        reject(new Error('Connection timeout'));
                    }
                }, this.options.connectionTimeout);
                
                this.socket = new WebSocket(this.options.serverUrl);
                
                this.socket.onopen = () => {
                    clearTimeout(timeoutId);
                    console.log('Connected to Python LSP server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(true);
                    }
                    
                    resolve();
                };
                
                this.socket.onmessage = (event) => this.handleMessage(event);
                
                this.socket.onclose = (event) => {
                    clearTimeout(timeoutId);
                    console.log('Disconnected from Python LSP server');
                    this.isConnected = false;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(false);
                    }
                    
                    if (!this.intentionalClose) {
                        this.attemptReconnect();
                    }
                };
                
                this.socket.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('WebSocket error:', error);
                    
                    if (this.options.onStatusMessage) {
                        this.options.onStatusMessage(`LSP connection error: ${error.message || 'Unknown error'}`, 1);
                    }
                    
                    if (this.options.fallbackToBasicFeatures) {
                        console.warn('Connection error, falling back to basic features');
                        this.setupFallbackFeatures();
                        resolve(); // Resolve without error to continue initialization
                    } else {
                        reject(error);
                    }
                };
                
            } catch (error) {
                console.error('Failed to connect to LSP server:', error);
                
                if (this.options.fallbackToBasicFeatures) {
                    console.warn('Connection setup error, falling back to basic features');
                    this.setupFallbackFeatures();
                    resolve(); // Resolve without error to continue initialization
                } else {
                    reject(error);
                }
            }
        });
        
        return new Promise((resolve, reject) => {
            try {
                // Set a timeout for the connection
                const timeoutId = setTimeout(() => {
                    if (this.options.fallbackToBasicFeatures) {
                        console.warn('Connection timeout, falling back to basic features');
                        if (this.options.onStatusMessage) {
                            this.options.onStatusMessage('Connection timeout, using basic features', 2);
                        }
                        this.setupFallbackFeatures();
                        resolve(); // Resolve without error to continue initialization
                    } else {
                        reject(new Error('Connection timeout'));
                    }
                }, this.options.connectionTimeout);
                
                this.socket = new WebSocket(this.options.serverUrl);
                
                this.socket.onopen = () => {
                    clearTimeout(timeoutId);
                    console.log('Connected to Python LSP server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(true);
                    }
                    
                    resolve();
                };
                
                this.socket.onmessage = (event) => this.handleMessage(event);
                
                this.socket.onclose = (event) => {
                    clearTimeout(timeoutId);
                    console.log('Disconnected from Python LSP server');
                    this.isConnected = false;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(false);
                    }
                    
                    if (!this.intentionalClose) {
                        this.attemptReconnect();
                    }
                };
                
                this.socket.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('WebSocket error:', error);
                    
                    if (this.options.onStatusMessage) {
                        this.options.onStatusMessage(`LSP connection error: ${error.message || 'Unknown error'}`, 1);
                    }
                    
                    if (this.options.fallbackToBasicFeatures) {
                        console.warn('Connection error, falling back to basic features');
                        this.setupFallbackFeatures();
                        resolve(); // Resolve without error to continue initialization
                    } else {
                        reject(error);
                    }
                };
                
            } catch (error) {
                console.error('Failed to connect to LSP server:', error);
                
                if (this.options.fallbackToBasicFeatures) {
                    console.warn('Connection setup error, falling back to basic features');
                    this.setupFallbackFeatures();
                    resolve(); // Resolve without error to continue initialization
                } else {
                    reject(error);
                }
            }
        });
    }

    handleConnectionError(error) {
        const errorDetails = {
            message: error?.message || 'Unknown error',
            type: error?.type || 'connection_error',
            timestamp: new Date().toISOString()
        };
        
        console.error('Python LSP connection error:', errorDetails);
        
        if (this.options.onStatusMessage) {
            let userMessage = 'Failed to connect to Python LSP server. ';
            
            // Safely check error message
            const errorMessage = error?.message || '';
    }

    return new Promise((resolve, reject) => {
        try {
            // Set a timeout for the connection
            const timeoutId = setTimeout(() => {
                if (this.options.fallbackToBasicFeatures) {
                    console.warn('Connection timeout, falling back to basic features');
                    if (this.options.onStatusMessage) {
                        this.options.onStatusMessage('Connection timeout, using basic features', 2);
                    }
                    this.setupFallbackFeatures();
                    resolve(); // Resolve without error to continue initialization
                } else {
                    reject(new Error('Connection timeout'));
                }
            }, this.options.connectionTimeout);
            console.error(message);
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(message, 1);
            }
            return;
        }

        const delay = Math.min(
            this.options.retryConfig.initialDelay * 
            Math.pow(this.options.retryConfig.backoffFactor, this.reconnectAttempts),
            this.options.retryConfig.maxDelay
        );

        this.reconnectAttempts++;
        
        if (this.options.onStatusMessage) {
            this.options.onStatusMessage(
                `Attempting to reconnect to Python LSP server (${this.reconnectAttempts}/${this.options.retryConfig.maxAttempts})...`,
                2
            );
        }

        }
        
        // Close WebSocket connection
        if (this.socket) {
            try {
                this.socket.close(1000, 'Client disconnecting');
            } catch (error) {
                console.error('Error closing WebSocket:', error);
            }
            this.socket = null;
        }
        
        // Clear all maps and arrays
        this.pendingRequests.clear();
        this.subscriptions = [];
        this.documentUriMap.clear();
        this.documentVersions.clear();
        
        // Reset state
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.activeDocumentUri = null;
        
        // Notify status change
        if (this.options.onConnectionStatusChange) {
            this.options.onConnectionStatusChange(false);
        }
        
        // Clear editor references
        this.editor = null;
        this.monaco = null;
    }

    async initializeServer() {
        if (!this.isConnected) {
            throw new Error('Not connected to LSP server');
        }

        try {
            const response = await this.request('initialize', this.initializeParams);
            
            if (!response || !response.capabilities) {
                throw new Error('Invalid server initialization response');
            }

            // Store server capabilities
            this.serverCapabilities = response.capabilities;

            // Send initialized notification
            await this.notify('initialized', {});

            // Configure the server with our settings
            await this.notify('workspace/didChangeConfiguration', {
                settings: {
                    python: this.options.pythonConfig.python || this.defaultPythonConfig.python,
                    pylint: this.options.pythonConfig.pylint || this.defaultPythonConfig.pylint,
                    formatting: this.options.pythonConfig.formatting || this.defaultPythonConfig.formatting,
                    linting: this.options.pythonConfig.linting || this.defaultPythonConfig.linting
                }
            });

            console.log('Python LSP server initialized successfully');
            return response;
        } catch (error) {
            const errorMsg = `Failed to initialize Python LSP server: ${error.message}`;
            console.error(errorMsg);
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(errorMsg, 1);
            }
            throw error;
        }
    }

    async request(method, params) {
        if (!this.isConnected) {
            throw new Error('Not connected to LSP server');
        }

        const id = this.nextRequestId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        return new Promise((resolve, reject) => {
            // Set timeout for the request
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, this.options.connectionTimeout);

            // Store the request
            this.pendingRequests.set(id, { resolve, reject, timeout });

            try {
                this.socket.send(JSON.stringify(message));
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                reject(error);
            }
        });
    }

    async notify(method, params) {
        if (!this.isConnected) {
            throw new Error('Not connected to LSP server');
        }

        const message = {
            jsonrpc: '2.0',
            method,
            params
        };

        try {
            this.socket.send(JSON.stringify(message));
        } catch (error) {
            console.error(`Failed to send notification ${method}:`, error);
            throw error;
        }
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            // Handle response to a request
            if (message.id !== undefined) {
                const request = this.pendingRequests.get(message.id);
                if (request) {
                    clearTimeout(request.timeout);
                    this.pendingRequests.delete(message.id);
                    
                    if (message.error) {
                        request.reject(new Error(message.error.message));
                    } else {
                        request.resolve(message.result);
                    }
                }
                return;
            }

            // Handle notifications
            if (message.method) {
                switch (message.method) {
                    case 'textDocument/publishDiagnostics':
                        this.handleDiagnostics(message.params);
                        break;
                    case 'window/showMessage':
                        this.handleShowMessage(message.params);
                        break;
                    case 'window/logMessage':
                        this.handleLogMessage(message.params);
                        break;
                    default:
                        console.log('Unhandled notification:', message.method);
                }
            }
        } catch (error) {
            console.error('Error handling LSP message:', error);
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(`LSP message error: ${error.message}`, 1);
            }
        }
    }

    handleDiagnostics(params) {
        if (!this.editor || !this.monaco) return;

        const model = this.editor.getModel();
        if (!model) return;

        const uri = params.uri;
        const diagnostics = params.diagnostics;

        // Convert LSP diagnostics to Monaco markers
        const markers = diagnostics.map(diagnostic => ({
            severity: this.convertSeverity(diagnostic.severity),
            message: diagnostic.message,
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            source: 'Python LSP'
        }));

        // Update editor markers
        this.monaco.editor.setModelMarkers(model, 'python-lsp', markers);
    }

    convertSeverity(severity) {
        switch (severity) {
            case 1: return this.monaco.MarkerSeverity.Error;
            case 2: return this.monaco.MarkerSeverity.Warning;
            case 3: return this.monaco.MarkerSeverity.Info;
            case 4: return this.monaco.MarkerSeverity.Hint;
            default: return this.monaco.MarkerSeverity.Info;
        }
    }

    handleShowMessage(params) {
        if (this.options.onStatusMessage) {
            const type = ['', 'error', 'warning', 'info', 'log'][params.type] || 'info';
            this.options.onStatusMessage(params.message, type);
        }
    }

    handleLogMessage(params) {
        const level = ['', 'error', 'warning', 'info', 'log'][params.type] || 'info';
        console[level](`[Python LSP] ${params.message}`);
    }

    /**
     * Set up model change listener to handle document updates
     */
    setupModelChangeListener() {
        if (!this.editor || !this.monaco) {
            throw new Error('Editor and Monaco instances are required');
        }

        // Get the current model
        const model = this.editor.getModel();
        if (!model) {
            throw new Error('No editor model available');
        }

        // Set up change listener
        this.modelChangeListener = model.onDidChangeContent(async (event) => {
            if (!this.isConnected) return;

            try {
                const uri = model.uri.toString();
                const version = (this.documentVersions.get(uri) || 0) + 1;
                this.documentVersions.set(uri, version);

                // Send change notification to LSP server
                await this.notify('textDocument/didChange', {
                    textDocument: {
                        uri: this.convertToLspUri(uri),
                        version: version
                    },
                    contentChanges: [{
                        text: model.getValue()
                    }]
                });
            } catch (error) {
                console.error('Error handling model change:', error);
                if (this.options.onStatusMessage) {
                    this.options.onStatusMessage(`Document sync error: ${error.message}`, 1);
                }
            }
        });

        // Set up model dispose listener
        this.modelDisposeListener = model.onWillDispose(() => {
            if (this.isConnected) {
                const uri = model.uri.toString();
                this.notify('textDocument/didClose', {
                    textDocument: {
                        uri: this.convertToLspUri(uri)
                    }
                }).catch(error => {
                    console.error('Error sending document close notification:', error);
                });
            }
        });

        // Add listeners to subscriptions for cleanup
        this.subscriptions.push(this.modelChangeListener, this.modelDisposeListener);
    }

    /**
     * Set up event listeners for editor interactions
     */
    setupEventListeners() {
        if (!this.editor || !this.monaco) {
            throw new Error('Editor and Monaco instances are required');
        }

        // Set up cursor position change listener for hover
        this.cursorPositionListener = this.editor.onDidChangeCursorPosition(async (event) => {
            if (!this.isConnected) return;

            try {
                const model = this.editor.getModel();
                if (!model) return;

                const uri = model.uri.toString();
                const position = event.position;

                // Request hover information
                const hoverResult = await this.request('textDocument/hover', {
                    textDocument: {
                        uri: this.convertToLspUri(uri)
                    },
                    position: {
                        line: position.lineNumber - 1,
                        character: position.column - 1
                    }
                });

                // Handle hover result if needed
                if (hoverResult && hoverResult.contents) {
                    // You can implement hover display logic here
                    console.log('Hover information:', hoverResult.contents);
                }
            } catch (error) {
                console.error('Error handling cursor position change:', error);
            }
        });

        // Add cursor position listener to subscriptions
        this.subscriptions.push(this.cursorPositionListener);
    }
}

// Export the PythonLSPConnector class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PythonLSPConnector };
} else {
    window.PythonLSPConnector = PythonLSPConnector;
}
