/**
 * Generic Language Server Protocol (LSP) client implementation for Monaco Editor
 * This module provides a framework for connecting Monaco to any LSP server
 */

class LSPWebSocketClient {
    constructor(options) {
        this.options = Object.assign({
            serverUrl: 'ws://localhost:8080/lsp',
            rootUri: null,
            workspaceFolders: null,
            languageId: 'java',
            documentSelector: ['java'],
            name: 'Monaco LSP Client',
            trace: 'verbose'
        }, options);

        this.socket = null;
        this.messageId = 0;
        this.pendingRequests = new Map();
        this.diagnosticsCallback = null;
        this.completionCallback = null;
        this.hoverCallback = null;
        this.initialized = false;
        this.isConnecting = false;
    }

    /**
     * Connect to the LSP server
     * @returns {Promise} A promise that resolves when connected and initialized
     */
    connect() {
        if (this.isConnecting) {
            return Promise.reject(new Error('Already connecting to LSP server'));
        }
        
        if (this.isConnected()) {
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to LSP server at ${this.options.serverUrl}`);
                this.socket = new WebSocket(this.options.serverUrl);
                
                this.socket.onopen = () => {
                    console.log('Connected to LSP server');
                    this.initialize()
                        .then(() => {
                            this.isConnecting = false;
                            resolve();
                        })
                        .catch(err => {
                            this.isConnecting = false;
                            console.error('Failed to initialize LSP connection:', err);
                            reject(err);
                        });
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onerror = (error) => {
                    this.isConnecting = false;
                    console.error('WebSocket error:', error);
                    reject(error);
                };
                
                this.socket.onclose = () => {
                    this.isConnecting = false;
                    this.initialized = false;
                    console.log('Disconnected from LSP server');
                };
            } catch (error) {
                this.isConnecting = false;
                console.error('Failed to connect to LSP server:', error);
                reject(error);
            }
        });
    }

    /**
     * Check if connected to LSP server
     * @returns {boolean} True if connected
     */
    isConnected() {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Initialize the LSP connection
     * @returns {Promise} A promise that resolves when initialized
     */
    initialize() {
        return this.sendRequest('initialize', {
            processId: null,
            clientInfo: {
                name: this.options.name,
                version: '1.0.0'
            },
            rootUri: this.options.rootUri,
            workspaceFolders: this.options.workspaceFolders,
            capabilities: {
                workspace: {
                    applyEdit: true,
                    workspaceEdit: {
                        documentChanges: true
                    },
                    didChangeConfiguration: {
                        dynamicRegistration: true
                    },
                    didChangeWatchedFiles: {
                        dynamicRegistration: true
                    },
                    symbol: {
                        dynamicRegistration: true
                    },
                    executeCommand: {
                        dynamicRegistration: true
                    }
                },
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
                            valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
                        },
                        contextSupport: true
                    },
                    hover: {
                        dynamicRegistration: true,
                        contentFormat: ['markdown', 'plaintext']
                    },
                    signatureHelp: {
                        dynamicRegistration: true,
                        signatureInformation: {
                            documentationFormat: ['markdown', 'plaintext'],
                            parameterInformation: {
                                labelOffsetSupport: true
                            }
                        }
                    },
                    declaration: {
                        dynamicRegistration: true,
                        linkSupport: true
                    },
                    definition: {
                        dynamicRegistration: true,
                        linkSupport: true
                    },
                    typeDefinition: {
                        dynamicRegistration: true,
                        linkSupport: true
                    },
                    implementation: {
                        dynamicRegistration: true,
                        linkSupport: true
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
                            valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
                        },
                        hierarchicalDocumentSymbolSupport: true
                    },
                    codeAction: {
                        dynamicRegistration: true,
                        codeActionLiteralSupport: {
                            codeActionKind: {
                                valueSet: [
                                    '',
                                    'quickfix',
                                    'refactor',
                                    'refactor.extract',
                                    'refactor.inline',
                                    'refactor.rewrite',
                                    'source',
                                    'source.organizeImports'
                                ]
                            }
                        }
                    },
                    codeLens: {
                        dynamicRegistration: true
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
                        dynamicRegistration: true,
                        prepareSupport: true
                    },
                    documentLink: {
                        dynamicRegistration: true,
                        tooltipSupport: true
                    },
                    foldingRange: {
                        dynamicRegistration: true,
                        rangeLimit: 5000,
                        lineFoldingOnly: true
                    },
                    colorProvider: {
                        dynamicRegistration: true
                    },
                    publishDiagnostics: {
                        relatedInformation: true,
                        tagSupport: {
                            valueSet: [1, 2]
                        },
                        versionSupport: true
                    },
                    selectionRange: {
                        dynamicRegistration: true
                    }
                }
            },
            trace: this.options.trace
        }).then((result) => {
            console.log('LSP server initialized:', result);
            this.initialized = true;
            
            // Send initialized notification
            return this.sendNotification('initialized', {});
        });
    }

    /**
     * Close the connection to the LSP server
     */
    close() {
        if (this.isConnected()) {
            this.sendNotification('exit', {});
            this.socket.close();
        }
    }

    /**
     * Send a request to the LSP server
     * @param {string} method - The LSP method to call
     * @param {Object} params - The parameters for the method
     * @returns {Promise} A promise that resolves with the result
     */
    sendRequest(method, params) {
        if (!this.isConnected()) {
            return Promise.reject(new Error('Not connected to LSP server'));
        }
        
        const id = ++this.messageId;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };
        
        const messageStr = JSON.stringify(message);
        this.socket.send(messageStr);
        
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
        });
    }

    /**
     * Send a notification to the LSP server (no response expected)
     * @param {string} method - The LSP method
     * @param {Object} params - The parameters for the method
     */
    sendNotification(method, params) {
        if (!this.isConnected()) {
            console.warn(`Cannot send notification ${method}: Not connected to LSP server`);
            return;
        }
        
        const message = {
            jsonrpc: '2.0',
            method,
            params
        };
        
        const messageStr = JSON.stringify(message);
        this.socket.send(messageStr);
    }

    /**
     * Handle incoming messages from the LSP server
     * @param {string} data - The raw message data
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            // Handle responses to requests
            if (message.id && this.pendingRequests.has(message.id)) {
                const request = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                
                if (message.error) {
                    request.reject(new Error(message.error.message));
                } else {
                    request.resolve(message.result);
                }
                return;
            }
            
            // Handle server notifications
            if (!message.id && message.method) {
                this.handleNotification(message.method, message.params);
                return;
            }
            
            console.log('Unhandled LSP message:', message);
        } catch (error) {
            console.error('Error parsing LSP message:', error, data);
        }
    }

    /**
     * Handle notifications from the LSP server
     * @param {string} method - The notification method
     * @param {Object} params - The notification parameters
     */
    handleNotification(method, params) {
        switch (method) {
            case 'textDocument/publishDiagnostics':
                if (this.diagnosticsCallback) {
                    this.diagnosticsCallback(params);
                }
                break;
                
            default:
                console.log(`Received LSP notification: ${method}`, params);
                break;
        }
    }

    /**
     * Notify the server that a document has been opened
     * @param {string} uri - The document URI
     * @param {string} languageId - The document language ID
     * @param {number} version - The document version
     * @param {string} text - The document text
     */
    textDocumentDidOpen(uri, languageId, version, text) {
        if (!this.initialized) {
            console.warn('Cannot send didOpen: LSP not initialized');
            return;
        }
        
        this.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId,
                version,
                text
            }
        });
    }

    /**
     * Notify the server that a document has changed
     * @param {string} uri - The document URI
     * @param {number} version - The document version
     * @param {Array} changes - The document changes
     */
    textDocumentDidChange(uri, version, changes) {
        if (!this.initialized) {
            console.warn('Cannot send didChange: LSP not initialized');
            return;
        }
        
        this.sendNotification('textDocument/didChange', {
            textDocument: {
                uri,
                version
            },
            contentChanges: changes
        });
    }

    /**
     * Notify the server that a document has been closed
     * @param {string} uri - The document URI
     */
    textDocumentDidClose(uri) {
        if (!this.initialized) {
            console.warn('Cannot send didClose: LSP not initialized');
            return;
        }
        
        this.sendNotification('textDocument/didClose', {
            textDocument: {
                uri
            }
        });
    }

    /**
     * Request completion items from the server
     * @param {string} uri - The document URI
     * @param {Object} position - The position in the document
     * @returns {Promise} A promise that resolves with the completion items
     */
    completion(uri, position) {
        return this.sendRequest('textDocument/completion', {
            textDocument: {
                uri
            },
            position
        });
    }

    /**
     * Request hover information from the server
     * @param {string} uri - The document URI
     * @param {Object} position - The position in the document
     * @returns {Promise} A promise that resolves with the hover information
     */
    hover(uri, position) {
        return this.sendRequest('textDocument/hover', {
            textDocument: {
                uri
            },
            position
        });
    }

    /**
     * Request definition locations from the server
     * @param {string} uri - The document URI
     * @param {Object} position - The position in the document
     * @returns {Promise} A promise that resolves with the definition locations
     */
    definition(uri, position) {
        return this.sendRequest('textDocument/definition', {
            textDocument: {
                uri
            },
            position
        });
    }

    /**
     * Request references to a symbol from the server
     * @param {string} uri - The document URI
     * @param {Object} position - The position in the document
     * @param {boolean} includeDeclaration - Whether to include the declaration
     * @returns {Promise} A promise that resolves with the references
     */
    references(uri, position, includeDeclaration) {
        return this.sendRequest('textDocument/references', {
            textDocument: {
                uri
            },
            position,
            context: {
                includeDeclaration
            }
        });
    }

    /**
     * Request document formatting from the server
     * @param {string} uri - The document URI
     * @param {Object} options - The formatting options
     * @returns {Promise} A promise that resolves with the formatting edits
     */
    formatting(uri, options) {
        return this.sendRequest('textDocument/formatting', {
            textDocument: {
                uri
            },
            options
        });
    }

    /**
     * Request code actions from the server
     * @param {string} uri - The document URI
     * @param {Object} range - The range in the document
     * @param {Array} diagnostics - The diagnostics to fix
     * @returns {Promise} A promise that resolves with the code actions
     */
    codeAction(uri, range, diagnostics) {
        return this.sendRequest('textDocument/codeAction', {
            textDocument: {
                uri
            },
            range,
            context: {
                diagnostics
            }
        });
    }

    /**
     * Request folding ranges from the server
     * @param {string} uri - The document URI
     * @returns {Promise} A promise that resolves with the folding ranges
     */
    foldingRange(uri) {
        return this.sendRequest('textDocument/foldingRange', {
            textDocument: {
                uri
            }
        });
    }

    /**
     * Set the diagnostics callback
     * @param {Function} callback - The callback function
     */
    onDiagnostics(callback) {
        this.diagnosticsCallback = callback;
    }
}

// Export the client class
if (typeof module !== 'undefined') {
    module.exports = { LSPWebSocketClient };
} else {
    window.LSPWebSocketClient = LSPWebSocketClient;
}
