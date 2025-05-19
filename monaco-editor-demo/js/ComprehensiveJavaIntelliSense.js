/**
 * ComprehensiveJavaIntelliSense.js
 * 
 * The main controller for advanced Java IntelliSense in Monaco Editor
 * Integrates the type system and type inference engine to provide
 * context-aware completions for Java code
 */

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Monaco and other components to load
    setTimeout(initializeComprehensiveJavaIntelliSense, 3000);
});

// Flag to track initialization
let javaIntelliSenseInitialized = false;

/**
 * Initialize the comprehensive Java IntelliSense system
 */
function initializeComprehensiveJavaIntelliSense() {
    if (!monaco || !window.editor) {
        console.error('Monaco or editor not available. Retrying in 1 second...');
        setTimeout(initializeComprehensiveJavaIntelliSense, 1000);
        return;
    }
    
    // Check if required components are loaded
    if (!window.JavaTypeSystem || !window.JavaTypeTracker) {
        console.error('Required Java IntelliSense components not loaded. Retrying in 1 second...');
        setTimeout(initializeComprehensiveJavaIntelliSense, 1000);
        return;
    }
    
    console.log('Initializing Comprehensive Java IntelliSense...');
    
    // Register completion provider for Java with advanced context handling for EVERYTHING
    monaco.languages.registerCompletionItemProvider('java', {
        // Trigger on many more characters for universal autocomplete
        triggerCharacters: ['.', ' ', '(', '{', '[', '<', '@', '"', '\'', '/', '=', ':', ',', ';'],
        provideCompletionItems: function(model, position) {
            // Get current editor content for analysis
            const content = model.getValue();
            
            // Analyze the code to update type information
            if (window.analyzeJavaCode) {
                window.analyzeJavaCode(content);
            }
            
            // Get current line and word information
            const lineContent = model.getLineContent(position.lineNumber);
            const wordUntilPosition = model.getWordUntilPosition(position);
            const wordRange = new monaco.Range(
                position.lineNumber,
                wordUntilPosition.startColumn,
                position.lineNumber,
                wordUntilPosition.endColumn
            );
            
            // Get line content up to cursor position
            const textUntilPosition = lineContent.substring(0, position.column - 1);
            
            // Get trigger character if available
            const triggerCharacter = position.column > 1 ? 
                lineContent.charAt(position.column - 2) : null;
            
            // Create response object with word range for proper replacement
            const response = { suggestions: [] };
            
            // SCENARIO 1: Member access with dot
            if (triggerCharacter === '.') {
                return handleDotCompletion(model, position, lineContent);
            }
            
            // SCENARIO 2: Import statements
            if (textUntilPosition.trim().startsWith('import ')) {
                return handleImportCompletion(model, position, lineContent);
            }
            
            // SCENARIO 3: Class instantiation with "new"
            if (/new\s+$/.test(textUntilPosition) || 
                (wordUntilPosition.word.length > 0 && /new\s+\w+$/.test(textUntilPosition))) {
                return handleNewCompletion(wordRange);
            }
            
            // SCENARIO 4: Package declaration
            if (textUntilPosition.trim().startsWith('package ')) {
                return handlePackageCompletion(wordRange);
            }
            
            // SCENARIO 5: Annotation completion
            if (triggerCharacter === '@' || textUntilPosition.endsWith('@')) {
                return handleAnnotationCompletion(wordRange);
            }
            
            // SCENARIO 6: Exception handling (catch/throws)
            if (/catch\s*\(\s*$/.test(textUntilPosition) || 
                /throws\s+$/.test(textUntilPosition) || 
                /throw\s+new\s+$/.test(textUntilPosition)) {
                return handleExceptionCompletion(wordRange);
            }
            
            // SCENARIO 7: Method parameter completion
            if (isInMethodParams(textUntilPosition)) {
                return handleParameterCompletion(model, position, textUntilPosition, wordRange);
            }
            
            // SCENARIO 8: Class inheritance and implementation
            if (/extends\s+$/.test(textUntilPosition) || 
                /implements\s+$/.test(textUntilPosition)) {
                return handleTypeCompletion(wordRange, true); // true for preferring classes/interfaces
            }
            
            // SCENARIO 9: Variable declarations
            if (isPossibleVariableDeclaration(textUntilPosition)) {
                return handleVariableDeclarationCompletion(model, position, wordRange);
            }
            
            // SCENARIO 10: Method return type
            if (isPossibleMethodReturnType(textUntilPosition)) {
                return handleTypeCompletion(wordRange, false); // false for all types
            }
            
            // SCENARIO 11: Inside JavaDoc comments
            if (isInJavaDocComment(model, position)) {
                return handleJavaDocCompletion(textUntilPosition, wordRange);
            }
            
            // SCENARIO 12: String literals - suggest known strings
            if (isInStringLiteral(lineContent, position.column)) {
                return handleStringLiteralCompletion(wordRange);
            }
            
            // SCENARIO 13: After if, while, switch statements
            if (/if\s*\(\s*$/.test(textUntilPosition) || 
                /while\s*\(\s*$/.test(textUntilPosition) || 
                /switch\s*\(\s*$/.test(textUntilPosition)) {
                return handleConditionCompletion(model, position, wordRange);
            }
            
            // Fallback: Default completions (keywords, types, variables, etc.)
            const defaultSuggestions = handleDefaultCompletions();
            defaultSuggestions.suggestions.forEach(suggestion => {
                suggestion.range = wordRange;
                response.suggestions.push(suggestion);
            });
            
            return response;
        }
    });
    
    // Listen for content changes to keep type information up to date
    window.editor.onDidChangeModelContent(e => {
        const model = window.editor.getModel();
        if (model && model.getLanguageId() === 'java') {
            // Analyze on debounce (not every keystroke)
            clearTimeout(window.javaAnalysisTimeout);
            window.javaAnalysisTimeout = setTimeout(() => {
                if (window.analyzeJavaCode) {
                    window.analyzeJavaCode(model.getValue());
                }
            }, 500);
        }
    });
    
    // Initial analysis of current content
    const model = window.editor.getModel();
    if (model && model.getLanguageId() === 'java' && window.analyzeJavaCode) {
        window.analyzeJavaCode(model.getValue());
    }
    
    javaIntelliSenseInitialized = true;
    console.log('Comprehensive Java IntelliSense initialized successfully!');
    
    // Show notification
    showIntelliSenseNotification();
}

/**
 * Handle completion after typing a dot
 */
function handleDotCompletion(model, position, lineContent) {
    // Extract the text before the dot to determine context
    const expressionBeforeDot = getExpressionBeforeDot(lineContent, position.column - 2);
    console.log('Expression before dot:', expressionBeforeDot);
    
    if (!expressionBeforeDot) {
        return { suggestions: [] };
    }
    
    // Handle special cases
    if (expressionBeforeDot === 'System') {
        return createCompletionItemsForType('java.lang.System');
    } else if (expressionBeforeDot === 'System.out') {
        return createCompletionItemsForType('java.io.PrintStream');
    } else if (expressionBeforeDot === 'Math') {
        return createCompletionItemsForType('java.lang.Math');
    }
    
    // Try to infer the type of the expression
    let expressionType = null;
    if (window.inferExpressionType) {
        expressionType = window.inferExpressionType(expressionBeforeDot);
    }
    
    if (expressionType) {
        console.log('Inferred type:', expressionType);
        return createCompletionItemsForType(expressionType, expressionBeforeDot);
    }
    
    return { suggestions: [] };
}

/**
 * Extract the expression before a dot
 */
function getExpressionBeforeDot(lineText, dotIndex) {
    let start = dotIndex - 1;
    let depth = 0; // Track nested parentheses
    
    // Go backward from the dot to find the start of the expression
    while (start >= 0) {
        const char = lineText.charAt(start);
        
        // Handle nested parentheses
        if (char === ')') depth++;
        else if (char === '(') {
            depth--;
            if (depth < 0) break; // Unmatched parenthesis
        }
        // Break on separators when not inside parentheses
        else if (depth === 0 && /[^\w$.]/.test(char)) {
            break;
        }
        
        start--;
    }
    
    return lineText.substring(start + 1, dotIndex).trim();
}

/**
 * Create completion items for a specific Java type
 */
function createCompletionItemsForType(typeName, variableName) {
    const suggestions = [];
    
    // Get completions for this type, considering generics if applicable
    let completions = [];
    if (window.getCompletionsForTypeWithGenerics) {
        completions = window.getCompletionsForTypeWithGenerics(typeName, variableName);
    } else if (window.getAllMethodsForType && window.getAllFieldsForType) {
        // Fallback to non-generic completions
        const methods = window.getAllMethodsForType(typeName);
        const fields = window.getAllFieldsForType(typeName);
        completions = [...methods, ...fields];
    }
    
    // Process completions into suggestions
    completions.forEach(item => {
        if (item.name && item.name.indexOf('(') !== -1) {
            // It's a method
            suggestions.push(createMethodSuggestion(item));
        } else {
            // It's a field
            suggestions.push(createFieldSuggestion(item));
        }
    });
    
    return { suggestions };
}

/**
 * Create a method suggestion item
 */
function createMethodSuggestion(method) {
    // Extract the method name (without parameters)
    const openParenIndex = method.name.indexOf('(');
    const methodName = method.name.substring(0, openParenIndex);
    
    return {
        label: {
            label: method.name,
            description: method.returnType
        },
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: createMethodSnippet(method.name),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
            value: `**${method.returnType} ${method.name}**\n\n${method.description || ''}`
        },
        detail: `${method.returnType} - ${method.description || ''}`,
        sortText: '0' + methodName  // Methods appear first
    };
}

/**
 * Create a field suggestion item
 */
function createFieldSuggestion(field) {
    return {
        label: {
            label: field.name,
            description: field.type
        },
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: field.name,
        documentation: {
            value: `**${field.type} ${field.name}**\n\n${field.description || ''}`
        },
        detail: `${field.type} - ${field.description || ''}`,
        sortText: '1' + field.name  // Fields appear after methods
    };
}

/**
 * Create snippet for method parameters
 */
function createMethodSnippet(methodName) {
    const openParenIndex = methodName.indexOf('(');
    const closeParenIndex = methodName.lastIndexOf(')');
    
    if (openParenIndex === -1 || closeParenIndex === -1) {
        return methodName;
    }
    
    const methodBaseName = methodName.substring(0, openParenIndex);
    const paramsText = methodName.substring(openParenIndex + 1, closeParenIndex);
    
    // If no parameters, just return method name with empty parens
    if (!paramsText.trim()) {
        return `${methodBaseName}()`;
    }
    
    // Create snippet with tab stops for each parameter
    const params = paramsText.split(',');
    let snippet = `${methodBaseName}(`;
    
    params.forEach((param, index) => {
        // Extract parameter name
        const paramParts = param.trim().split(' ');
        const paramName = paramParts.length > 1 ? paramParts[paramParts.length - 1] : `param${index + 1}`;
        
        if (index > 0) {
            snippet += ', ';
        }
        snippet += `\${${index + 1}:${paramName}}`;
    });
    
    snippet += ')';
    return snippet;
}

/**
 * Handle import statement completions
 */
function handleImportCompletion(model, position, lineContent) {
    const importText = lineContent.substring('import '.length, position.column - 1).trim();
    const suggestions = [];
    
    // Use the package hierarchy from the JavaTypeSystem
    if (window.JavaTypeSystem && window.JavaTypeSystem.packageHierarchy) {
        const packages = window.JavaTypeSystem.packageHierarchy;
        
        // Filter based on what's been typed
        const filteredPackages = packages.filter(pkg => 
            pkg.name.toLowerCase().startsWith(importText.toLowerCase()));
        
        // Create suggestions
        filteredPackages.forEach(pkg => {
            suggestions.push({
                label: {
                    label: pkg.name,
                    description: '(package)'
                },
                kind: monaco.languages.CompletionItemKind.Module,
                insertText: pkg.name,
                documentation: {
                    value: `**${pkg.name}**\n\n${pkg.description || 'Java package'}`
                },
                detail: pkg.description || 'Java package',
                sortText: '0' + pkg.name
            });
        });
    }
    
    return { suggestions };
}

/**
 * Handle "new" statement completions
 */
function handleNewCompletion() {
    const suggestions = [];
    
    // Collect all concrete class types from the type system
    if (window.JavaTypeSystem) {
        // Add java.lang classes
        Object.keys(window.JavaTypeSystem.java.lang).forEach(className => {
            // Skip interfaces and abstract classes
            const typeInfo = window.JavaTypeSystem.java.lang[className];
            if (!typeInfo.isInterface && !typeInfo.isAbstract) {
                suggestions.push({
                    label: className,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: className + '(${0})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: `java.lang.${className}`,
                    sortText: '0' + className
                });
            }
        });
        
        // Add java.util classes
        if (window.JavaTypeSystem.java.util) {
            Object.keys(window.JavaTypeSystem.java.util).forEach(className => {
                const typeInfo = window.JavaTypeSystem.java.util[className];
                if (!typeInfo.isInterface && !typeInfo.isAbstract) {
                    // Handle generic classes
                    let insertText = className;
                    if (typeInfo.genericType) {
                        if (className.includes('<')) {
                            // Extract base name from generic type
                            insertText = className.substring(0, className.indexOf('<'));
                            insertText += '<${1:Object}>';
                        }
                    }
                    
                    suggestions.push({
                        label: className,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: insertText + '(${0})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `java.util.${className}`,
                        sortText: '1' + className
                    });
                }
            });
        }
        
        // Add java.io classes
        if (window.JavaTypeSystem.java.io) {
            Object.keys(window.JavaTypeSystem.java.io).forEach(className => {
                const typeInfo = window.JavaTypeSystem.java.io[className];
                if (!typeInfo.isInterface && !typeInfo.isAbstract) {
                    suggestions.push({
                        label: className,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: className + '(${0})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `java.io.${className}`,
                        sortText: '2' + className
                    });
                }
            });
        }
    }
    
    return { suggestions };
}

/**
 * Handle default completions (keywords, types, etc.)
 */
function handleDefaultCompletions() {
    const suggestions = [];
    
    // Java keywords
    const keywords = [
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 
        'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 
        'finally', 'float', 'for', 'if', 'implements', 'import', 'instanceof', 'int', 
        'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 
        'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 
        'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
    ];
    
    // Add keyword suggestions
    keywords.forEach(keyword => {
        suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: 'Java keyword'
        });
    });
    
    // Add common class suggestions
    const commonClasses = [
        'String', 'Integer', 'Boolean', 'Double', 'Float', 'Character', 'Object', 'System',
        'Math', 'Exception', 'RuntimeException', 'ArrayList', 'HashMap', 'List', 'Map', 'Set'
    ];
    
    commonClasses.forEach(className => {
        suggestions.push({
            label: className,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: className,
            detail: 'Java class'
        });
    });
    
    // Add code snippets
    suggestions.push({
        label: 'sysout',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'System.out.println(${1});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Print to console',
        documentation: 'System.out.println();'
    });
    
    suggestions.push({
        label: 'psvm',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'public static void main(String[] args) {',
            '\t${0}',
            '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Public static void main',
        documentation: 'Create a main method'
    });
    
    suggestions.push({
        label: 'fori',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {',
            '\t${0}',
            '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'For loop with index',
        documentation: 'Create a for loop with index'
    });
    
    return { suggestions };
}

/**
 * Show notification when the IntelliSense system is ready
 */
function showIntelliSenseNotification() {
    // Check if we have the notification function from JavaFeaturesDiagnostics
    if (typeof showNotification === 'function') {
        showNotification('Comprehensive Java IntelliSense Activated');
        return;
    }
    
    // Create our own notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4285f4';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '10000';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = 'bold';
    notification.style.transition = 'opacity 0.5s';
    notification.textContent = '✨ Comprehensive Java IntelliSense Ready ✨';
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}
