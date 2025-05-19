/**
 * SimplePythonLSPConnector - A simplified connector for Python LSP
 * This connector provides Python language features using the Language Server Protocol
 */
class SimplePythonLSPConnector {
    /**
     * Creates a new SimplePythonLSPConnector
     * @param {Object} options - Connection options
     */
    constructor(options = {}) {
        this.options = {
            serverUrl: options.serverUrl || 'ws://localhost:2087',
            connectionTimeout: options.connectionTimeout || 5000,
            onConnectionStatusChange: options.onConnectionStatusChange || null,
            onStatusMessage: options.onStatusMessage || null
        };
        
        this.socket = null;
        this.isConnected = false;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.subscriptions = [];
        this.monaco = null;
        this.editor = null;
        this.intentionalClose = false;
        this.documentUriMap = new Map();
        this.documentVersions = new Map();
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
            // Register the current model
            const model = editor.getModel();
            if (model) {
                await this.registerDocument(model);
            }
            
            // Set up model change listener
            this.setupModelChangeListener();
            
            // Connect to LSP server
            await this.connect();
            
            // Initialize the LSP server
            await this.initializeServer();
            
            console.log('Python LSP connector initialized successfully');
            return this;
        } catch (error) {
            console.error('Failed to initialize Python LSP connector:', error);
            
            if (this.options.onStatusMessage) {
                this.options.onStatusMessage(`Initialization error: ${error.message}`, 1);
            }
            
            throw error;
        }
    }

    /**
     * Connect to the LSP server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // Close any existing connection
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            
            // Set a connection timeout
            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, this.options.connectionTimeout);
            
            try {
                console.log('Connecting to Python LSP server at:', this.options.serverUrl);
                this.socket = new WebSocket(this.options.serverUrl);
                
                this.socket.onopen = () => {
                    clearTimeout(timeoutId);
                    console.log('Connected to Python LSP server');
                    this.isConnected = true;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(true);
                    }
                    
                    if (this.options.onStatusMessage) {
                        this.options.onStatusMessage('Connected to Python LSP server', 3);
                    }
                    
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.socket.onclose = (event) => {
                    clearTimeout(timeoutId);
                    console.log('Disconnected from Python LSP server');
                    this.isConnected = false;
                    
                    if (this.options.onConnectionStatusChange) {
                        this.options.onConnectionStatusChange(false);
                    }
                    
                    if (this.options.onStatusMessage && !this.intentionalClose) {
                        this.options.onStatusMessage('Disconnected from Python LSP server', 2);
                    }
                };
                
                this.socket.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('WebSocket error:', error);
                    
                    if (this.options.onStatusMessage) {
                        this.options.onStatusMessage(`Connection error: ${error.message || 'Unknown error'}`, 1);
                    }
                    
                    reject(error);
                };
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Failed to connect to LSP server:', error);
                
                if (this.options.onStatusMessage) {
                    this.options.onStatusMessage(`Connection error: ${error.message}`, 1);
                }
                
                reject(error);
            }
        });
    }

    /**
     * Initialize the LSP server
     */
    async initializeServer() {
        if (!this.isConnected) {
            throw new Error('Not connected to LSP server');
        }
        
        // Get the root URI from the editor model
        const model = this.editor.getModel();
        const rootUri = model ? this.getDocumentUri(model) : 'file:///workspace';
        
        // Send initialize request
        const result = await this.sendRequest('initialize', {
            processId: null,
            clientInfo: {
                name: 'Monaco Editor',
                version: '0.44.0'
            },
            rootUri: rootUri,
            capabilities: {
                textDocument: {
                    synchronization: {
                        didSave: true,
                        dynamicRegistration: true
                    },
                    completion: {
                        dynamicRegistration: true,
                        completionItem: {
                            snippetSupport: true,
                            documentationFormat: ['markdown', 'plaintext']
                        }
                    },
                    hover: {
                        dynamicRegistration: true,
                        contentFormat: ['markdown', 'plaintext']
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                        signatureInformation: {
                            documentationFormat: ['markdown', 'plaintext']
                        }
                    },
                    definition: {
                        dynamicRegistration: true
                    },
                    references: {
                        dynamicRegistration: true
                    },
                    documentHighlight: {
                        dynamicRegistration: true
                    },
                    documentSymbol: {
                        dynamicRegistration: true,
                        symbolKind: {
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26
                            ]
                        }
                    },
                    formatting: {
                        dynamicRegistration: true
                    },
                    rangeFormatting: {
                        dynamicRegistration: true
                    },
                    onTypeFormatting: {
                        dynamicRegistration: true
                    },
                    rename: {
                        dynamicRegistration: true
                    },
                    publishDiagnostics: {
                        relatedInformation: true
                    }
                },
                workspace: {
                    didChangeConfiguration: {
                        dynamicRegistration: true
                    }
                }
            },
            initializationOptions: {
                python: window.pythonLSPConfig || {}
            }
        });
        
        console.log('LSP server initialized:', result);
        
        // Send initialized notification
        await this.notify('initialized', {});
        
        // Configure the server
        await this.configureServer();
        
        return result;
    }

    /**
     * Configure the LSP server with Python-specific settings
     */
    async configureServer() {
        const pythonConfig = window.pythonLSPConfig || {};
        
        await this.notify('workspace/didChangeConfiguration', {
            settings: {
                python: {
                    pythonPath: pythonConfig.pythonPath || 'python',
                    venvPath: pythonConfig.venvPath || '',
                    analysis: {
                        typeCheckingMode: pythonConfig.typeCheckingMode || 'basic',
                        autoSearchPaths: true,
                        useLibraryCodeForTypes: true,
                        diagnosticMode: 'workspace',
                        extraPaths: pythonConfig.extraPaths || []
                    }
                },
                pyls: {
                    plugins: {
                        jedi_completion: {
                            enabled: true,
                            include_params: true
                        },
                        jedi_definition: {
                            enabled: true
                        },
                        jedi_hover: {
                            enabled: true
                        },
                        jedi_references: {
                            enabled: true
                        },
                        jedi_signature_help: {
                            enabled: true
                        },
                        jedi_symbols: {
                            enabled: true
                        },
                        pycodestyle: {
                            enabled: true,
                            maxLineLength: 100
                        },
                        pydocstyle: {
                            enabled: false
                        },
                        pyflakes: {
                            enabled: true
                        },
                        pylint: {
                            enabled: false
                        },
                        yapf: {
                            enabled: true
                        },
                        autopep8: {
                            enabled: true
                        }
                    }
                }
            }
        });
    }

    /**
     * Set up model change listener
     */
    setupModelChangeListener() {
        // Listen for model content changes
        this.editor.onDidChangeModelContent((event) => {
            const model = this.editor.getModel();
            if (!model) return;
            
            const uri = model.uri.toString();
            const version = (this.documentVersions.get(uri) || 0) + 1;
            this.documentVersions.set(uri, version);
            
            // Only send changes if we're connected
            if (this.isConnected) {
                const documentUri = this.getDocumentUri(model);
                if (!documentUri) return;
                
                // Convert Monaco changes to LSP changes
                const changes = event.changes.map(change => {
                    const startPos = model.getPositionAt(change.rangeOffset);
                    const endPos = model.getPositionAt(change.rangeOffset + change.rangeLength);
                    
                    return {
                        range: {
                            start: {
                                line: startPos.lineNumber - 1,
                                character: startPos.column - 1
                            },
                            end: {
                                line: endPos.lineNumber - 1,
                                character: endPos.column - 1
                            }
                        },
                        text: change.text
                    };
                });
                
                // Send didChange notification
                this.notify('textDocument/didChange', {
                    textDocument: {
                        uri: documentUri,
                        version: version
                    },
                    contentChanges: changes
                });
            }
        });
        
        // Listen for model language changes
        this.editor.onDidChangeModelLanguage((event) => {
            const model = event.model;
            if (!model) return;
            
            const language = model.getLanguageId();
            if (language === 'python') {
                this.registerDocument(model);
            }
        });
    }

    /**
     * Register a document with the LSP server
     * @param {Object} model - Monaco editor model
     */
    async registerDocument(model) {
        if (!model || model.isDisposed()) {
            return null;
        }
        
        const uri = model.uri.toString();
        const language = model.getLanguageId();
        
        // Only register Python documents
        if (language !== 'python') {
            return null;
        }
        
        // Generate LSP URI
        const documentUri = this.convertToLspUri(uri);
        this.documentUriMap.set(uri, documentUri);
        
        // Reset version
        this.documentVersions.set(uri, 1);
        
        // Notify LSP server if connected
        if (this.isConnected) {
            await this.notify('textDocument/didOpen', {
                textDocument: {
                    uri: documentUri,
                    languageId: 'python',
                    version: 1,
                    text: model.getValue()
                }
            });
        }
        
        return documentUri;
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
                const fileName = monacoUri.split('/').pop() || 'untitled.py';
                return `file:///workspace/${fileName}`;
            }
            
            // Handle file URIs
            if (monacoUri.startsWith('file://')) {
                return monacoUri;
            }
            
            // Default case - create a workspace URI
            const fileName = monacoUri.split('/').pop() || 'untitled.py';
            return `file:///workspace/${fileName}`;
        } catch (error) {
            console.error('Error converting URI:', error);
            return `file:///workspace/untitled.py`;
        }
    }

    /**
     * Get document URI for a model
     * @param {Object} model - Monaco editor model
     * @returns {string} LSP document URI
     */
    getDocumentUri(model) {
        if (!model) {
            return null;
        }
        
        const modelUri = model.uri.toString();
        return this.documentUriMap.get(modelUri) || this.convertToLspUri(modelUri);
    }

    /**
     * Send a request to the LSP server
     * @param {string} method - LSP method
     * @param {Object} params - Request parameters
     * @returns {Promise} Promise that resolves with the response
     */
    sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected to LSP server'));
                return;
            }
            
            const id = this.nextRequestId++;
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params
            };
            
            // Store the request callbacks
            this.pendingRequests.set(id, { resolve, reject });
            
            // Send the request
            this.socket.send(JSON.stringify(request));
        });
    }

    /**
     * Send a notification to the LSP server
     * @param {string} method - LSP method
     * @param {Object} params - Notification parameters
     */
    notify(method, params) {
        if (!this.isConnected) {
            console.warn(`Cannot send notification ${method}: not connected`);
            return;
        }
        
        const notification = {
            jsonrpc: '2.0',
            method,
            params
        };
        
        this.socket.send(JSON.stringify(notification));
    }

    /**
     * Handle a message from the LSP server
     * @param {Object} event - WebSocket message event
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            // Handle response
            if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
                const request = this.pendingRequests.get(message.id);
                if (request) {
                    this.pendingRequests.delete(message.id);
                    
                    if (message.error) {
                        request.reject(new Error(message.error.message));
                    } else {
                        request.resolve(message.result);
                    }
                }
            }
            // Handle notification
            else if (message.method) {
                this.handleNotification(message.method, message.params);
            }
        } catch (error) {
            console.error('Error handling LSP message:', error);
        }
    }

    /**
     * Handle a notification from the LSP server
     * @param {string} method - LSP method
     * @param {Object} params - Notification parameters
     */
    handleNotification(method, params) {
        switch (method) {
            case 'textDocument/publishDiagnostics':
                this.handleDiagnostics(params);
                break;
                
            case 'window/showMessage':
                if (this.options.onStatusMessage) {
                    this.options.onStatusMessage(params.message, params.type);
                }
                break;
                
            case 'window/logMessage':
                console.log(`LSP ${params.type === 1 ? 'Error' : params.type === 2 ? 'Warning' : 'Info'}: ${params.message}`);
                break;
        }
    }

    /**
     * Handle diagnostics from the LSP server
     * @param {Object} params - Diagnostics parameters
     */
    handleDiagnostics(params) {
        if (!this.monaco || !this.editor) return;
        
        const model = this.editor.getModel();
        if (!model) return;
        
        const modelUri = model.uri.toString();
        const documentUri = this.getDocumentUri(model);
        
        // Only handle diagnostics for the current document
        if (params.uri !== documentUri) return;
        
        // Convert LSP diagnostics to Monaco markers
        const markers = params.diagnostics.map(diagnostic => {
            return {
                severity: this.convertSeverity(diagnostic.severity),
                startLineNumber: diagnostic.range.start.line + 1,
                startColumn: diagnostic.range.start.character + 1,
                endLineNumber: diagnostic.range.end.line + 1,
                endColumn: diagnostic.range.end.character + 1,
                message: diagnostic.message,
                source: diagnostic.source || 'pyls'
            };
        });
        
        // Set markers on the model
        this.monaco.editor.setModelMarkers(model, 'pyls', markers);
    }

    /**
     * Convert LSP severity to Monaco severity
     * @param {number} severity - LSP severity (1-4)
     * @returns {number} Monaco severity
     */
    convertSeverity(severity) {
        switch (severity) {
            case 1: // Error
                return this.monaco.MarkerSeverity.Error;
            case 2: // Warning
                return this.monaco.MarkerSeverity.Warning;
            case 3: // Information
                return this.monaco.MarkerSeverity.Info;
            case 4: // Hint
                return this.monaco.MarkerSeverity.Hint;
            default:
                return this.monaco.MarkerSeverity.Info;
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.intentionalClose = true;
        
        // Close WebSocket connection
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        // Clear subscriptions
        this.subscriptions.forEach(dispose => {
            if (typeof dispose === 'function') {
                dispose();
            }
        });
        this.subscriptions = [];
        
        // Clear maps
        this.pendingRequests.clear();
        this.documentUriMap.clear();
        this.documentVersions.clear();
        
        // Reset state
        this.isConnected = false;
        this.monaco = null;
        this.editor = null;
    }
}

// Export the SimplePythonLSPConnector class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimplePythonLSPConnector };
} else {
    window.SimplePythonLSPConnector = SimplePythonLSPConnector;
}
