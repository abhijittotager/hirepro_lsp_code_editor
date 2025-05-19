/**
 * SimpleLSPConnector - A connector to test our simple Java LSP server implementation
 * This provides basic Java language features for Monaco editor
 */
class SimpleLSPConnector {
    /**
     * Initialize the connector
     * @param {Object} options Configuration options
     */
    constructor(options = {}) {
        this.connected = false;
        this.pendingRequests = new Map();
        this.nextRequestId = 1;
        this.serverUrl = options.serverUrl || 'ws://localhost:8090';
        this.socket = null;
        this.monaco = null;
        this.editor = null;
    }

    /**
     * Initialize the connector with Monaco editor
     * @param {Object} monaco Monaco API reference
     * @param {Object} editor Monaco editor instance
     */
    async initialize(monaco, editor) {
        this.monaco = monaco;
        this.editor = editor;
        
        try {
            console.log('Connecting to Java LSP server...');
            await this.connect();
            
            // Register providers with Monaco
            this.registerProviders();
            
            return true;
        } catch (err) {
            console.error('Failed to initialize Java LSP:', err);
            return false;
        }
    }

    /**
     * Connect to the LSP server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // For testing purposes in the browser, we'll simulate a connection
                console.log('Simulating connection to Java LSP server');
                this.connected = true;
                
                // In a real implementation, we would connect to the WebSocket server
                // this.socket = new WebSocket(this.serverUrl);
                // this.socket.onopen = () => { this.connected = true; resolve(); };
                // this.socket.onmessage = (event) => this.handleMessage(event.data);
                // this.socket.onerror = (error) => reject(error);
                
                resolve();
            } catch (error) {
                console.error('Connection error:', error);
                reject(error);
            }
        });
    }

    /**
     * Register all required Monaco providers
     */
    registerProviders() {
        if (!this.monaco || !this.editor) {
            console.error('Monaco editor not initialized');
            return;
        }

        // Register completion provider
        this.monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.'],
            provideCompletionItems: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                // For testing, only provide completions for System.out.
                if (textUntilPosition.endsWith('System.out.')) {
                    return {
                        suggestions: [
                            {
                                label: 'println',
                                kind: this.monaco.languages.CompletionItemKind.Method,
                                insertText: 'println("${1:message}");',
                                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: 'void println(String s)',
                                documentation: 'Prints a string and then terminates the line.'
                            },
                            {
                                label: 'print',
                                kind: this.monaco.languages.CompletionItemKind.Method,
                                insertText: 'print("${1:message}");',
                                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: 'void print(String s)',
                                documentation: 'Prints a string.'
                            },
                            {
                                label: 'printf',
                                kind: this.monaco.languages.CompletionItemKind.Method,
                                insertText: 'printf("${1:format}", ${2:args});',
                                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: 'void printf(String format, Object... args)',
                                documentation: 'Prints a formatted string.'
                            }
                        ]
                    };
                }

                return { suggestions: [] };
            }
        });

        // Register hover provider
        this.monaco.languages.registerHoverProvider('java', {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const text = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: model.getLineMaxColumn(position.lineNumber)
                });

                // For testing, only provide hover for System.out.println
                if (word.word === 'println' && text.includes('System.out.println')) {
                    return {
                        contents: [
                            { value: '**System.out.println**' },
                            { value: 'Prints a string and then terminates the line.' },
                            { value: '```java\nvoid println(String s)\n```' }
                        ]
                    };
                }

                return null;
            }
        });

        // Register diagnostic provider (simulated)
        // In a real implementation, we would receive diagnostics from the server
        // For now, we'll add a simulated diagnostic for lines with "error" in them
        const updateDiagnostics = () => {
            const model = this.editor.getModel();
            if (!model) return;

            const text = model.getValue();
            const lines = text.split('\n');
            const markers = [];

            lines.forEach((line, index) => {
                if (line.includes('error')) {
                    markers.push({
                        severity: this.monaco.MarkerSeverity.Error,
                        message: 'This line contains an error',
                        startLineNumber: index + 1,
                        startColumn: line.indexOf('error') + 1,
                        endLineNumber: index + 1,
                        endColumn: line.indexOf('error') + 6
                    });
                } else if (line.includes(';') && line.trim().length > 0 && !line.trim().startsWith('//')) {
                    // This is valid code with a semicolon
                } else if (line.trim().length > 0 && !line.trim().startsWith('//') && 
                          !line.includes('{') && !line.includes('}') && 
                          !line.trim().endsWith(',')) {
                    // Line might be missing a semicolon
                    markers.push({
                        severity: this.monaco.MarkerSeverity.Warning,
                        message: 'This line might be missing a semicolon',
                        startLineNumber: index + 1,
                        startColumn: line.length + 1,
                        endLineNumber: index + 1,
                        endColumn: line.length + 1
                    });
                }
            });

            // Add the markers to the model
            this.monaco.editor.setModelMarkers(model, 'java', markers);
        };

        // Update diagnostics when the content changes
        this.editor.onDidChangeModelContent(() => {
            updateDiagnostics();
        });

        // Initial diagnostics update
        updateDiagnostics();
    }

    /**
     * Send a request to the LSP server
     * @param {string} method LSP method
     * @param {Object} params Method parameters
     * @returns {Promise} Result promise
     */
    async sendRequest(method, params) {
        const id = this.nextRequestId++;
        
        // In a real implementation, we would send a message to the server
        // Instead, we'll simulate responses for testing
        
        return new Promise((resolve) => {
            console.log(`LSP Request: ${method}`, params);
            
            // Simulate network delay
            setTimeout(() => {
                if (method === 'textDocument/completion') {
                    resolve({
                        isIncomplete: false,
                        items: [
                            {
                                label: 'println',
                                kind: 2,
                                detail: 'void println(String s)',
                                insertText: 'println("${1:message}")',
                                insertTextFormat: 2
                            },
                            {
                                label: 'print',
                                kind: 2,
                                detail: 'void print(String s)',
                                insertText: 'print("${1:message}")',
                                insertTextFormat: 2
                            }
                        ]
                    });
                } else if (method === 'textDocument/hover') {
                    resolve({
                        contents: {
                            kind: 'markdown',
                            value: '**System.out.println**\n\nPrints a string and then terminates the line.'
                        }
                    });
                } else {
                    resolve({});
                }
            }, 50);
        });
    }

    /**
     * Send a notification to the LSP server (no response)
     * @param {string} method LSP method
     * @param {Object} params Method parameters
     */
    sendNotification(method, params) {
        console.log(`LSP Notification: ${method}`, params);
        // In a real implementation, we would send a message to the server
    }

    /**
     * Dispose of the connector
     */
    dispose() {
        // Clean up resources
        this.connected = false;
        // In a real implementation, we would close the WebSocket
    }

    /**
     * Handle diagnostics from the server
     * @param {Object} params Diagnostics parameters
     */
    handleDiagnostics(params) {
        console.log('Received diagnostics:', params);
        
        if (!this.monaco || !this.editor) return;
        
        const model = this.editor.getModel();
        if (!model) return;
        
        const markers = (params.diagnostics || []).map(d => ({
            severity: this.convertSeverity(d.severity),
            message: d.message,
            startLineNumber: d.range.start.line + 1,
            startColumn: d.range.start.character + 1,
            endLineNumber: d.range.end.line + 1,
            endColumn: d.range.end.character + 1
        }));
        
        this.monaco.editor.setModelMarkers(model, 'java', markers);
    }
    
    /**
     * Convert LSP severity to Monaco severity
     * @param {number} severity LSP severity
     * @returns {number} Monaco severity
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
}
