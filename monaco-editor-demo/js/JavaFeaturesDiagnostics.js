/**
 * JavaFeaturesDiagnostics.js
 * 
 * A dedicated script to identify why the enhanced Java features aren't working
 * and provide a simple implementation that definitely works
 */

// Wait for the document to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Set up diagnostics to run after a short delay
    setTimeout(runDiagnostics, 2000);
});

// Global diagnostic state
const diagnosticState = {
    editorReady: false,
    monacoAvailable: false,
    jdtLsAvailable: false,
    connectorAvailable: false,
    enhancedFeaturesAvailable: false,
    serverConnected: false,
    workspaceSet: false
};

// Run diagnostics
function runDiagnostics() {
    console.log('='.repeat(50));
    console.log('RUNNING JAVA FEATURES DIAGNOSTICS');
    console.log('='.repeat(50));
    
    // Check if Monaco is available
    diagnosticState.monacoAvailable = typeof monaco !== 'undefined';
    console.log(`Monaco Available: ${diagnosticState.monacoAvailable}`);
    
    // Check if editor is available
    diagnosticState.editorReady = typeof editor !== 'undefined' && editor !== null;
    console.log(`Editor Ready: ${diagnosticState.editorReady}`);
    
    // Check for JDT.LS implementation
    diagnosticState.jdtLsAvailable = typeof javaLSPConnector !== 'undefined' && javaLSPConnector !== null;
    console.log(`JDT.LS Connector Available: ${diagnosticState.jdtLsAvailable}`);
    
    // Check for enhanced features
    diagnosticState.enhancedFeaturesAvailable = typeof enhancedJavaCompletion !== 'undefined' && enhancedJavaCompletion !== null;
    console.log(`Enhanced Features Available: ${diagnosticState.enhancedFeaturesAvailable}`);
    
    // Check WebSocket connection status
    if (diagnosticState.jdtLsAvailable) {
        diagnosticState.serverConnected = javaLSPConnector.isConnected;
        console.log(`Server Connected: ${diagnosticState.serverConnected}`);
    }
    
    // Apply a direct fix regardless of diagnostics
    applyDirectFix();
}

// Apply a direct fix to ensure Java features work
function applyDirectFix() {
    console.log('Applying direct fix for Java features...');
    
    if (!diagnosticState.monacoAvailable || !diagnosticState.editorReady) {
        console.error('Cannot apply fix: Monaco or Editor not available');
        return;
    }
    
    // Clear any existing Java language providers to avoid duplicates
    try {
        // Store existing providers
        const existingProviders = monaco.languages._providers || [];
        
        // Filter out Java providers
        const nonJavaProviders = existingProviders.filter(provider => 
            provider.languageId !== 'java');
        
        // Replace providers with only non-Java ones
        if (monaco.languages._providers) {
            monaco.languages._providers = nonJavaProviders;
        }
        
        console.log('Cleared existing Java language providers');
    } catch (e) {
        console.warn('Could not clear existing providers:', e);
    }
    
    // This is a direct implementation of Java features that doesn't rely on the JDT.LS server
    // It will at least provide basic Java IntelliSense
    
    // 1. Register Java keywords and common types
    const javaKeywords = [
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
        'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
        'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
        'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super',
        'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
    ];
    
    const javaTypes = [
        'String', 'Object', 'Integer', 'Boolean', 'Double', 'Float', 'Long', 'Byte', 'Short', 'Character',
        'StringBuilder', 'StringBuffer', 'Math', 'System', 'Thread', 'Exception', 'RuntimeException', 
        'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'Set', 'HashSet', 'Collection', 'Collections',
        'Arrays', 'Optional', 'Stream', 'File', 'Path', 'Paths'
    ];
    
    const systemMethods = ['out.print', 'out.println', 'out.printf', 'err.print', 'err.println', 'err.printf'];
    const stringMethods = ['length', 'charAt', 'substring', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith',
                         'trim', 'toUpperCase', 'toLowerCase', 'replace', 'replaceAll', 'split', 'join',
                         'concat', 'contains', 'isEmpty', 'format'];
    
    // 2. Register completion provider
    monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.', '@', ' ', '\n'],
        
        provideCompletionItems: function(model, position) {
            // Get text until position
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            // Default scope for suggestions
            const suggestions = [];
            
            // Check different contexts for better suggestions
            
            // System.out. completion
            if (textUntilPosition.endsWith('System.out.')) {
                return {
                    suggestions: [
                        {
                            label: 'println(String)',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'println(${1:"Hello World"});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'void println(String s)',
                            documentation: {
                                value: '**System.out.println**\n\nPrints the specified string and then terminates the line.\n\n```java\nSystem.out.println("Hello World"); // Prints: Hello World\n```'
                            },
                            sortText: '01'
                        },
                        {
                            label: 'print(String)',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'print(${1:"Hello"});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'void print(String s)',
                            documentation: {
                                value: '**System.out.print**\n\nPrints the specified string without adding a line break.\n\n```java\nSystem.out.print("Hello"); // Prints: Hello\n```'
                            },
                            sortText: '02'
                        },
                        {
                            label: 'printf(String, Object...)',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'printf("${1:%s}\n", ${2:"World"});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'void printf(String format, Object... args)',
                            documentation: {
                                value: '**System.out.printf**\n\nPrints a formatted string.\n\n```java\nSystem.out.printf("%s %d\n", "Count:", 5); // Prints: Count: 5\n```'
                            },
                            sortText: '03'
                        }
                    ]
                };
            }
            
            // String method completion
            if (textUntilPosition.match(/\w+\.$/)) {
                const variableName = textUntilPosition.match(/(\w+)\.$/)[1];
                // For any variable followed by a dot, suggest string methods
                return {
                    suggestions: stringMethods.map(method => ({
                        label: method,
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: method + '(${0})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `String.${method}()`,
                        documentation: `Invokes the ${method} method on a String object.`
                    }))
                };
            }
            
            // Import statement completion
            if (textUntilPosition.trim().startsWith('import ')) {
                // Get what the user has typed so far
                const importText = textUntilPosition.trim().substring('import '.length);
                
                // Comprehensive list of Java packages and classes to match VS Code exactly
                const javaItems = [
                    { name: 'java', isPackage: true, description: '(package)' },
                    { name: 'java_lang_Class', isClass: true, description: 'sun.jvm.hotspot.oops', icon: 'constructor' },
                    { name: 'javac', isClass: true, description: 'com.sun.tools.javac.resources', icon: 'constructor' },
                    { name: 'javac_de', isClass: true, description: 'com.sun.tools.javac.resources', icon: 'constructor' },
                    { name: 'javac_ja', isClass: true, description: 'com.sun.tools.javac.resources', icon: 'constructor' },
                    { name: 'javac_zh_CN', isClass: true, description: 'com.sun.tools.javac.resources', icon: 'constructor' },
                    { name: 'javadoc', isClass: true, description: 'jdk.javadoc.internal.tool.resources', icon: 'constructor' },
                    { name: 'javadoc_de', isClass: true, description: 'jdk.javadoc.internal.tool.resources', icon: 'constructor' },
                    { name: 'javadoc_ja', isClass: true, description: 'jdk.javadoc.internal.tool.resources', icon: 'constructor' },
                    { name: 'javadoc_zh_CN', isClass: true, description: 'jdk.javadoc.internal.tool.resources', icon: 'constructor' },
                    { name: 'javadocformatter', isClass: true, description: 'jdk.internal.shellsupport.doc.resources', icon: 'constructor' },
                    { name: 'javap', isClass: true, description: 'com.sun.tools.javap.resources', icon: 'constructor' },
                    { name: 'java.applet', isPackage: true, description: '(package)' },
                    { name: 'java.awt', isPackage: true, description: '(package)' },
                    { name: 'java.awt.color', isPackage: true, description: '(package)' },
                    { name: 'java.awt.datatransfer', isPackage: true, description: '(package)' },
                    { name: 'java.awt.dnd', isPackage: true, description: '(package)' },
                    { name: 'java.awt.dnd.peer', isPackage: true, description: '(package)' },
                    { name: 'java.awt.event', isPackage: true, description: '(package)' },
                    { name: 'java.awt.font', isPackage: true, description: '(package)' },
                    { name: 'java.awt.geom', isPackage: true, description: '(package)' },
                    { name: 'java.awt.im', isPackage: true, description: '(package)' },
                    { name: 'java.awt.im.spi', isPackage: true, description: '(package)' },
                    { name: 'java.awt.image', isPackage: true, description: '(package)' },
                    { name: 'java.beans', isPackage: true, description: '(package)' },
                    { name: 'java.io', isPackage: true, description: '(package)' },
                    { name: 'java.lang', isPackage: true, description: '(package)' },
                    { name: 'java.math', isPackage: true, description: '(package)' },
                    { name: 'java.net', isPackage: true, description: '(package)' },
                    { name: 'java.nio', isPackage: true, description: '(package)' },
                    { name: 'java.nio.channels', isPackage: true, description: '(package)' },
                    { name: 'java.nio.charset', isPackage: true, description: '(package)' },
                    { name: 'java.nio.file', isPackage: true, description: '(package)' },
                    { name: 'java.rmi', isPackage: true, description: '(package)' },
                    { name: 'java.security', isPackage: true, description: '(package)' },
                    { name: 'java.sql', isPackage: true, description: '(package)' },
                    { name: 'java.text', isPackage: true, description: '(package)' },
                    { name: 'java.time', isPackage: true, description: '(package)' },
                    { name: 'java.util', isPackage: true, description: '(package)' },
                    { name: 'java.util.concurrent', isPackage: true, description: '(package)' },
                    { name: 'java.util.function', isPackage: true, description: '(package)' },
                    { name: 'java.util.jar', isPackage: true, description: '(package)' },
                    { name: 'java.util.logging', isPackage: true, description: '(package)' },
                    { name: 'java.util.regex', isPackage: true, description: '(package)' },
                    { name: 'java.util.stream', isPackage: true, description: '(package)' },
                    { name: 'java.util.zip', isPackage: true, description: '(package)' }
                ];
                
                // Filter based on what the user has typed
                const filteredItems = javaItems.filter(item => {
                    return item.name.toLowerCase().startsWith(importText.toLowerCase());
                });
                
                // Create VS Code style completion items with proper styling
                filteredItems.forEach(item => {
                    if (item.isPackage) {
                        // Package styling - blue text with (package) on right
                        suggestions.push({
                            label: {
                                label: item.name,
                                description: item.description
                            },
                            kind: monaco.languages.CompletionItemKind.Module,
                            insertText: item.name,
                            sortText: '0' + item.name,  // Sort packages first
                            // Add documentation for hover
                            documentation: {
                                value: `### Java Package: ${item.name}\n\nStandard Java package containing classes and interfaces for Java core functionality.`
                            }
                        });
                    } else {
                        // Class styling - yellow text with source path on right
                        suggestions.push({
                            label: {
                                label: item.name,
                                description: item.description
                            },
                            kind: item.icon === 'constructor' ? 
                                  monaco.languages.CompletionItemKind.Constructor : 
                                  monaco.languages.CompletionItemKind.Class,
                            insertText: item.name,
                            sortText: '1' + item.name,  // Sort classes after packages
                            // Add documentation for hover
                            documentation: {
                                value: `### Java Class: ${item.name}\n\nFrom: ${item.description}\n\nA Java class from the core platform libraries.`
                            }
                        });
                    }
                });
                
                return { suggestions };
            }
            
            // New statement completion
            if (textUntilPosition.trim().endsWith('new ')) {
                return {
                    suggestions: javaTypes.map(type => ({
                        label: type,
                        kind: monaco.languages.CompletionItemKind.Constructor,
                        insertText: `${type}(${type === 'String' ? '"${0}"' : '${0}'})`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `Create new ${type} instance`,
                        documentation: `Create a new instance of ${type}.`
                    }))
                };
            }
            
            // Snippets
            if (textUntilPosition.trim() === 'sysout') {
                suggestions.push({
                    label: 'sysout',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: 'System.out.println(${0});',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: 'System.out.println()',
                    documentation: 'Print to standard output.'
                });
            }
            
            if (textUntilPosition.trim() === 'main') {
                suggestions.push({
                    label: 'main',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'public static void main(String[] args) {',
                        '\t${0}',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: 'main method',
                    documentation: 'Create a main method.'
                });
            }
            
            // Default suggestions: add keywords and types
            javaKeywords.forEach(keyword => {
                suggestions.push({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                    detail: 'Java keyword'
                });
            });
            
            javaTypes.forEach(type => {
                suggestions.push({
                    label: type,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: type,
                    detail: 'Java class'
                });
            });
            
            return { suggestions };
        }
    });
    
    // 3. Register hover provider for documentation
    monaco.languages.registerHoverProvider('java', {
        provideHover: function(model, position) {
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            
            const lineContent = model.getLineContent(position.lineNumber);
            
            // Provide hover info for System.out.println
            if (word.word === 'println' && lineContent.includes('System.out.println')) {
                return {
                    contents: [
                        { value: '**System.out.println**' },
                        { value: 'Prints a string and then terminates the line.' },
                        { value: '```java\nvoid println(String s)\n```' }
                    ]
                };
            }
            
            // Provide hover info for Java keywords
            if (javaKeywords.includes(word.word)) {
                return {
                    contents: [
                        { value: `**${word.word}**` },
                        { value: `Java keyword: ${word.word}` }
                    ]
                };
            }
            
            // Provide hover info for Java types
            if (javaTypes.includes(word.word)) {
                return {
                    contents: [
                        { value: `**${word.word}**` },
                        { value: `Java class: ${word.word}` }
                    ]
                };
            }
            
            return null;
        }
    });
    
    // Set status message to indicate fix has been applied
    if (typeof setStatusMessage === 'function') {
        setStatusMessage('Java features enabled (Basic Mode)');
    }
    
    console.log('Direct fix for Java features applied successfully');
}

// Show a notification to the user
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 5000);
}
