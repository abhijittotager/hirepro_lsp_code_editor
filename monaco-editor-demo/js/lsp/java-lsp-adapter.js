/**
 * Java Language Server Protocol (LSP) adapter for Monaco Editor
 * This module integrates Monaco with Eclipse JDT.LS (Java Language Server)
 */

class JavaLSPAdapter {
    constructor(monaco, editor, options = {}) {
        this.monaco = monaco;
        this.editor = editor;
        this.options = Object.assign({
            serverUrl: 'ws://localhost:8090/jdt.ls', // Default Eclipse JDT.LS WebSocket endpoint
            workspaceFolders: null
        }, options);
        
        // Create LSP client
        this.lspClient = new LSPWebSocketClient({
            serverUrl: this.options.serverUrl,
            workspaceFolders: this.options.workspaceFolders,
            languageId: 'java',
            documentSelector: ['java'],
            name: 'Monaco Java LSP Client'
        });
        
        // Document version tracking
        this.documentVersions = new Map();
        
        // Markers owner (for diagnostics)
        this.MARKER_OWNER = 'java-lsp';
        
        // Monaco model URI to LSP document URI mapping
        this.documentUriMap = new Map();
    }

    /**
     * Initialize the Java LSP adapter
     */
    async initialize() {
        try {
            // Register completion provider
            this.registerCompletionProvider();
            
            // Register hover provider
            this.registerHoverProvider();
            
            // Register definition provider
            this.registerDefinitionProvider();
            
            // Register document formatting provider
            this.registerFormattingProvider();
            
            // Register code action provider
            this.registerCodeActionProvider();
            
            // Register folding range provider
            this.registerFoldingRangeProvider();
            
            // Setup document change listeners
            this.setupDocumentListeners();
            
            // Setup diagnostics callback
            this.setupDiagnostics();
            
            console.log('Java LSP adapter initialized. Connecting to server...');
            
            // Connect to the server
            await this.lspClient.connect();
            
            console.log('Connected to Java LSP server');
            
            // Open the current document
            this.openCurrentDocument();
            
        } catch (error) {
            console.error('Failed to initialize Java LSP adapter:', error);
            throw error;
        }
    }
    
    /**
     * Convert a Monaco position to an LSP position
     */
    monacoPositionToLSP(position) {
        return {
            line: position.lineNumber - 1, // Monaco is 1-based, LSP is 0-based
            character: position.column - 1 // Monaco is 1-based, LSP is 0-based
        };
    }
    
    /**
     * Convert an LSP position to a Monaco position
     */
    lspPositionToMonaco(position) {
        return {
            lineNumber: position.line + 1, // LSP is 0-based, Monaco is 1-based
            column: position.character + 1 // LSP is 0-based, Monaco is 1-based
        };
    }
    
    /**
     * Convert an LSP range to a Monaco range
     */
    lspRangeToMonaco(range) {
        return {
            startLineNumber: range.start.line + 1,
            startColumn: range.start.character + 1,
            endLineNumber: range.end.line + 1,
            endColumn: range.end.character + 1
        };
    }
    
    /**
     * Convert a Monaco URI to an LSP document URI
     */
    monacoUriToLSPUri(uri) {
        if (typeof uri === 'string') {
            return uri;
        }
        return uri.toString();
    }
    
    /**
     * Get the current document version
     */
    getDocumentVersion(uri) {
        if (!this.documentVersions.has(uri)) {
            this.documentVersions.set(uri, 1);
        }
        return this.documentVersions.get(uri);
    }
    
    /**
     * Increment the document version
     */
    incrementDocumentVersion(uri) {
        const version = this.getDocumentVersion(uri) + 1;
        this.documentVersions.set(uri, version);
        return version;
    }
    
    /**
     * Register a completion provider for Java
     */
    registerCompletionProvider() {
        const provider = {
            triggerCharacters: ['.', ':', '<', '"', '=', '/', '@'],
            
            provideCompletionItems: async (model, position) => {
                // If not a Java file, use our built-in provider
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                // Generate a document URI for this model
                const uri = this.monacoUriToLSPUri(model.uri);
                
                try {
                    // Get completion items from LSP server
                    const result = await this.lspClient.completion(
                        uri,
                        this.monacoPositionToLSP(position)
                    );
                    
                    if (!result) {
                        return { suggestions: [] };
                    }
                    
                    // Convert LSP completion items to Monaco suggestions
                    const items = Array.isArray(result) ? result : result.items || [];
                    
                    const suggestions = items.map(item => {
                        let kind = this.monaco.languages.CompletionItemKind.Text;
                        
                        // Map LSP completion item kinds to Monaco kinds
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
                        }
                        
                        // Convert LSP completion item to Monaco suggestion
                        const suggestion = {
                            label: item.label,
                            kind: kind,
                            insertText: item.insertText || item.label,
                            sortText: item.sortText,
                            filterText: item.filterText,
                            detail: item.detail,
                            documentation: item.documentation ? 
                                (typeof item.documentation === 'string' ? 
                                    item.documentation : 
                                    item.documentation.value) : 
                                undefined
                        };
                        
                        // Handle snippet insertion
                        if (item.insertTextFormat === 2) { // 2 = Snippet
                            suggestion.insertTextRules = this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                        }
                        
                        // Handle completion item's textEdit if present
                        if (item.textEdit) {
                            const range = this.lspRangeToMonaco(item.textEdit.range);
                            suggestion.range = range;
                            suggestion.insertText = item.textEdit.newText;
                        }
                        
                        return suggestion;
                    });
                    
                    return { suggestions };
                } catch (error) {
                    console.error('Error getting completions from LSP server:', error);
                    return { suggestions: [] };
                }
            }
        };
        
        // Register the completion provider with Monaco
        this.monaco.languages.registerCompletionItemProvider('java', provider);
    }
    
    /**
     * Register a hover provider for Java
     */
    registerHoverProvider() {
        const provider = {
            provideHover: async (model, position) => {
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                const uri = this.monacoUriToLSPUri(model.uri);
                
                try {
                    const result = await this.lspClient.hover(
                        uri,
                        this.monacoPositionToLSP(position)
                    );
                    
                    if (!result || !result.contents) {
                        return null;
                    }
                    
                    let contents = '';
                    if (typeof result.contents === 'string') {
                        contents = result.contents;
                    } else if (Array.isArray(result.contents)) {
                        contents = result.contents.map(content => {
                            if (typeof content === 'string') {
                                return content;
                            } else {
                                return content.value;
                            }
                        }).join('\n\n');
                    } else if (result.contents.value) {
                        contents = result.contents.value;
                    }
                    
                    const range = result.range ? 
                        this.lspRangeToMonaco(result.range) : 
                        null;
                    
                    return {
                        contents: [{
                            value: contents
                        }],
                        range
                    };
                } catch (error) {
                    console.error('Error getting hover info from LSP server:', error);
                    return null;
                }
            }
        };
        
        this.monaco.languages.registerHoverProvider('java', provider);
    }
    
    /**
     * Register a definition provider for Java
     */
    registerDefinitionProvider() {
        const provider = {
            provideDefinition: async (model, position) => {
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                const uri = this.monacoUriToLSPUri(model.uri);
                
                try {
                    const result = await this.lspClient.definition(
                        uri,
                        this.monacoPositionToLSP(position)
                    );
                    
                    if (!result) {
                        return null;
                    }
                    
                    const locations = Array.isArray(result) ? result : [result];
                    
                    return locations.map(location => {
                        return {
                            uri: this.monaco.Uri.parse(location.uri),
                            range: this.lspRangeToMonaco(location.range)
                        };
                    });
                } catch (error) {
                    console.error('Error getting definition from LSP server:', error);
                    return null;
                }
            }
        };
        
        this.monaco.languages.registerDefinitionProvider('java', provider);
    }
    
    /**
     * Register a formatting provider for Java
     */
    registerFormattingProvider() {
        const provider = {
            provideDocumentFormattingEdits: async (model) => {
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                const uri = this.monacoUriToLSPUri(model.uri);
                
                try {
                    const result = await this.lspClient.formatting(
                        uri,
                        {
                            tabSize: 4,
                            insertSpaces: true
                        }
                    );
                    
                    if (!result) {
                        return null;
                    }
                    
                    return result.map(edit => {
                        return {
                            range: this.lspRangeToMonaco(edit.range),
                            text: edit.newText
                        };
                    });
                } catch (error) {
                    console.error('Error getting formatting edits from LSP server:', error);
                    return null;
                }
            }
        };
        
        this.monaco.languages.registerDocumentFormattingEditProvider('java', provider);
    }
    
    /**
     * Register a code action provider for Java
     */
    registerCodeActionProvider() {
        const provider = {
            provideCodeActions: async (model, range, context) => {
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                const uri = this.monacoUriToLSPUri(model.uri);
                
                // Convert Monaco markers to LSP diagnostics
                const diagnostics = context.markers.map(marker => {
                    return {
                        range: {
                            start: this.monacoPositionToLSP({
                                lineNumber: marker.startLineNumber,
                                column: marker.startColumn
                            }),
                            end: this.monacoPositionToLSP({
                                lineNumber: marker.endLineNumber,
                                column: marker.endColumn
                            })
                        },
                        severity: marker.severity,
                        code: marker.code,
                        source: marker.source,
                        message: marker.message
                    };
                });
                
                try {
                    const result = await this.lspClient.codeAction(
                        uri,
                        {
                            start: this.monacoPositionToLSP({
                                lineNumber: range.startLineNumber,
                                column: range.startColumn
                            }),
                            end: this.monacoPositionToLSP({
                                lineNumber: range.endLineNumber,
                                column: range.endColumn
                            })
                        },
                        diagnostics
                    );
                    
                    if (!result) {
                        return null;
                    }
                    
                    return {
                        actions: result.map(action => {
                            return {
                                title: action.title,
                                kind: action.kind,
                                edit: action.edit,
                                command: action.command
                            };
                        }),
                        dispose: () => {}
                    };
                } catch (error) {
                    console.error('Error getting code actions from LSP server:', error);
                    return null;
                }
            }
        };
        
        this.monaco.languages.registerCodeActionProvider('java', provider);
    }
    
    /**
     * Register a folding range provider for Java
     */
    registerFoldingRangeProvider() {
        const provider = {
            provideFoldingRanges: async (model) => {
                if (model.getLanguageId() !== 'java') {
                    return null;
                }
                
                const uri = this.monacoUriToLSPUri(model.uri);
                
                try {
                    const result = await this.lspClient.foldingRange(uri);
                    
                    if (!result) {
                        return null;
                    }
                    
                    return result.map(range => {
                        let kind = undefined;
                        
                        // Map LSP folding range kinds to Monaco kinds
                        switch (range.kind) {
                            case 'comment': kind = this.monaco.languages.FoldingRangeKind.Comment; break;
                            case 'imports': kind = this.monaco.languages.FoldingRangeKind.Imports; break;
                            case 'region': kind = this.monaco.languages.FoldingRangeKind.Region; break;
                        }
                        
                        return {
                            start: range.startLine + 1,
                            end: range.endLine + 1,
                            kind: kind
                        };
                    });
                } catch (error) {
                    console.error('Error getting folding ranges from LSP server:', error);
                    return null;
                }
            }
        };
        
        this.monaco.languages.registerFoldingRangeProvider('java', provider);
    }
    
    /**
     * Setup document change listeners
     */
    setupDocumentListeners() {
        // Get the current model
        const model = this.editor.getModel();
        
        if (!model) {
            console.warn('No model available for LSP document tracking');
            return;
        }
        
        // Store the model -> URI mapping
        const uri = this.monacoUriToLSPUri(model.uri);
        this.documentUriMap.set(model.uri.toString(), uri);
        
        // Listen for content changes
        this.disposables = [];
        
        // Track content changes
        this.disposables.push(model.onDidChangeContent(event => {
            // Don't send updates if we're not connected
            if (!this.lspClient.isConnected()) {
                return;
            }
            
            const uri = this.documentUriMap.get(model.uri.toString());
            if (!uri) {
                return;
            }
            
            // Increment the document version
            const version = this.incrementDocumentVersion(uri);
            
            // Convert the changes to LSP format
            const changes = event.changes.map(change => {
                const range = {
                    start: this.monacoPositionToLSP({
                        lineNumber: change.range.startLineNumber,
                        column: change.range.startColumn
                    }),
                    end: this.monacoPositionToLSP({
                        lineNumber: change.range.endLineNumber,
                        column: change.range.endColumn
                    })
                };
                
                return {
                    range,
                    text: change.text
                };
            });
            
            // Send the changes to the LSP server
            this.lspClient.textDocumentDidChange(uri, version, changes);
        }));
        
        // Track model disposal
        this.disposables.push(model.onWillDispose(() => {
            const uri = this.documentUriMap.get(model.uri.toString());
            if (uri) {
                this.lspClient.textDocumentDidClose(uri);
                this.documentUriMap.delete(model.uri.toString());
            }
        }));
    }
    
    /**
     * Setup diagnostics callback
     */
    setupDiagnostics() {
        this.lspClient.onDiagnostics(params => {
            const uri = params.uri;
            const diagnostics = params.diagnostics || [];
            
            // Find the Monaco model for this URI
            let model = null;
            this.documentUriMap.forEach((docUri, modelUri) => {
                if (docUri === uri) {
                    model = this.monaco.editor.getModel(this.monaco.Uri.parse(modelUri));
                }
            });
            
            if (!model) {
                return;
            }
            
            // Convert LSP diagnostics to Monaco markers
            const markers = diagnostics.map(diagnostic => {
                const range = this.lspRangeToMonaco(diagnostic.range);
                
                let severity = this.monaco.MarkerSeverity.Info;
                switch (diagnostic.severity) {
                    case 1: severity = this.monaco.MarkerSeverity.Error; break;
                    case 2: severity = this.monaco.MarkerSeverity.Warning; break;
                    case 3: severity = this.monaco.MarkerSeverity.Info; break;
                    case 4: severity = this.monaco.MarkerSeverity.Hint; break;
                }
                
                return {
                    startLineNumber: range.startLineNumber,
                    startColumn: range.startColumn,
                    endLineNumber: range.endLineNumber,
                    endColumn: range.endColumn,
                    message: diagnostic.message,
                    severity: severity,
                    source: diagnostic.source || 'java-lsp'
                };
            });
            
            // Set the markers on the model
            this.monaco.editor.setModelMarkers(model, this.MARKER_OWNER, markers);
        });
    }
    
    /**
     * Open the current document with the LSP server
     */
    openCurrentDocument() {
        const model = this.editor.getModel();
        
        if (!model || model.getLanguageId() !== 'java') {
            return;
        }
        
        const uri = this.monacoUriToLSPUri(model.uri);
        const text = model.getValue();
        const version = this.getDocumentVersion(uri);
        
        this.lspClient.textDocumentDidOpen(uri, 'java', version, text);
    }
    
    /**
     * Dispose of the adapter and clean up resources
     */
    dispose() {
        // Close the connection to the LSP server
        this.lspClient.close();
        
        // Dispose of all disposables
        if (this.disposables) {
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = [];
        }
    }
}

// Export the adapter
if (typeof module !== 'undefined') {
    module.exports = { JavaLSPAdapter };
} else {
    window.JavaLSPAdapter = JavaLSPAdapter;
}
