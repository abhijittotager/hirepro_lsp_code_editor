/**
 * EnhancedJavaCompletion - Adds advanced IntelliSense features for Java in Monaco Editor
 * This extends the capabilities of the basic JavaLSPConnector with VS Code-quality features
 */

// Enhanced completion features for Java in Monaco
class EnhancedJavaCompletion {
    /**
     * Initialize with the JavaLSPConnector instance and Monaco
     * @param {Object} javaLSPConnector - Instance of JavaLSPConnector 
     * @param {Object} monaco - Monaco editor namespace
     * @param {Object} editor - Monaco editor instance
     */
    constructor(javaLSPConnector, monaco, editor) {
        this.javaLSPConnector = javaLSPConnector;
        this.monaco = monaco;
        this.editor = editor;
        this.disposables = [];
        this.initialized = false;
        
        // Context tracking
        this.importedClasses = new Set();
        this.declaredVariables = new Map(); // Map of variable names to types
        this.methodReturnTypes = new Map(); // Map of method names to return types
        this.currentPackage = "";
    }
    
    /**
     * Initialize the enhanced completion features
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Enhanced Java Completion');
        
        // Register a more advanced completion provider
        this.registerCompletionProvider();
        
        // Track Java context changes
        this.trackDocumentChanges();
        
        // Add additional semantic token provider 
        this.registerSemanticTokenProvider();
        
        // Add code lens for method references
        this.registerCodeLensProvider();
        
        this.initialized = true;
    }
    
    /**
     * Register enhanced completion provider for Java
     */
    registerCompletionProvider() {
        const disposable = this.monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters: ['.', '@', '(', ',', ' ', '\n'],
            
            provideCompletionItems: async (model, position) => {
                // Use the original LSP connector for base completions
                // but enhance the results with additional context
                try {
                    // Parse code context
                    const context = this.analyzeCodeContext(model, position);
                    
                    // Get completions from the original LSP connector
                    const baseCompletions = await this.getBaseCompletions(model, position);
                    
                    // Enhance the completions with context data
                    const enhancedCompletions = this.enhanceCompletions(baseCompletions, context);
                    
                    return {
                        suggestions: enhancedCompletions,
                        incomplete: baseCompletions.incomplete
                    };
                } catch (error) {
                    console.error('Error in enhanced completion provider:', error);
                    
                    // Fall back to original
                    return this.javaLSPConnector.sendRequest('textDocument/completion', {
                        textDocument: { uri: model.uri.toString() },
                        position: { 
                            line: position.lineNumber - 1, 
                            character: position.column - 1 
                        }
                    }).then(result => {
                        if (!result) return { suggestions: [] };
                        
                        const items = result.items || result;
                        
                        return {
                            suggestions: items.map(item => this.javaLSPConnector.convertCompletionItem(item, position))
                        };
                    }).catch(() => ({ suggestions: [] }));
                }
            }
        });
        
        this.disposables.push(disposable);
    }
    
    /**
     * Analyze the code context around the cursor
     * @param {Object} model - Monaco model
     * @param {Object} position - Cursor position
     * @returns {Object} Code context information
     */
    analyzeCodeContext(model, position) {
        const fullText = model.getValue();
        const lineContent = model.getLineContent(position.lineNumber);
        const wordUntil = model.getWordUntilPosition(position);
        
        // Extract imports
        const imports = [];
        const importRegex = /import\s+([\w.]+)(?:\s+as\s+(\w+))?;/g;
        let match;
        while ((match = importRegex.exec(fullText)) !== null) {
            imports.push({
                fullPath: match[1],
                alias: match[2] || match[1].split('.').pop(),
                shortName: match[1].split('.').pop()
            });
        }
        
        // Find current package
        const packageMatch = fullText.match(/package\s+([\w.]+);/);
        const currentPackage = packageMatch ? packageMatch[1] : "";
        
        // Detect if inside a method call
        const beforeCursor = lineContent.substring(0, position.column - 1);
        const methodCallMatch = beforeCursor.match(/([\w_$]+)\s*\([^)]*$/);
        const isInMethodCall = !!methodCallMatch;
        const currentMethodName = methodCallMatch ? methodCallMatch[1] : "";
        
        // Detect if after a declaration
        const declarationMatch = beforeCursor.match(/\b([\w<>[\],\s]+)\s+(\w+)\s*(?:=|;)/);
        const isAfterDeclaration = !!declarationMatch;
        const declaredType = declarationMatch ? declarationMatch[1].trim() : "";
        
        // Determine completion context type
        let contextType = "default";
        if (beforeCursor.endsWith(".")) {
            contextType = "member";
        } else if (isInMethodCall) {
            contextType = "parameter";
        } else if (lineContent.trim().startsWith("import ")) {
            contextType = "import";
        } else if (beforeCursor.includes(" new ")) {
            contextType = "constructor";
        } else if (beforeCursor.includes("@")) {
            contextType = "annotation";
        }
        
        return {
            lineContent,
            wordUntil,
            imports,
            currentPackage,
            isInMethodCall,
            currentMethodName,
            isAfterDeclaration,
            declaredType,
            contextType,
            fullText,
            position
        };
    }
    
    /**
     * Get base completions from the language server
     * @param {Object} model - Monaco model
     * @param {Object} position - Cursor position
     * @returns {Promise<Object>} Completion results
     */
    async getBaseCompletions(model, position) {
        const result = await this.javaLSPConnector.sendRequest('textDocument/completion', {
            textDocument: { uri: model.uri.toString() },
            position: { 
                line: position.lineNumber - 1, 
                character: position.column - 1 
            },
            context: {
                triggerKind: 1, // Invoked by user
                triggerCharacter: model.getLineContent(position.lineNumber)[position.column - 2]
            }
        });
        
        if (!result) return { suggestions: [], incomplete: false };
        
        const items = result.items || result;
        const wordUntil = model.getWordUntilPosition(position);
        const defaultRange = {
            startLineNumber: position.lineNumber,
            startColumn: wordUntil.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: wordUntil.endColumn
        };
        
        return {
            suggestions: items.map(item => this.javaLSPConnector.convertCompletionItem(item, position, defaultRange)),
            incomplete: result.isIncomplete === true
        };
    }
    
    /**
     * Enhance base completions with context data
     * @param {Object} baseCompletions - Base completions
     * @param {Object} context - Code context
     * @returns {Array} Enhanced completion suggestions
     */
    enhanceCompletions(baseCompletions, context) {
        // Start with the base suggestions
        let suggestions = [...baseCompletions.suggestions];
        
        // Add context-specific enhancements
        switch (context.contextType) {
            case "member":
                // For member access (after a dot), prioritize methods/properties
                suggestions = this.prioritizeMemberSuggestions(suggestions, context);
                break;
                
            case "parameter":
                // For method parameters, show compatible types
                suggestions = this.enhanceParameterSuggestions(suggestions, context);
                break;
                
            case "import":
                // For imports, add common package suggestions
                suggestions = this.enhanceImportSuggestions(suggestions, context);
                break;
                
            case "constructor":
                // For constructor calls, prioritize constructors
                suggestions = this.prioritizeConstructorSuggestions(suggestions, context);
                break;
                
            case "annotation":
                // For annotations, show only annotation types
                suggestions = this.filterAnnotationSuggestions(suggestions, context);
                break;
        }
        
        // Add code snippets based on context
        const snippets = this.getContextualSnippets(context);
        suggestions = [...suggestions, ...snippets];
        
        return suggestions;
    }
    
    /**
     * Prioritize member suggestions
     * @param {Array} suggestions - Original suggestions
     * @param {Object} context - Code context
     * @returns {Array} Prioritized suggestions
     */
    prioritizeMemberSuggestions(suggestions, context) {
        // Identify what object we're accessing members of
        const beforeDot = context.lineContent.substring(0, context.position.column - 2).trim();
        const lastWord = beforeDot.split(/\s+/).pop();
        
        // Sort suggestions with known methods for this object first
        return suggestions.sort((a, b) => {
            // Methods and properties first
            if (a.kind === this.monaco.languages.CompletionItemKind.Method && 
                b.kind !== this.monaco.languages.CompletionItemKind.Method) {
                return -1;
            }
            if (a.kind !== this.monaco.languages.CompletionItemKind.Method && 
                b.kind === this.monaco.languages.CompletionItemKind.Method) {
                return 1;
            }
            
            // Then by relevance score if present
            if (a.sortText && b.sortText) {
                return a.sortText.localeCompare(b.sortText);
            }
            
            return 0;
        });
    }
    
    /**
     * Enhance parameter suggestions
     * @param {Array} suggestions - Original suggestions
     * @param {Object} context - Code context 
     * @returns {Array} Enhanced suggestions
     */
    enhanceParameterSuggestions(suggestions, context) {
        // Boost compatible variable suggestions
        return suggestions.map(suggestion => {
            // Prioritize variables that match the expected parameter type
            if (suggestion.kind === this.monaco.languages.CompletionItemKind.Variable) {
                suggestion.sortText = '0' + (suggestion.sortText || suggestion.label);
            }
            return suggestion;
        });
    }
    
    /**
     * Enhance import suggestions
     * @param {Array} suggestions - Original suggestions 
     * @param {Object} context - Code context
     * @returns {Array} Enhanced suggestions
     */
    enhanceImportSuggestions(suggestions, context) {
        // Add common Java packages if we're at the beginning of an import
        const importText = context.lineContent.trim();
        if (importText === 'import' || importText === 'import ') {
            const commonPackages = [
                'java.util.', 'java.io.', 'java.lang.', 'java.net.', 
                'java.time.', 'java.sql.', 'java.math.', 'java.nio.'
            ];
            
            commonPackages.forEach(pkg => {
                suggestions.push({
                    label: pkg,
                    kind: this.monaco.languages.CompletionItemKind.Module,
                    insertText: pkg,
                    detail: 'Common Java package',
                    sortText: '0' + pkg // Prioritize
                });
            });
        }
        
        return suggestions;
    }
    
    /**
     * Prioritize constructor suggestions
     * @param {Array} suggestions - Original suggestions
     * @param {Object} context - Code context
     * @returns {Array} Prioritized suggestions
     */
    prioritizeConstructorSuggestions(suggestions, context) {
        // Boost constructor suggestions
        return suggestions.map(suggestion => {
            if (suggestion.kind === this.monaco.languages.CompletionItemKind.Constructor ||
                suggestion.label.includes('new ')) {
                suggestion.sortText = '0' + (suggestion.sortText || suggestion.label);
            }
            return suggestion;
        });
    }
    
    /**
     * Filter to show only annotation suggestions
     * @param {Array} suggestions - Original suggestions
     * @param {Object} context - Code context
     * @returns {Array} Filtered suggestions
     */
    filterAnnotationSuggestions(suggestions, context) {
        // Only keep annotation types
        return suggestions.filter(suggestion => 
            suggestion.kind === this.monaco.languages.CompletionItemKind.Interface ||
            suggestion.detail?.includes('annotation') ||
            suggestion.label.startsWith('@')
        );
    }
    
    /**
     * Get contextual code snippets
     * @param {Object} context - Code context
     * @returns {Array} Code snippets as suggestions
     */
    getContextualSnippets(context) {
        const snippets = [];
        
        // Empty Java class
        if (context.fullText.trim() === '') {
            snippets.push({
                label: 'class',
                kind: this.monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                    'public class ${1:ClassName} {',
                    '\t${0}',
                    '}'
                ].join('\n'),
                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'New Java class',
                documentation: 'Creates a new Java class'
            });
        }
        
        // Method snippet in class body
        const isInClassBody = /class\s+\w+\s*\{[^}]*/.test(context.fullText.substring(0, context.position.lineNumber));
        if (isInClassBody && context.lineContent.trim() === '') {
            snippets.push({
                label: 'method',
                kind: this.monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                    'public ${1:void} ${2:methodName}(${3:params}) {',
                    '\t${0}',
                    '}'
                ].join('\n'),
                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'New method',
                documentation: 'Creates a new method'
            });
        }
        
        // Main method snippet
        if (isInClassBody && context.lineContent.trim() === '') {
            snippets.push({
                label: 'main',
                kind: this.monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                    'public static void main(String[] args) {',
                    '\t${0}',
                    '}'
                ].join('\n'),
                insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: 'Main method',
                documentation: 'Creates a main method'
            });
        }
        
        // System.out.println snippet
        snippets.push({
            label: 'sysout',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: 'System.out.println(${0});',
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'System.out.println',
            documentation: 'Print to standard output'
        });
        
        return snippets;
    }
    
    /**
     * Track document changes to build context
     */
    trackDocumentChanges() {
        const disposable = this.editor.onDidChangeModelContent(e => {
            const model = this.editor.getModel();
            if (!model) return;
            
            // Parse imports
            const text = model.getValue();
            const importRegex = /import\s+([\w.]+)(?:\s+as\s+(\w+))?;/g;
            this.importedClasses.clear();
            
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                const fullImport = match[1];
                const className = fullImport.split('.').pop();
                this.importedClasses.add(className);
            }
            
            // Simplified variable tracking
            // In a real implementation, this would need more complex parsing
            const variableRegex = /\b([\w<>[\],\s]+)\s+(\w+)\s*(?:=|;)/g;
            this.declaredVariables.clear();
            
            while ((match = variableRegex.exec(text)) !== null) {
                const type = match[1].trim();
                const name = match[2];
                this.declaredVariables.set(name, type);
            }
            
            // Package detection
            const packageMatch = text.match(/package\s+([\w.]+);/);
            this.currentPackage = packageMatch ? packageMatch[1] : "";
        });
        
        this.disposables.push(disposable);
    }
    
    /**
     * Register a semantic token provider for better syntax highlighting
     */
    registerSemanticTokenProvider() {
        // This is a simplified version
        // In a real implementation, it would do more sophisticated analysis
        const disposable = this.monaco.languages.registerDocumentSemanticTokensProvider('java', {
            getLegend: () => ({
                tokenTypes: [
                    'class', 'interface', 'enum', 'typeParameter', 
                    'parameter', 'variable', 'property', 'method',
                    'function', 'keyword', 'comment', 'string', 'number',
                    'regexp', 'operator'
                ],
                tokenModifiers: [
                    'declaration', 'definition', 'readonly', 'static',
                    'abstract', 'deprecated', 'modification', 'async',
                    'documentation'
                ]
            }),
            
            provideDocumentSemanticTokens: (model, lastResultId, token) => {
                // In a full implementation, this would parse the Java code
                // and return detailed semantic tokens
                return {
                    data: new Uint32Array(0),
                    resultId: lastResultId
                };
            },
            
            releaseDocumentSemanticTokens: (resultId) => {}
        });
        
        this.disposables.push(disposable);
    }
    
    /**
     * Register a code lens provider for method references
     */
    registerCodeLensProvider() {
        const disposable = this.monaco.languages.registerCodeLensProvider('java', {
            provideCodeLenses: (model, token) => {
                // This would normally use the language server to get references
                // Simplified version for demo
                return { lenses: [], dispose: () => {} };
            },
            
            resolveCodeLens: (model, codeLens, token) => {
                return codeLens;
            }
        });
        
        this.disposables.push(disposable);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.initialized = false;
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Will be initialized later when JavaLSPConnector is ready
    window.enhancedJavaCompletion = null;
    
    // Wait for editor and connector to be ready
    const initInterval = setInterval(() => {
        if (window.editor && window.javaLSPConnector && window.monaco) {
            window.enhancedJavaCompletion = new EnhancedJavaCompletion(
                window.javaLSPConnector,
                window.monaco,
                window.editor
            );
            window.enhancedJavaCompletion.initialize();
            clearInterval(initInterval);
            console.log('Enhanced Java Completion initialized');
        }
    }, 500);
});
