/**
 * EnhancedJavaIntelliSense.js
 * 
 * A comprehensive context-aware Java IntelliSense system for Monaco Editor
 * Tracks variables, analyzes context, and provides appropriate suggestions
 */

// Initialize the enhanced IntelliSense when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeEnhancedJavaIntelliSense, 3000);
});

// Global state for tracking Java context
const javaContext = {
    // Track variables and their types
    variables: {},
    // Current imports
    imports: [],
    // Current document version for change tracking
    documentVersion: 0,
    // Is initialized
    initialized: false
};

// Comprehensive Java type system (most commonly used types)
const javaTypes = {
    // Basic Object type (all objects inherit these methods)
    'Object': {
        methods: [
            { name: 'toString()', returnType: 'String', description: 'Returns a string representation of the object' },
            { name: 'equals(Object obj)', returnType: 'boolean', description: 'Indicates whether some other object is equal to this one' },
            { name: 'hashCode()', returnType: 'int', description: 'Returns a hash code value for the object' },
            { name: 'getClass()', returnType: 'Class<?>',  description: 'Returns the runtime class of this Object' }
        ]
    },
    // String methods and properties
    'String': {
        inherits: 'Object',
        methods: [
            { name: 'length()', returnType: 'int', description: 'Returns the length of this string' },
            { name: 'charAt(int index)', returnType: 'char', description: 'Returns the character at the specified index' },
            { name: 'substring(int beginIndex)', returnType: 'String', description: 'Returns a substring starting at the specified index' },
            { name: 'substring(int beginIndex, int endIndex)', returnType: 'String', description: 'Returns a substring between the specified indices' },
            { name: 'indexOf(String str)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified substring' },
            { name: 'indexOf(String str, int fromIndex)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified substring, starting at the specified index' },
            { name: 'lastIndexOf(String str)', returnType: 'int', description: 'Returns the index of the last occurrence of the specified substring' },
            { name: 'replace(char oldChar, char newChar)', returnType: 'String', description: 'Returns a new string resulting from replacing all occurrences of oldChar with newChar' },
            { name: 'toLowerCase()', returnType: 'String', description: 'Converts all characters to lower case' },
            { name: 'toUpperCase()', returnType: 'String', description: 'Converts all characters to upper case' },
            { name: 'trim()', returnType: 'String', description: 'Removes leading and trailing whitespace' },
            { name: 'split(String regex)', returnType: 'String[]', description: 'Splits this string around matches of the given regular expression' }
        ]
    },
    // System class
    'System': {
        static: true,
        fields: [
            { name: 'out', type: 'PrintStream', description: 'The standard output stream' },
            { name: 'err', type: 'PrintStream', description: 'The standard error output stream' },
            { name: 'in', type: 'InputStream', description: 'The standard input stream' }
        ],
        methods: [
            { name: 'currentTimeMillis()', returnType: 'long', description: 'Returns the current time in milliseconds' },
            { name: 'nanoTime()', returnType: 'long', description: 'Returns the current time in nanoseconds' },
            { name: 'exit(int status)', returnType: 'void', description: 'Terminates the currently running Java virtual machine' },
            { name: 'getProperty(String key)', returnType: 'String', description: 'Gets the system property indicated by the specified key' }
        ]
    },
    // PrintStream for System.out/err
    'PrintStream': {
        inherits: 'Object',
        methods: [
            { name: 'print(String s)', returnType: 'void', description: 'Prints a string' },
            { name: 'println()', returnType: 'void', description: 'Terminates the current line' },
            { name: 'println(String x)', returnType: 'void', description: 'Prints a string and then terminates the line' },
            { name: 'println(int x)', returnType: 'void', description: 'Prints an integer and then terminates the line' },
            { name: 'println(boolean x)', returnType: 'void', description: 'Prints a boolean and then terminates the line' },
            { name: 'printf(String format, Object... args)', returnType: 'PrintStream', description: 'Formats and prints using the specified format string and arguments' }
        ]
    },
    // Math class
    'Math': {
        static: true,
        fields: [
            { name: 'PI', type: 'double', description: 'The constant pi, the ratio of the circumference of a circle to its diameter' },
            { name: 'E', type: 'double', description: 'The constant e, the base of the natural logarithm' }
        ],
        methods: [
            { name: 'abs(int a)', returnType: 'int', description: 'Returns the absolute value of an int value' },
            { name: 'abs(double a)', returnType: 'double', description: 'Returns the absolute value of a double value' },
            { name: 'max(int a, int b)', returnType: 'int', description: 'Returns the greater of two int values' },
            { name: 'min(int a, int b)', returnType: 'int', description: 'Returns the lesser of two int values' },
            { name: 'sqrt(double a)', returnType: 'double', description: 'Returns the square root of a double value' },
            { name: 'pow(double a, double b)', returnType: 'double', description: 'Returns the value of the first argument raised to the power of the second argument' },
            { name: 'random()', returnType: 'double', description: 'Returns a random number between 0.0 and 1.0' },
            { name: 'floor(double a)', returnType: 'double', description: 'Returns the largest integer less than or equal to a' },
            { name: 'ceil(double a)', returnType: 'double', description: 'Returns the smallest integer greater than or equal to a' },
            { name: 'round(double a)', returnType: 'long', description: 'Returns the closest long to the argument' }
        ]
    },
    // ArrayList implementation
    'java.util.ArrayList': {
        inherits: 'Object',
        methods: [
            { name: 'add(E e)', returnType: 'boolean', description: 'Appends the specified element to the end of this list' },
            { name: 'add(int index, E element)', returnType: 'void', description: 'Inserts the specified element at the specified position in this list' },
            { name: 'get(int index)', returnType: 'E', description: 'Returns the element at the specified position in this list' },
            { name: 'remove(int index)', returnType: 'E', description: 'Removes the element at the specified position in this list' },
            { name: 'size()', returnType: 'int', description: 'Returns the number of elements in this list' },
            { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this list contains no elements' },
            { name: 'clear()', returnType: 'void', description: 'Removes all of the elements from this list' },
            { name: 'contains(Object o)', returnType: 'boolean', description: 'Returns true if this list contains the specified element' }
        ]
    },
    // HashMap implementation
    'java.util.HashMap': {
        inherits: 'Object',
        methods: [
            { name: 'put(K key, V value)', returnType: 'V', description: 'Associates the specified value with the specified key in this map' },
            { name: 'get(Object key)', returnType: 'V', description: 'Returns the value to which the specified key is mapped' },
            { name: 'remove(Object key)', returnType: 'V', description: 'Removes the mapping for a key from this map if it is present' },
            { name: 'size()', returnType: 'int', description: 'Returns the number of key-value mappings in this map' },
            { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this map contains no key-value mappings' },
            { name: 'clear()', returnType: 'void', description: 'Removes all of the mappings from this map' },
            { name: 'keySet()', returnType: 'Set<K>', description: 'Returns a Set view of the keys contained in this map' },
            { name: 'containsKey(Object key)', returnType: 'boolean', description: 'Returns true if this map contains a mapping for the specified key' }
        ]
    },
    // File handling
    'java.io.File': {
        inherits: 'Object',
        methods: [
            { name: 'exists()', returnType: 'boolean', description: 'Tests whether the file or directory denoted by this abstract pathname exists' },
            { name: 'getName()', returnType: 'String', description: 'Returns the name of the file or directory denoted by this abstract pathname' },
            { name: 'getPath()', returnType: 'String', description: 'Converts this abstract pathname into a pathname string' },
            { name: 'isDirectory()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a directory' },
            { name: 'isFile()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a normal file' },
            { name: 'length()', returnType: 'long', description: 'Returns the length of the file denoted by this abstract pathname' },
            { name: 'createNewFile()', returnType: 'boolean', description: 'Atomically creates a new, empty file named by this abstract pathname' },
            { name: 'delete()', returnType: 'boolean', description: 'Deletes the file or directory denoted by this abstract pathname' },
            { name: 'list()', returnType: 'String[]', description: 'Returns an array of strings naming the files and directories in the directory' }
        ]
    },
    // Date handling
    'java.util.Date': {
        inherits: 'Object',
        methods: [
            { name: 'getTime()', returnType: 'long', description: 'Returns the number of milliseconds since January 1, 1970, 00:00:00 GMT' },
            { name: 'setTime(long time)', returnType: 'void', description: 'Sets this Date object to represent the specified time in milliseconds' },
            { name: 'before(Date when)', returnType: 'boolean', description: 'Tests if this date is before the specified date' },
            { name: 'after(Date when)', returnType: 'boolean', description: 'Tests if this date is after the specified date' },
            { name: 'compareTo(Date anotherDate)', returnType: 'int', description: 'Compares two Dates for ordering' },
            { name: 'toString()', returnType: 'String', description: 'Converts this Date object to a String' }
        ]
    }
};

// Initialize the advanced Java IntelliSense
function initializeEnhancedJavaIntelliSense() {
    if (!monaco || !window.editor) {
        console.error('Monaco or editor not initialized');
        setTimeout(initializeEnhancedJavaIntelliSense, 1000);
        return;
    }

    console.log('Initializing Enhanced Java IntelliSense...');
    
    // Register the completion provider for Java
    monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.'],
        provideCompletionItems: function(model, position) {
            const lineText = model.getLineContent(position.lineNumber);
            const wordUntilPosition = model.getWordUntilPosition(position);
            
            // Check for dot completion
            if (lineText.charAt(position.column - 2) === '.') {
                // Get the expression before the dot
                const beforeDot = getExpressionBeforeDot(lineText, position.column - 2);
                console.log('Expression before dot:', beforeDot);
                
                // Different handling based on what's before the dot
                return handleDotCompletion(beforeDot);
            }
            
            // Handle regular word completions
            return { suggestions: [] };
        }
    });
    
    // Set up event listeners to keep track of the Java context
    window.editor.onDidChangeModelContent(e => {
        const model = window.editor.getModel();
        if (model && model.getLanguageId() === 'java') {
            updateJavaContext(model);
        }
    });
    
    // Initial context update
    const model = window.editor.getModel();
    if (model && model.getLanguageId() === 'java') {
        updateJavaContext(model);
    }
    
    javaContext.initialized = true;
    console.log('Enhanced Java IntelliSense initialized');
    
    // Notification
    showEnhancedIntelliSenseNotification();
}

// Extract the expression before a dot
function getExpressionBeforeDot(lineText, dotIndex) {
    // Go backwards from the dot to find the start of the expression
    let start = dotIndex - 1;
    let parenStack = 0;
    
    while (start >= 0) {
        const char = lineText.charAt(start);
        
        // Handle parentheses for method calls
        if (char === ')') parenStack++;
        else if (char === '(') {
            parenStack--;
            if (parenStack < 0) break; // Mismatched parentheses
        }
        
        // Break on expression separators
        if (parenStack === 0 && /[^a-zA-Z0-9_$.]/.test(char)) break;
        
        start--;
    }
    
    // Extract the expression
    return lineText.substring(start + 1, dotIndex).trim();
}

// Handle completion after a dot
function handleDotCompletion(expression) {
    console.log('Handling dot completion for:', expression);
    const suggestions = [];
    
    // Special case for well-known identifiers
    if (expression === 'System') {
        return getCompletionsForType('System');
    } else if (expression === 'Math') {
        return getCompletionsForType('Math');
    } else if (expression === 'System.out') {
        return getCompletionsForType('PrintStream');
    } else if (expression.startsWith('new ')) {
        // Handle constructor context
        const className = expression.substring(4).trim();
        return getCompletionsForType(className);
    }
    
    // Look up variable type
    const variableType = getVariableType(expression);
    if (variableType) {
        return getCompletionsForType(variableType);
    }
    
    // Return empty list if no matching context
    return { suggestions };
}

// Get completions for a specific type
function getCompletionsForType(typeName) {
    const suggestions = [];
    const typeInfo = javaTypes[typeName];
    
    if (!typeInfo) {
        console.log('Type not found in type system:', typeName);
        return { suggestions };
    }
    
    // Add methods
    if (typeInfo.methods) {
        typeInfo.methods.forEach(method => {
            suggestions.push(createMethodSuggestion(method));
        });
    }
    
    // Add fields
    if (typeInfo.fields) {
        typeInfo.fields.forEach(field => {
            suggestions.push(createFieldSuggestion(field));
        });
    }
    
    // Add inherited methods (like Object methods)
    if (typeInfo.inherits && javaTypes[typeInfo.inherits]) {
        const parentType = javaTypes[typeInfo.inherits];
        if (parentType.methods) {
            parentType.methods.forEach(method => {
                suggestions.push(createMethodSuggestion(method));
            });
        }
    }
    
    return { suggestions };
}

// Create a completion item for a method
function createMethodSuggestion(method) {
    // Extract method name (without parameters)
    const methodNameEnd = method.name.indexOf('(');
    const methodName = method.name.substring(0, methodNameEnd);
    
    // Create completion suggestion
    return {
        label: {
            label: method.name,
            description: method.returnType
        },
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: createMethodSnippet(method.name),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
            value: `**${method.returnType} ${method.name}**\n\n${method.description}`
        },
        detail: `${method.returnType} - ${method.description}`,
        sortText: '0' + methodName // Methods appear first
    };
}

// Create a completion item for a field
function createFieldSuggestion(field) {
    return {
        label: {
            label: field.name,
            description: field.type
        },
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: field.name,
        documentation: {
            value: `**${field.type} ${field.name}**\n\n${field.description}`
        },
        detail: `${field.type} - ${field.description}`,
        sortText: '1' + field.name // Fields appear after methods
    };
}

// Create proper snippet for method parameters
function createMethodSnippet(methodName) {
    // Extract method parameters
    const openParenIndex = methodName.indexOf('(');
    const closeParenIndex = methodName.lastIndexOf(')');
    
    if (openParenIndex === -1 || closeParenIndex === -1) {
        return methodName; // Not a method or malformed
    }
    
    const methodBaseName = methodName.substring(0, openParenIndex);
    const paramsText = methodName.substring(openParenIndex + 1, closeParenIndex);
    
    // If no parameters, just return method name with empty parentheses
    if (!paramsText.trim()) {
        return `${methodBaseName}()`;
    }
    
    // Generate snippet with tab stops for each parameter
    const params = paramsText.split(',');
    let snippet = `${methodBaseName}(`;
    
    params.forEach((param, index) => {
        // Extract parameter name (last word)
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

// Get variable type from context
function getVariableType(variableName) {
    // Check if we have tracked this variable
    if (javaContext.variables[variableName]) {
        return javaContext.variables[variableName];
    }
    
    // Additional fallback logic for common patterns
    if (variableName.includes('.')) {
        const parts = variableName.split('.');
        if (parts.length === 2) {
            if (parts[0] === 'System' && parts[1] === 'out') {
                return 'PrintStream';
            }
        }
    }
    
    return null;
}

// Update the Java context by analyzing the code
function updateJavaContext(model) {
    const code = model.getValue();
    javaContext.documentVersion++; // Increment version
    
    // Reset tracking
    javaContext.variables = {
        // Always track these globals
        'System': 'System',
        'Math': 'Math'
    };
    javaContext.imports = [];
    
    // Parse variable declarations
    const declarationRegex = /\b(\w+(?:\.\w+)*)\s+(\w+)\s*=/g;
    let match;
    
    while ((match = declarationRegex.exec(code)) !== null) {
        const type = match[1]; // e.g., "String"
        const varName = match[2]; // e.g., "myString"
        javaContext.variables[varName] = type;
    }
    
    // Parse import statements
    const importRegex = /import\s+([\w.]+);/g;
    while ((match = importRegex.exec(code)) !== null) {
        javaContext.imports.push(match[1]);
    }
    
    console.log('Updated Java context:', javaContext);
}

// Show notification when the enhanced IntelliSense is ready
function showEnhancedIntelliSenseNotification() {
    // Check if we have a notification function
    if (typeof showNotification === 'function') {
        showNotification('Enhanced Context-Aware Java IntelliSense Activated');
    } else {
        // Create our own notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.5s';
        notification.textContent = 'Enhanced Context-Aware Java IntelliSense Activated';
        
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
}
