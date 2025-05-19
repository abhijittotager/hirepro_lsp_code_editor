/**
 * JavaLSPConnector - Connects Monaco editor to a Java LSP server via WebSocket
 * This connector acts as a bridge between the Monaco editor and our Java LSP server,
 * translating Monaco editor events to LSP protocol messages and vice versa.
 */
class JavaLSPConnector {
    /**
     * Creates a new JavaLSPConnector
     * @param {Object} options - Connection options
     * @param {string} options.serverUrl - WebSocket URL to the Java LSP server
     * @param {Array} options.workspaceFolders - Workspace folders for initialization
     */
    constructor(options) {
        this.options = options || {};
        this.serverUrl = options.serverUrl || 'ws://localhost:8090';
        this.workspaceFolders = options.workspaceFolders || [
            { uri: 'file:///workspace', name: 'Java Project' }
        ];
        this.socket = null;
        this.isConnected = false;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.subscriptions = [];
        this.diagnostics = {};
        this.editor = null;
        this.monaco = null;
        this.documentVersions = new Map();
        this.initializeFailed = false;
    }

    /**
     * Initialize the connector with Monaco and editor instances
     * @param {Object} monaco - Monaco API object
     * @param {Object} editor - Monaco editor instance
     */
    async initialize(monaco, editor) {
        this.monaco = monaco;
        this.editor = editor;

        // Connect to the WebSocket server
        await this.connect();

        // Initialize the language server
        await this.initializeServer();

        // Set up event listeners
        this.setupEventListeners();

        return this;
    }

    /**
     * Connect to the WebSocket server
     * @returns {Promise} - Resolves when connected
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to Java LSP server at ${this.serverUrl}...`);
                this.socket = new WebSocket(this.serverUrl);

                this.socket.onopen = () => {
                    console.log('Java LSP WebSocket connection established');
                    this.isConnected = true;
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    this.handleServerMessage(event.data);
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                this.socket.onclose = (event) => {
                    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
                    this.isConnected = false;
                };
            } catch (error) {
                console.error('Error connecting to Java LSP server:', error);
                reject(error);
            }
        });
    }

    /**
     * Initialize the language server with workspace information
     */
    async initializeServer() {
        // Send initialize request
        const initializeResult = await this.sendRequest('initialize', {
            processId: null,
            clientInfo: {
                name: 'Monaco Editor',
                version: '1.0.0'
            },
            rootUri: null,
            workspaceFolders: this.workspaceFolders,
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
                        symbolInformation: {
                            hierarchicalDocumentSymbolSupport: true
                        },
                        documentSymbol: {
                            hierarchicalDocumentSymbolSupport: true
                        }
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
                    selectionRange: {
                        dynamicRegistration: true
                    },
                    publishDiagnostics: {
                        relatedInformation: true,
                        versionSupport: true,
                        tagSupport: {
                            valueSet: [1, 2]
                        }
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
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26
                            ]
                        }
                    },
                    executeCommand: {
                        dynamicRegistration: true
                    }
                }
            }
        });

        console.log('Java LSP server initialized', initializeResult);

        // Notify server that we're ready
        await this.sendNotification('initialized', {});

        // Set up document sync
        const model = this.editor.getModel();
        if (model) {
            this.documentVersions.set(model.uri.toString(), 1);
            await this.sendNotification('textDocument/didOpen', {
                textDocument: {
                    uri: model.uri.toString(),
                    languageId: 'java',
                    version: 1,
                    text: model.getValue()
                }
            });
        }
    }

    /**
     * Set up Monaco editor event listeners
     */
    setupEventListeners() {
        if (!this.editor || !this.monaco) return;

        // Listen for document changes
        this.subscriptions.push(
            this.editor.onDidChangeModelContent((event) => {
                const model = this.editor.getModel();
                if (model) {
                    const uri = model.uri.toString();
                    let version = this.documentVersions.get(uri) || 1;
                    version++;
                    this.documentVersions.set(uri, version);

                    // Convert Monaco changes to LSP changes
                    const changes = event.changes.map(change => {
                        return {
                            range: {
                                start: {
                                    line: change.range.startLineNumber - 1,
                                    character: change.range.startColumn - 1
                                },
                                end: {
                                    line: change.range.endLineNumber - 1,
                                    character: change.range.endColumn - 1
                                }
                            },
                            text: change.text
                        };
                    });

                    // Send document change notification
                    this.sendNotification('textDocument/didChange', {
                        textDocument: {
                            uri: uri,
                            version: version
                        },
                        contentChanges: changes
                    });
                }
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
                if (this.editor.getModel()) {
                    const model = this.editor.getModel();
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
            })
        );
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
                            range: result.range ? this.convertRange(result.range) : null
                        };
                    }
                } catch (error) {
                    console.error('Error getting hover info:', error);
                }

                return null;
            }
        });

        // Register folding range provider
        this.monaco.languages.registerFoldingRangeProvider('java', {
            provideFoldingRanges: async (model, context, token) => {
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

        // Register signature help provider
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
                                documentation: sig.documentation ? sig.documentation.value || sig.documentation : null,
                                parameters: sig.parameters ? sig.parameters.map(p => ({
                                    label: p.label,
                                    documentation: p.documentation ? p.documentation.value || p.documentation : null
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

        // Register definition provider
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
                            uri: this.monaco.Uri.parse(location.uri),
                            range: this.convertRange(location.range)
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
     * Send a request to the LSP server and wait for a response
     * @param {string} method - The LSP method name
     * @param {Object} params - The request parameters
     * @returns {Promise} - Resolves with the response
     */
    sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected to Java LSP server'));
                return;
            }

            const id = this.nextRequestId++;
            const message = {
                jsonrpc: '2.0',
                id,
                method,
                params
            };

            this.pendingRequests.set(id, { resolve, reject });
            this.socket.send(JSON.stringify(message));
        });
    }

    /**
     * Send a notification to the LSP server (no response expected)
     * @param {string} method - The LSP method name
     * @param {Object} params - The notification parameters
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
     * Handle incoming messages from the LSP server
     * @param {string} data - Raw message data
     */
    handleServerMessage(data) {
        try {
            const message = JSON.parse(data);

            // Request/Response handling
            if (message.id !== undefined) {
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
            // Notification handling
            else if (message.method) {
                this.handleServerNotification(message);
            }
        } catch (error) {
            console.error('Error handling server message:', error, data);
        }
    }

    /**
     * Handle server notifications
     * @param {Object} message - The notification message
     */
    handleServerNotification(message) {
        switch (message.method) {
            case 'textDocument/publishDiagnostics':
                this.handleDiagnostics(message.params);
                break;
                
            // Handle other notifications as needed
        }
    }

    /**
     * Handle diagnostic notifications
     * @param {Object} params - Diagnostic parameters
     */
    handleDiagnostics(params) {
        const { uri, diagnostics } = params;
        this.diagnostics[uri] = diagnostics;

        // Convert and apply diagnostics to Monaco model
        const model = this.editor.getModel();
        if (model && model.uri.toString() === uri) {
            const markers = diagnostics.map(d => this.convertDiagnosticToMarker(d, uri));
            this.monaco.editor.setModelMarkers(model, 'java-lsp', markers);
        }
    }

    /**
     * Convert LSP Diagnostic to Monaco marker
     * @param {Object} diagnostic - LSP diagnostic
     * @param {string} uri - Document URI
     * @returns {Object} - Monaco marker
     */
    convertDiagnosticToMarker(diagnostic, uri) {
        return {
            severity: this.convertSeverity(diagnostic.severity),
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            message: diagnostic.message,
            code: diagnostic.code,
            source: diagnostic.source
        };
    }

    /**
     * Convert LSP severity to Monaco severity
     * @param {number} severity - LSP severity (1:Error, 2:Warning, 3:Info, 4:Hint)
     * @returns {number} - Monaco severity
     */
    convertSeverity(severity) {
        switch (severity) {
            case 1: return this.monaco.MarkerSeverity.Error;
            case 2: return this.monaco.MarkerSeverity.Warning;
            case 3: return this.monaco.MarkerSeverity.Info;
            case 4: return this.monaco.MarkerSeverity.Hint;
            default: return this.monaco.MarkerSeverity.Info;
        }
    }

    /**
     * Convert LSP Range to Monaco Range
     * @param {Object} range - LSP range
     * @returns {Object} - Monaco range
     */
    convertRange(range) {
        if (!range) return null;
        return new this.monaco.Range(
            range.start.line + 1,
            range.start.character + 1,
            range.end.line + 1,
            range.end.character + 1
        );
    }

    /**
     * Convert LSP CompletionItem to Monaco suggestion
     * @param {Object} item - LSP completion item
     * @param {Object} position - Monaco position
     * @returns {Object} - Monaco suggestion
     */
    convertCompletionItem(item, position) {
        const suggestion = {
            label: item.label,
            kind: this.convertCompletionItemKind(item.kind),
            insertText: item.insertText || item.label,
            insertTextRules: item.insertTextFormat === 2 ? 
                this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : 
                this.monaco.languages.CompletionItemInsertTextRule.None,
            detail: item.detail,
            documentation: item.documentation && typeof item.documentation === 'object' ? 
                item.documentation.value : item.documentation,
            sortText: item.sortText,
            filterText: item.filterText,
            preselect: item.preselect,
            commitCharacters: item.commitCharacters
        };

        // Handle text edit
        if (item.textEdit) {
            const range = item.textEdit.range;
            suggestion.range = {
                startLineNumber: range.start.line + 1,
                startColumn: range.start.character + 1,
                endLineNumber: range.end.line + 1,
                endColumn: range.end.character + 1
            };
            suggestion.insertText = item.textEdit.newText;
        } else if (item.insertTextFormat === 2) {
            // If it's a snippet but no textEdit is provided, create a default range
            suggestion.range = {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            };
        }

        return suggestion;
    }

    /**
     * Convert LSP CompletionItemKind to Monaco CompletionItemKind
     * @param {number} kind - LSP CompletionItemKind
     * @returns {number} - Monaco CompletionItemKind
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
     * Convert LSP folding range kind to Monaco folding range kind
     * @param {string} kind - LSP folding range kind
     * @returns {string} - Monaco folding range kind
     */
    getFoldingRangeKind(kind) {
        if (!kind) return undefined;
        
        switch (kind) {
            case 'comment': return this.monaco.languages.FoldingRangeKind.Comment;
            case 'imports': return this.monaco.languages.FoldingRangeKind.Imports;
            case 'region': return this.monaco.languages.FoldingRangeKind.Region;
            default: return undefined;
        }
    }

    /**
     * Dispose of the connector, closing connection and removing listeners
     */
    dispose() {
        // Clear all subscriptions
        while (this.subscriptions.length) {
            const sub = this.subscriptions.pop();
            if (sub && sub.dispose) {
                sub.dispose();
            }
        }

        // Close the WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }

        // Clear references
        this.editor = null;
        this.monaco = null;
    }
}
