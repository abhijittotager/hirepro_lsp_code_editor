/**
 * Connector for the real Java LSP server
 * This module provides WebSocket connection to our Java LSP server
 * and integrates it with Monaco Editor.
 */

class JavaLSPConnector {
    constructor(options = {}) {
        this.options = Object.assign({
            serverUrl: 'ws://localhost:8090/jdt.ls',
            workspaceFolders: [{
                uri: 'file:///workspace',
                name: 'Java Project'
            }]
        }, options);
        
        this.socket = null;
        this.isConnected = false;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.monaco = null;
        this.editor = null;
        this.diagnosticsCallback = null;
    }
    
    /**
     * Initialize the connector with Monaco and editor instances
     */
    initialize(monaco, editor) {
        this.monaco = monaco;
        this.editor = editor;
        
        // Register LSP capabilities with Monaco
        this.registerProviders();
        
        // Set the status indicator
        this.setStatus('Initializing LSP connection...');
        
        // Connect to the LSP server
        return this.connect();
    }
    
    /**
     * Connect to the LSP server via WebSocket
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to Java LSP server at ${this.options.serverUrl}`);
                this.socket = new WebSocket(this.options.serverUrl);
                
                this.socket.onopen = () => {
                    console.log('WebSocket connection established');
                    this.isConnected = true;
                    
                    // Initialize the LSP server
                    this.sendInitializeRequest()
                        .then(result => {
                            console.log('LSP server initialized', result);
                            this.setStatus('Connected to Java LSP server');
                            
                            // Send initialized notification
                            this.sendNotification('initialized', {});
                            
                            // Open the current document
                            this.openCurrentDocument();
                            
                            resolve(result);
                        })
                        .catch(error => {
                            console.error('Failed to initialize LSP server', error);
                            this.setStatus('Failed to initialize LSP server');
                            reject(error);
                        });
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error', error);
                    this.isConnected = false;
                    this.setStatus('Connection error');
                    reject(error);
                };
                
                this.socket.onclose = (event) => {
                    console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
                    this.isConnected = false;
                    this.setStatus('Disconnected from LSP server');
                };
            } catch (error) {
                console.error('Failed to connect to LSP server', error);
                this.setStatus('Connection failed');
                reject(error);
            }
        });
    }
    
    /**
     * Send initialization request to the LSP server
     */
    sendInitializeRequest() {
        const capabilities = {
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
                formatting: {
                    dynamicRegistration: true
                },
                rangeFormatting: {
                    dynamicRegistration: true
                },
                onTypeFormatting: {
                    dynamicRegistration: true
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
                rename: {
                    dynamicRegistration: true,
                    prepareSupport: true
                },
                foldingRange: {
                    dynamicRegistration: true,
                    rangeLimit: 5000,
                    lineFoldingOnly: true
                }
            },
            workspace: {
                workspaceFolders: true,
                didChangeConfiguration: {
                    dynamicRegistration: true
                },
                didChangeWatchedFiles: {
                    dynamicRegistration: true
                },
                symbol: {
                    dynamicRegistration: true,
                    symbolKind: {
                        valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
                    }
                },
                executeCommand: {
                    dynamicRegistration: true
                }
            }
        };
        
        const params = {
            processId: null,
            clientInfo: {
                name: 'Monaco Editor Java LSP Client',
                version: '1.0.0'
            },
            rootUri: null,
            workspaceFolders: this.options.workspaceFolders,
            capabilities: capabilities
        };
        
        return this.sendRequest('initialize', params);
    }
    
    /**
     * Register LSP capabilities with Monaco editor
     */
    registerProviders() {
        if (!this.monaco || !this.editor) {
            console.error('Monaco or editor not initialized');
            return;
        }
        
        // Register completion provider
        this.monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.', '@', '#', '$'],
            
            provideCompletionItems: (model, position) => {
                return this.provideCompletions(model, position);
            }
        });
        
        // Register hover provider
        this.monaco.languages.registerHoverProvider('java', {
            provideHover: (model, position) => {
                return this.provideHover(model, position);
            }
        });
        
        // Register signature help provider
        this.monaco.languages.registerSignatureHelpProvider('java', {
            signatureHelpTriggerCharacters: ['(', ','],
            
            provideSignatureHelp: (model, position) => {
                return this.provideSignatureHelp(model, position);
            }
        });
        
        // Register folding range provider
        this.monaco.languages.registerFoldingRangeProvider('java', {
            provideFoldingRanges: (model) => {
                return this.provideFoldingRanges(model);
            }
        });
        
        // Set up document change listener
        this.setupDocumentListeners();
    }
    
    /**
     * Set up listeners for document changes
     */
    setupDocumentListeners() {
        const model = this.editor.getModel();
        if (!model) {
            console.warn('No model available');
            return;
        }
        
        // Add content change listener
        model.onDidChangeContent((event) => {
            this.handleDocumentChange(model);
        });
    }
    
    /**
     * Handle document change and notify LSP server
     */
    handleDocumentChange(model) {
        if (!this.isConnected) {
            return;
        }
        
        const uri = model.uri.toString();
        const text = model.getValue();
        
        // Notify the LSP server
        this.sendNotification('textDocument/didChange', {
            textDocument: {
                uri: uri,
                version: Date.now()
            },
            contentChanges: [
                {
                    text: text
                }
            ]
        });
    }
    
    /**
     * Open the current document with the LSP server
     */
    openCurrentDocument() {
        if (!this.isConnected) {
            return;
        }
        
        const model = this.editor.getModel();
        if (!model) {
            return;
        }
        
        const uri = model.uri.toString();
        const text = model.getValue();
        const languageId = model.getLanguageId();
        
        // Notify the LSP server
        this.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri: uri,
                languageId: languageId,
                version: Date.now(),
                text: text
            }
        });
    }
    
    /**
     * Provide completions through LSP
     */
    provideCompletions(model, position) {
        if (!this.isConnected) {
            return { suggestions: [] };
        }
        
        return new Promise((resolve) => {
            const uri = model.uri.toString();
            
            this.sendRequest('textDocument/completion', {
                textDocument: {
                    uri: uri
                },
                position: {
                    line: position.lineNumber - 1,
                    character: position.column - 1
                }
            }).then(result => {
                if (!result) {
                    resolve({ suggestions: [] });
                    return;
                }
                
                // Convert LSP completion items to Monaco suggestions
                const suggestions = this.convertCompletionItems(result.items || result);
                resolve({ suggestions });
            }).catch(error => {
                console.error('Error getting completions', error);
                resolve({ suggestions: [] });
            });
        });
    }
    
    /**
     * Convert LSP completion items to Monaco suggestions
     */
    convertCompletionItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }
        
        return items.map(item => {
            const suggestion = {
                label: item.label,
                kind: this.convertCompletionItemKind(item.kind),
                insertText: item.insertText || item.label,
                detail: item.detail,
                documentation: this.convertMarkupContent(item.documentation)
            };
            
            // Handle snippet format
            if (item.insertTextFormat === 2) { // 2 = Snippet
                suggestion.insertTextRules = this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }
            
            return suggestion;
        });
    }
    
    /**
     * Convert LSP CompletionItemKind to Monaco CompletionItemKind
     */
    convertCompletionItemKind(kind) {
        const MonacoCompletionItemKind = this.monaco.languages.CompletionItemKind;
        
        switch (kind) {
            case 1: return MonacoCompletionItemKind.Text;
            case 2: return MonacoCompletionItemKind.Method;
            case 3: return MonacoCompletionItemKind.Function;
            case 4: return MonacoCompletionItemKind.Constructor;
            case 5: return MonacoCompletionItemKind.Field;
            case 6: return MonacoCompletionItemKind.Variable;
            case 7: return MonacoCompletionItemKind.Class;
            case 8: return MonacoCompletionItemKind.Interface;
            case 9: return MonacoCompletionItemKind.Module;
            case 10: return MonacoCompletionItemKind.Property;
            case 11: return MonacoCompletionItemKind.Unit;
            case 12: return MonacoCompletionItemKind.Value;
            case 13: return MonacoCompletionItemKind.Enum;
            case 14: return MonacoCompletionItemKind.Keyword;
            case 15: return MonacoCompletionItemKind.Snippet;
            case 16: return MonacoCompletionItemKind.Color;
            case 17: return MonacoCompletionItemKind.File;
            case 18: return MonacoCompletionItemKind.Reference;
            case 19: return MonacoCompletionItemKind.Folder;
            case 20: return MonacoCompletionItemKind.EnumMember;
            case 21: return MonacoCompletionItemKind.Constant;
            case 22: return MonacoCompletionItemKind.Struct;
            case 23: return MonacoCompletionItemKind.Event;
            case 24: return MonacoCompletionItemKind.Operator;
            case 25: return MonacoCompletionItemKind.TypeParameter;
            default: return MonacoCompletionItemKind.Text;
        }
    }
    
    /**
     * Provide hover information through LSP
     */
    provideHover(model, position) {
        if (!this.isConnected) {
            return null;
        }
        
        return new Promise((resolve) => {
            const uri = model.uri.toString();
            
            this.sendRequest('textDocument/hover', {
                textDocument: {
                    uri: uri
                },
                position: {
                    line: position.lineNumber - 1,
                    character: position.column - 1
                }
            }).then(result => {
                if (!result || !result.contents) {
                    resolve(null);
                    return;
                }
                
                const contents = this.convertMarkupContent(result.contents);
                
                // Convert LSP range to Monaco range if present
                let range = null;
                if (result.range) {
                    range = new this.monaco.Range(
                        result.range.start.line + 1,
                        result.range.start.character + 1,
                        result.range.end.line + 1,
                        result.range.end.character + 1
                    );
                }
                
                resolve({
                    contents: [contents],
                    range: range
                });
            }).catch(error => {
                console.error('Error getting hover info', error);
                resolve(null);
            });
        });
    }
    
    /**
     * Provide signature help through LSP
     */
    provideSignatureHelp(model, position) {
        if (!this.isConnected) {
            return null;
        }
        
        return new Promise((resolve) => {
            const uri = model.uri.toString();
            
            this.sendRequest('textDocument/signatureHelp', {
                textDocument: {
                    uri: uri
                },
                position: {
                    line: position.lineNumber - 1,
                    character: position.column - 1
                }
            }).then(result => {
                if (!result || !result.signatures || result.signatures.length === 0) {
                    resolve(null);
                    return;
                }
                
                // Convert LSP SignatureHelp to Monaco SignatureHelp
                const signatures = result.signatures.map(sig => {
                    return {
                        label: sig.label,
                        documentation: this.convertMarkupContent(sig.documentation),
                        parameters: sig.parameters ? sig.parameters.map(param => {
                            return {
                                label: param.label,
                                documentation: this.convertMarkupContent(param.documentation)
                            };
                        }) : []
                    };
                });
                
                resolve({
                    signatures: signatures,
                    activeSignature: result.activeSignature || 0,
                    activeParameter: result.activeParameter || 0
                });
            }).catch(error => {
                console.error('Error getting signature help', error);
                resolve(null);
            });
        });
    }
    
    /**
     * Provide folding ranges through LSP
     */
    provideFoldingRanges(model) {
        if (!this.isConnected) {
            return [];
        }
        
        return new Promise((resolve) => {
            const uri = model.uri.toString();
            
            this.sendRequest('textDocument/foldingRange', {
                textDocument: {
                    uri: uri
                }
            }).then(result => {
                if (!result || !Array.isArray(result)) {
                    resolve([]);
                    return;
                }
                
                // Convert LSP FoldingRange to Monaco FoldingRange
                const ranges = result.map(range => {
                    let kind = undefined;
                    if (range.kind === 'comment') {
                        kind = this.monaco.languages.FoldingRangeKind.Comment;
                    } else if (range.kind === 'imports') {
                        kind = this.monaco.languages.FoldingRangeKind.Imports;
                    } else if (range.kind === 'region') {
                        kind = this.monaco.languages.FoldingRangeKind.Region;
                    }
                    
                    return {
                        start: range.startLine + 1,
                        end: range.endLine + 1,
                        kind: kind
                    };
                });
                
                resolve(ranges);
            }).catch(error => {
                console.error('Error getting folding ranges', error);
                resolve([]);
            });
        });
    }
    
    /**
     * Convert LSP MarkupContent to Monaco IMarkdownString
     */
    convertMarkupContent(content) {
        if (!content) {
            return '';
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        if (Array.isArray(content)) {
            // MarkedString[]
            return content.map(item => {
                if (typeof item === 'string') {
                    return item;
                }
                return item.value;
            }).join('\n\n');
        }
        
        // MarkupContent object
        return content.value || '';
    }
    
    /**
     * Handle LSP diagnostics
     */
    handleDiagnostics(params) {
        if (!this.monaco || !this.editor) {
            return;
        }
        
        const uri = params.uri;
        const diagnostics = params.diagnostics || [];
        
        // Find the corresponding model
        let model = null;
        this.monaco.editor.getModels().forEach(m => {
            if (m.uri.toString() === uri) {
                model = m;
            }
        });
        
        if (!model) {
            return;
        }
        
        // Convert LSP diagnostics to Monaco markers
        const markers = diagnostics.map(diag => {
            const severity = diag.severity ? this.convertDiagnosticSeverity(diag.severity) : this.monaco.MarkerSeverity.Info;
            
            return {
                severity: severity,
                startLineNumber: diag.range.start.line + 1,
                startColumn: diag.range.start.character + 1,
                endLineNumber: diag.range.end.line + 1,
                endColumn: diag.range.end.character + 1,
                message: diag.message,
                source: diag.source || 'java-lsp'
            };
        });
        
        // Set markers on the model
        this.monaco.editor.setModelMarkers(model, 'java-lsp', markers);
    }
    
    /**
     * Convert LSP DiagnosticSeverity to Monaco MarkerSeverity
     */
    convertDiagnosticSeverity(severity) {
        switch (severity) {
            case 1: return this.monaco.MarkerSeverity.Error;
            case 2: return this.monaco.MarkerSeverity.Warning;
            case 3: return this.monaco.MarkerSeverity.Info;
            case 4: return this.monaco.MarkerSeverity.Hint;
            default: return this.monaco.MarkerSeverity.Info;
        }
    }
    
    /**
     * Send a request to the LSP server
     */
    sendRequest(method, params) {
        if (!this.isConnected) {
            return Promise.reject(new Error('Not connected to LSP server'));
        }
        
        const id = this.nextRequestId++;
        const message = {
            jsonrpc: '2.0',
            id: id,
            method: method,
            params: params
        };
        
        return new Promise((resolve, reject) => {
            // Store the callbacks to be called when we get a response
            this.pendingRequests.set(id, { resolve, reject });
            
            // Send the message
            this.socket.send(JSON.stringify(message));
        });
    }
    
    /**
     * Send a notification to the LSP server (no response expected)
     */
    sendNotification(method, params) {
        if (!this.isConnected) {
            console.warn(`Cannot send notification ${method}: Not connected to LSP server`);
            return;
        }
        
        const message = {
            jsonrpc: '2.0',
            method: method,
            params: params
        };
        
        this.socket.send(JSON.stringify(message));
    }
    
    /**
     * Handle incoming messages from the LSP server
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            // Response to a request
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
                return;
            }
            
            // Notification from server
            if (message.method) {
                this.handleNotification(message.method, message.params);
                return;
            }
            
            console.log('Unhandled message:', message);
        } catch (error) {
            console.error('Error handling message', error, data);
        }
    }
    
    /**
     * Handle notifications from the LSP server
     */
    handleNotification(method, params) {
        switch (method) {
            case 'textDocument/publishDiagnostics':
                this.handleDiagnostics(params);
                break;
                
            case 'window/showMessage':
                console.log(`[LSP] ${params.message}`);
                break;
                
            case 'window/logMessage':
                console.log(`[LSP Log] ${params.message}`);
                break;
                
            default:
                console.log(`[LSP Notification] ${method}`, params);
                break;
        }
    }
    
    /**
     * Set the status message in the UI
     */
    setStatus(message) {
        const statusItem = document.querySelector('.status-bar .status-item:first-child');
        if (statusItem) {
            statusItem.textContent = message;
        }
    }
    
    /**
     * Clean up resources when disconnecting
     */
    dispose() {
        if (this.socket) {
            // Send shutdown request
            if (this.isConnected) {
                this.sendRequest('shutdown', {})
                    .then(() => {
                        this.sendNotification('exit', {});
                        this.socket.close();
                    })
                    .catch(error => {
                        console.error('Error shutting down LSP server', error);
                        this.socket.close();
                    });
            } else {
                this.socket.close();
            }
        }
        
        this.isConnected = false;
        this.pendingRequests.clear();
    }
}

// Export the connector
if (typeof module !== 'undefined') {
    module.exports = { JavaLSPConnector };
} else {
    window.JavaLSPConnector = JavaLSPConnector;
}
