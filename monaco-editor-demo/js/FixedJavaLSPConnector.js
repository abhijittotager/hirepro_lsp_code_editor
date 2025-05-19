/**
 * FixedJavaLSPConnector - A connector for VS Code's Java Language Server Protocol
 * This properly integrates VS Code's JDT.LS with Monaco Editor
 */
class FixedJavaLSPConnector {
    /**
     * Initialize the connector
     * @param {Object} options Configuration options
     */
    constructor(options = {}) {
        // Configuration to enable/disable LSP (default: disabled to avoid connection errors)
        this.useLSP = options.useLSP || false;
        
        this.serverUrl = options.serverUrl || 'ws://localhost:8090';
        this.workspaceFolders = options.workspaceFolders || [
            { uri: 'file:///workspace', name: 'Java Project' }
        ];
        this.initialized = false;
        this.isConnected = false;
        this.socket = null;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.editor = null;
        this.monaco = null;
        this.usingFallbackIntelliSense = !this.useLSP; // Use fallback by default if LSP is disabled

        // Event handlers
        this.onDiagnostics = null;
        this.documentVersions = new Map();
    }

    /**
     * Initialize the language server connection
     * @param {Object} monaco Monaco API reference
     * @param {Object} editor Monaco editor instance
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    async initialize(monaco, editor) {
        this.editor = editor;
        this.monaco = monaco;
        
        console.log('Initializing Java LSP connection...');
        if (this.initialized) {
            console.log('Java LSP already initialized');
            return true;
        }
        
        try {
            // First ensure Universal IntelliSense is available as a fallback
            if (typeof initJavaUniversalAutocomplete === 'function') {
                initJavaUniversalAutocomplete();
                console.log('Universal Java IntelliSense initialized');
            }
            
            // If LSP is disabled, skip connection attempt completely
            if (!this.useLSP) {
                console.log('LSP is disabled - using Universal IntelliSense only');
                this.initialized = true;
                this.usingFallbackIntelliSense = true;
                return true;
            }
            
            // Try to connect to LSP server only if enabled
            await this.connect();
            
            // If we're using fallback mode, don't attempt to initialize LSP
            if (this.usingFallbackIntelliSense) {
                console.log('Using Universal IntelliSense fallback mode - LSP initialization skipped');
                this.initialized = true;
                return true;
            }
            
            // Initialize LSP
            await this.initializeLSP();
            
            // Register handlers
            this.registerHandlers();
            
            this.initialized = true;
            console.log('Java LSP initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Java LSP:', error);
            console.log('Continuing with Universal IntelliSense only mode');
            
            // Ensure we're still initialized with fallback
            this.initialized = true;
            this.usingFallbackIntelliSense = true;
            
            return true; // Return true so the editor continues loading
        }
    }

    /**
     * Connect to the LSP WebSocket server
     * @returns {Promise} Promise that resolves when connected
     */
    connect() {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to Java LSP server at ${this.serverUrl}...`);
            
            try {
                this.socket = new WebSocket(this.serverUrl);
                
                this.socket.onopen = () => {
                    console.log('WebSocket connection established');
                    this.isConnected = true;
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    console.log('Falling back to Universal Java IntelliSense...');
                    
                    // Ensure Universal IntelliSense is initialized
                    if (typeof initJavaUniversalAutocomplete === 'function') {
                        initJavaUniversalAutocomplete();
                        console.log('Universal Java IntelliSense initialized as fallback');
                    }
                    
                    // Resolve instead of reject to allow the app to continue
                    // with degraded functionality (without LSP features)
                    this.usingFallbackIntelliSense = true;
                    resolve();
                };
                
                this.socket.onclose = () => {
                    console.log('WebSocket connection closed');
                    this.isConnected = false;
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Initialize the LSP server
     * @returns {Promise} Promise that resolves when LSP is initialized
     */
    async initializeLSP() {
        // Send initialize request to the server
        const initializeResult = await this.sendRequest('initialize', {
            processId: null,
            clientInfo: {
                name: 'Monaco Editor',
                version: '1.0.0'
            },
            rootUri: null,
            workspaceFolders: this.workspaceFolders,
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
                            valueSet: Array.from({ length: 26 }, (_, i) => i + 1)
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
                        dynamicRegistration: true
                    },
                    typeDefinition: {
                        dynamicRegistration: true
                    },
                    implementation: {
                        dynamicRegistration: true
                    },
                    colorProvider: {
                        dynamicRegistration: true
                    },
                    foldingRange: {
                        dynamicRegistration: true,
                        rangeLimit: 5000,
                        lineFoldingOnly: true
                    },
                    declaration: {
                        dynamicRegistration: true
                    }
                }
            }
        });
        
        console.log('LSP server initialized with capabilities:', initializeResult.capabilities);
        
        // Send initialized notification
        this.sendNotification('initialized', {});
        
        // Notify LSP that the document is open
        const model = this.editor.getModel();
        if (model) {
            this.notifyDocumentOpened(model);
        }
        
        return initializeResult;
    }

    /**
     * Register necessary event handlers
     */
    registerHandlers() {
        // Register language features
        this.registerLanguageFeatures();
        
        // Listen for document changes
        this.subscriptions.push(
            this.editor.onDidChangeModelContent((event) => {
                const model = this.editor.getModel();
                if (!model) return;
                
                const uri = model.uri.toString();
                const version = this.documentVersions.get(uri) || 1;
                this.documentVersions.set(uri, version + 1);
                
                // Notify LSP of document change
                this.sendNotification('textDocument/didChange', {
                    textDocument: {
                        uri: uri,
                        version: version + 1
                    },
                    contentChanges: event.changes.map(change => ({
                        range: this.convertMonacoRangeToLSPRange(change.range),
                        text: change.text
                    }))
                });
            })
        );
        
        // Listen for model changes
        this.subscriptions.push(
            this.editor.onDidChangeModel((event) => {
                // Close previous document if exists
                if (event.oldModelUrl) {
                    this.sendNotification('textDocument/didClose', {
                        textDocument: {
                            uri: event.oldModelUrl.toString()
                        }
                    });
                }
                
                // Open new document if exists
                const model = this.editor.getModel();
                if (model) {
                    this.notifyDocumentOpened(model);
                }
            })
        );
    }

    /**
     * Register language features with Monaco
     */
    registerLanguageFeatures() {
        // Register completion provider
        this.registerCompletionProvider();
        
        // Register hover provider
        this.registerHoverProvider();
        
        // Register signature help provider
        this.registerSignatureHelpProvider();
        
        // Register definition provider
        this.registerDefinitionProvider();
        
        // Register document symbol provider
        this.registerDocumentSymbolProvider();
        
        // Register folding range provider
        this.registerFoldingRangeProvider();
    }

    /**
     * Register completion provider
     */
    registerCompletionProvider() {
        this.monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.', '@', '#', '$', '(', ',', ' '],
            
            provideCompletionItems: async (model, position) => {
                if (!this.isConnected) return { suggestions: [] };
                
                try {
                    const result = await this.sendRequest('textDocument/completion', {
                        textDocument: {
                            uri: model.uri.toString()
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        },
                        context: {
                            triggerKind: 1, // Invoked
                            triggerCharacter: model.getLineContent(position.lineNumber)[position.column - 2]
                        }
                    });
                    
                    // Convert LSP completion items to Monaco suggestions
                    if (result && (result.items || Array.isArray(result))) {
                        const items = result.items || result;
                        const wordUntil = model.getWordUntilPosition(position);
                        const defaultRange = {
                            startLineNumber: position.lineNumber,
                            startColumn: wordUntil.startColumn,
                            endLineNumber: position.lineNumber,
                            endColumn: wordUntil.endColumn
                        };
                        
                        return {
                            suggestions: items.map(item => this.convertCompletionItem(item, position, defaultRange)),
                            incomplete: result.isIncomplete === true
                        };
                    }
                } catch (error) {
                    console.error('Error getting completions:', error);
                }
                
                return { suggestions: [] };
            }
        });
    }

    /**
     * Register hover provider
     */
    registerHoverProvider() {
        this.monaco.languages.registerHoverProvider('java', {
            provideHover: async (model, position) => {
                if (!this.isConnected) return null;
                
                try {
                    const result = await this.sendRequest('textDocument/hover', {
                        textDocument: {
                            uri: model.uri.toString()
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        }
                    });
                    
                    if (result && result.contents) {
                        let contents;
                        if (typeof result.contents === 'string') {
                            contents = result.contents;
                        } else if (result.contents.value) {
                            contents = result.contents.value;
                        } else if (Array.isArray(result.contents)) {
                            contents = result.contents.map(c => {
                                if (typeof c === 'string') return c;
                                return c.value || '';
                            }).join('\n\n');
                        }
                        
                        return {
                            contents: [{
                                value: contents
                            }],
                            range: result.range ? this.convertLSPRangeToMonacoRange(result.range) : null
                        };
                    }
                } catch (error) {
                    console.error('Error getting hover info:', error);
                }
                
                return null;
            }
        });
    }

    /**
     * Register signature help provider
     */
    registerSignatureHelpProvider() {
        this.monaco.languages.registerSignatureHelpProvider('java', {
            signatureHelpTriggerCharacters: ['(', ','],
            
            provideSignatureHelp: async (model, position) => {
                if (!this.isConnected) return null;
                
                try {
                    const result = await this.sendRequest('textDocument/signatureHelp', {
                        textDocument: {
                            uri: model.uri.toString()
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        }
                    });
                    
                    if (result && result.signatures && result.signatures.length > 0) {
                        return {
                            signatures: result.signatures.map(sig => ({
                                label: sig.label,
                                documentation: sig.documentation ? sig.documentation.value || sig.documentation : '',
                                parameters: sig.parameters ? sig.parameters.map(p => ({
                                    label: p.label,
                                    documentation: p.documentation ? p.documentation.value || p.documentation : ''
                                })) : []
                            })),
                            activeSignature: result.activeSignature || 0,
                            activeParameter: result.activeParameter || 0
                        };
                    }
                } catch (error) {
                    console.error('Error getting signature help:', error);
                }
                
                return null;
            }
        });
    }

    /**
     * Register definition provider
     */
    registerDefinitionProvider() {
        this.monaco.languages.registerDefinitionProvider('java', {
            provideDefinition: async (model, position) => {
                if (!this.isConnected) return null;
                
                try {
                    const result = await this.sendRequest('textDocument/definition', {
                        textDocument: {
                            uri: model.uri.toString()
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        }
                    });
                    
                    if (result) {
                        const locations = Array.isArray(result) ? result : [result];
                        return locations.map(location => ({
                            uri: monaco.Uri.parse(location.uri),
                            range: this.convertLSPRangeToMonacoRange(location.range)
                        }));
                    }
                } catch (error) {
                    console.error('Error getting definition:', error);
                }
                
                return null;
            }
        });
    }

    /**
     * Register document symbol provider
     */
    registerDocumentSymbolProvider() {
        this.monaco.languages.registerDocumentSymbolProvider('java', {
            provideDocumentSymbols: async (model) => {
                if (!this.isConnected) return [];
                
                try {
                    const result = await this.sendRequest('textDocument/documentSymbol', {
                        textDocument: {
                            uri: model.uri.toString()
                        }
                    });
                    
                    if (Array.isArray(result)) {
                        return result.map(symbol => ({
                            name: symbol.name,
                            detail: '',
                            kind: this.convertSymbolKind(symbol.kind),
                            range: this.convertLSPRangeToMonacoRange(symbol.range),
                            selectionRange: this.convertLSPRangeToMonacoRange(symbol.selectionRange || symbol.range),
                            children: symbol.children ? symbol.children.map(child => ({
                                name: child.name,
                                detail: '',
                                kind: this.convertSymbolKind(child.kind),
                                range: this.convertLSPRangeToMonacoRange(child.range),
                                selectionRange: this.convertLSPRangeToMonacoRange(child.selectionRange || child.range)
                            })) : []
                        }));
                    }
                } catch (error) {
                    console.error('Error getting document symbols:', error);
                }
                
                return [];
            }
        });
    }

    /**
     * Register folding range provider
     */
    registerFoldingRangeProvider() {
        this.monaco.languages.registerFoldingRangeProvider('java', {
            provideFoldingRanges: async (model) => {
                if (!this.isConnected) return [];
                
                try {
                    const result = await this.sendRequest('textDocument/foldingRange', {
                        textDocument: {
                            uri: model.uri.toString()
                        }
                    });
                    
                    if (Array.isArray(result)) {
                        return result.map(range => ({
                            start: range.startLine + 1,
                            end: range.endLine + 1,
                            kind: this.getFoldingRangeKind(range.kind)
                        }));
                    }
                } catch (error) {
                    console.error('Error getting folding ranges:', error);
                }
                
                return [];
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     * @param {string} data Message data
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            // Handle request/response
            if (message.id) {
                const request = this.pendingRequests.get(message.id);
                if (request) {
                    this.pendingRequests.delete(message.id);
                    if (message.error) {
                        request.reject(message.error);
                    } else {
                        request.resolve(message.result);
                    }
                }
            }
            // Handle notifications
            else if (message.method) {
                this.handleNotification(message);
            }
        } catch (error) {
            console.error('Error handling message:', error, data);
        }
    }

    /**
     * Handle LSP notifications
     * @param {Object} message Notification message
     */
    handleNotification(message) {
        switch (message.method) {
            case 'textDocument/publishDiagnostics':
                this.handleDiagnostics(message.params);
                break;
                
            case 'window/showMessage':
                console.log('LSP Message:', message.params.message);
                break;
                
            default:
                // Handle other notifications as needed
                break;
        }
    }

    /**
     * Handle diagnostics notifications
     * @param {Object} params Diagnostics parameters
     */
    handleDiagnostics(params) {
        const model = this.editor.getModel();
        if (!model || model.uri.toString() !== params.uri) return;
        
        const markers = (params.diagnostics || []).map(d => ({
            severity: this.convertDiagnosticSeverity(d.severity),
            message: d.message,
            startLineNumber: d.range.start.line + 1,
            startColumn: d.range.start.character + 1,
            endLineNumber: d.range.end.line + 1,
            endColumn: d.range.end.character + 1,
            source: d.source || 'java'
        }));
        
        this.monaco.editor.setModelMarkers(model, 'java', markers);
    }

    /**
     * Send a request to the LSP server
     * @param {string} method LSP method
     * @param {Object} params Method parameters
     * @returns {Promise} Result promise
     */
    sendRequest(method, params) {
        if (!this.isConnected) {
            return Promise.reject(new Error('Not connected to LSP server'));
        }
        
        const id = this.nextRequestId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };
        
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.socket.send(JSON.stringify(message));
        });
    }

    /**
     * Send a notification to the LSP server (no response)
     * @param {string} method LSP method
     * @param {Object} params Method parameters
     */
    sendNotification(method, params) {
        if (!this.isConnected) return;
        
        const message = {
            jsonrpc: '2.0',
            method,
            params
        };
        
        this.socket.send(JSON.stringify(message));
    }

    /**
     * Notify LSP that a document has been opened
     * @param {Object} model Monaco model
     */
    notifyDocumentOpened(model) {
        const uri = model.uri.toString();
        this.documentVersions.set(uri, 1);
        
        this.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri: uri,
                languageId: 'java',
                version: 1,
                text: model.getValue()
            }
        });
    }

    /**
     * Convert Monaco range to LSP range
     * @param {Object} range Monaco range
     * @returns {Object} LSP range
     */
    convertMonacoRangeToLSPRange(range) {
        return {
            start: {
                line: range.startLineNumber - 1,
                character: range.startColumn - 1
            },
            end: {
                line: range.endLineNumber - 1,
                character: range.endColumn - 1
            }
        };
    }

    /**
     * Convert LSP range to Monaco range
     * @param {Object} range LSP range
     * @returns {Object} Monaco range
     */
    convertLSPRangeToMonacoRange(range) {
        return {
            startLineNumber: range.start.line + 1,
            startColumn: range.start.character + 1,
            endLineNumber: range.end.line + 1,
            endColumn: range.end.character + 1
        };
    }

    /**
     * Convert completion item from LSP to Monaco
     * @param {Object} item LSP completion item
     * @param {Object} position Monaco position
     * @param {Object} range Monaco range
     * @returns {Object} Monaco completion item
     */
    convertCompletionItem(item, position, range) {
        let kind;
        switch (item.kind) {
            case 1: kind = this.monaco.languages.CompletionItemKind.Text; break;
            case 2: kind = this.monaco.languages.CompletionItemKind.Method; break;
            case 3: kind = this.monaco.languages.CompletionItemKind.Function; break;
            case 4: kind = this.monaco.languages.CompletionItemKind.Constructor; break;
            case 5: kind = this.monaco.languages.CompletionItemKind.Field; break;
            case 6: kind = this.monaco.languages.CompletionItemKind.Variable; break;
            case 7: kind = this.monaco.languages.CompletionItemKind.Class; break;
            case 8: kind = this.monaco.languages.CompletionItemKind.Interface; break;
            case 9: kind = this.monaco.languages.CompletionItemKind.Module; break;
            case 10: kind = this.monaco.languages.CompletionItemKind.Property; break;
            case 11: kind = this.monaco.languages.CompletionItemKind.Unit; break;
            case 12: kind = this.monaco.languages.CompletionItemKind.Value; break;
            case 13: kind = this.monaco.languages.CompletionItemKind.Enum; break;
            case 14: kind = this.monaco.languages.CompletionItemKind.Keyword; break;
            case 15: kind = this.monaco.languages.CompletionItemKind.Snippet; break;
            case 16: kind = this.monaco.languages.CompletionItemKind.Color; break;
            case 17: kind = this.monaco.languages.CompletionItemKind.File; break;
            case 18: kind = this.monaco.languages.CompletionItemKind.Reference; break;
            case 19: kind = this.monaco.languages.CompletionItemKind.Folder; break;
            case 20: kind = this.monaco.languages.CompletionItemKind.EnumMember; break;
            case 21: kind = this.monaco.languages.CompletionItemKind.Constant; break;
            case 22: kind = this.monaco.languages.CompletionItemKind.Struct; break;
            case 23: kind = this.monaco.languages.CompletionItemKind.Event; break;
            case 24: kind = this.monaco.languages.CompletionItemKind.Operator; break;
            case 25: kind = this.monaco.languages.CompletionItemKind.TypeParameter; break;
            default: kind = this.monaco.languages.CompletionItemKind.Text; break;
        }
        
        let insertTextRules = this.monaco.languages.CompletionItemInsertTextRule.None;
        if (item.insertTextFormat === 2) {
            insertTextRules = this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }
        
        return {
            label: item.label,
            kind: kind,
            detail: item.detail || '',
            documentation: item.documentation ? (typeof item.documentation === 'string' ? item.documentation : item.documentation.value) : '',
            insertText: item.insertText || item.label,
            insertTextRules: insertTextRules,
            range: item.textEdit ? this.convertLSPRangeToMonacoRange(item.textEdit.range) : range,
            sortText: item.sortText,
            filterText: item.filterText,
            commitCharacters: item.commitCharacters,
            additionalTextEdits: item.additionalTextEdits ? item.additionalTextEdits.map(edit => ({
                range: this.convertLSPRangeToMonacoRange(edit.range),
                text: edit.newText
            })) : undefined
        };
    }

    /**
     * Convert symbol kind from LSP to Monaco
     * @param {number} kind LSP symbol kind
     * @returns {number} Monaco symbol kind
     */
    convertSymbolKind(kind) {
        switch (kind) {
            case 1: return this.monaco.languages.SymbolKind.File;
            case 2: return this.monaco.languages.SymbolKind.Module;
            case 3: return this.monaco.languages.SymbolKind.Namespace;
            case 4: return this.monaco.languages.SymbolKind.Package;
            case 5: return this.monaco.languages.SymbolKind.Class;
            case 6: return this.monaco.languages.SymbolKind.Method;
            case 7: return this.monaco.languages.SymbolKind.Property;
            case 8: return this.monaco.languages.SymbolKind.Field;
            case 9: return this.monaco.languages.SymbolKind.Constructor;
            case 10: return this.monaco.languages.SymbolKind.Enum;
            case 11: return this.monaco.languages.SymbolKind.Interface;
            case 12: return this.monaco.languages.SymbolKind.Function;
            case 13: return this.monaco.languages.SymbolKind.Variable;
            case 14: return this.monaco.languages.SymbolKind.Constant;
            case 15: return this.monaco.languages.SymbolKind.String;
            case 16: return this.monaco.languages.SymbolKind.Number;
            case 17: return this.monaco.languages.SymbolKind.Boolean;
            case 18: return this.monaco.languages.SymbolKind.Array;
            case 19: return this.monaco.languages.SymbolKind.Object;
            case 20: return this.monaco.languages.SymbolKind.Key;
            case 21: return this.monaco.languages.SymbolKind.Null;
            case 22: return this.monaco.languages.SymbolKind.EnumMember;
            case 23: return this.monaco.languages.SymbolKind.Struct;
            case 24: return this.monaco.languages.SymbolKind.Event;
            case 25: return this.monaco.languages.SymbolKind.Operator;
            case 26: return this.monaco.languages.SymbolKind.TypeParameter;
            default: return this.monaco.languages.SymbolKind.Variable;
        }
    }

    /**
     * Convert diagnostic severity from LSP to Monaco
     * @param {number} severity LSP severity
     * @returns {number} Monaco severity
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
     * Get folding range kind
     * @param {string} kind LSP folding range kind
     * @returns {string} Monaco folding range kind
     */
    getFoldingRangeKind(kind) {
        if (kind === 'comment') return this.monaco.languages.FoldingRangeKind.Comment;
        if (kind === 'imports') return this.monaco.languages.FoldingRangeKind.Imports;
        if (kind === 'region') return this.monaco.languages.FoldingRangeKind.Region;
        return this.monaco.languages.FoldingRangeKind.Region;
    }

    /**
     * Dispose of the connector
     */
    dispose() {
        // Clear subscriptions
        this.subscriptions.forEach(sub => sub.dispose());
        this.subscriptions = [];
        
        // Close WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
        
        // Clear diagnostics
        const model = this.editor.getModel();
        if (model) {
            this.monaco.editor.setModelMarkers(model, 'java', []);
        }
        
        this.initialized = false;
        this.isConnected = false;
    }
}
