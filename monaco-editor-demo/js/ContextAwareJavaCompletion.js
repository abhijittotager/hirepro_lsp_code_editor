/**
 * ContextAwareJavaCompletion.js
 * 
 * Provides advanced context-aware IntelliSense for Java in Monaco editor
 * Analyzes context before the "." to provide appropriate method/property suggestions
 */

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Monaco to load
    setTimeout(setupContextAwareCompletion, 2000);
});

// Java Type Database - Maps types to their available methods/properties
const javaTypeSystem = {
    // Base type - for 'Object' methods available on all classes
    'Object': {
        methods: [
            { name: 'toString()', returnType: 'String', description: 'Returns a string representation of the object' },
            { name: 'equals(Object obj)', returnType: 'boolean', description: 'Indicates whether some other object is "equal to" this one' },
            { name: 'hashCode()', returnType: 'int', description: 'Returns a hash code value for the object' },
            { name: 'getClass()', returnType: 'Class<?>', description: 'Returns the runtime class of this Object' },
            { name: 'clone()', returnType: 'Object', description: 'Creates and returns a copy of this object' },
            { name: 'notify()', returnType: 'void', description: 'Wakes up a single thread that is waiting on this object\'s monitor' },
            { name: 'notifyAll()', returnType: 'void', description: 'Wakes up all threads that are waiting on this object\'s monitor' },
            { name: 'wait()', returnType: 'void', description: 'Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object' },
            { name: 'wait(long timeout)', returnType: 'void', description: 'Causes the current thread to wait until either another thread invokes the notify() method or the notifyAll() method for this object, or a specified amount of time has elapsed' },
            { name: 'finalize()', returnType: 'void', description: 'Called by the garbage collector on an object when garbage collection determines that there are no more references to the object' }
        ]
    },
    // Common Java classes and their methods
    'String': {
        methods: [
            { name: 'length()', returnType: 'int', description: 'Returns the length of this string' },
            { name: 'charAt(int index)', returnType: 'char', description: 'Returns the char value at the specified index' },
            { name: 'substring(int beginIndex)', returnType: 'String', description: 'Returns a string that is a substring of this string' },
            { name: 'substring(int beginIndex, int endIndex)', returnType: 'String', description: 'Returns a string that is a substring of this string' },
            { name: 'equals(Object anObject)', returnType: 'boolean', description: 'Compares this string to the specified object' },
            { name: 'equalsIgnoreCase(String anotherString)', returnType: 'boolean', description: 'Compares this String to another String, ignoring case' },
            { name: 'compareTo(String anotherString)', returnType: 'int', description: 'Compares two strings lexicographically' },
            { name: 'compareToIgnoreCase(String str)', returnType: 'int', description: 'Compares two strings lexicographically, ignoring case' },
            { name: 'startsWith(String prefix)', returnType: 'boolean', description: 'Tests if this string starts with the specified prefix' },
            { name: 'endsWith(String suffix)', returnType: 'boolean', description: 'Tests if this string ends with the specified suffix' },
            { name: 'indexOf(String str)', returnType: 'int', description: 'Returns the index within this string of the first occurrence of the specified substring' },
            { name: 'lastIndexOf(String str)', returnType: 'int', description: 'Returns the index within this string of the last occurrence of the specified substring' },
            { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if, and only if, length() is 0' },
            { name: 'contains(CharSequence s)', returnType: 'boolean', description: 'Returns true if and only if this string contains the specified sequence' },
            { name: 'replace(char oldChar, char newChar)', returnType: 'String', description: 'Returns a string resulting from replacing all occurrences of oldChar in this string with newChar' },
            { name: 'replace(CharSequence target, CharSequence replacement)', returnType: 'String', description: 'Replaces each substring of this string that matches the literal target sequence with the specified literal replacement sequence' },
            { name: 'trim()', returnType: 'String', description: 'Returns a string whose value is this string, with any leading and trailing whitespace removed' },
            { name: 'toUpperCase()', returnType: 'String', description: 'Converts all of the characters in this String to upper case' },
            { name: 'toLowerCase()', returnType: 'String', description: 'Converts all of the characters in this String to lower case' },
            { name: 'split(String regex)', returnType: 'String[]', description: 'Splits this string around matches of the given regular expression' },
            { name: 'join(CharSequence delimiter, CharSequence... elements)', returnType: 'String', description: 'Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter' },
            { name: 'matches(String regex)', returnType: 'boolean', description: 'Tells whether or not this string matches the given regular expression' },
            { name: 'toCharArray()', returnType: 'char[]', description: 'Converts this string to a new character array' },
            { name: 'concat(String str)', returnType: 'String', description: 'Concatenates the specified string to the end of this string' },
            { name: 'strip()', returnType: 'String', description: 'Returns a string whose value is this string, with all leading and trailing whitespace removed' },
            { name: 'stripLeading()', returnType: 'String', description: 'Returns a string whose value is this string, with all leading whitespace removed' },
            { name: 'stripTrailing()', returnType: 'String', description: 'Returns a string whose value is this string, with all trailing whitespace removed' },
            { name: 'isBlank()', returnType: 'boolean', description: 'Returns true if the string is empty or contains only whitespace codepoints' },
        ]
    },
    'System': {
        fields: [
            { name: 'out', type: 'PrintStream', description: 'The "standard" output stream' },
            { name: 'err', type: 'PrintStream', description: 'The "standard" error output stream' },
            { name: 'in', type: 'InputStream', description: 'The "standard" input stream' }
        ],
        methods: [
            { name: 'currentTimeMillis()', returnType: 'long', description: 'Returns the current time in milliseconds' },
            { name: 'nanoTime()', returnType: 'long', description: 'Returns the current value of the running JVM high-resolution time source, in nanoseconds' },
            { name: 'exit(int status)', returnType: 'void', description: 'Terminates the currently running JVM' },
            { name: 'gc()', returnType: 'void', description: 'Runs the garbage collector' },
            { name: 'getProperty(String key)', returnType: 'String', description: 'Gets the system property indicated by the specified key' }
        ]
    },
    'PrintStream': {
        methods: [
            { name: 'print(String s)', returnType: 'void', description: 'Prints a string' },
            { name: 'println()', returnType: 'void', description: 'Terminates the current line by writing the line separator string' },
            { name: 'println(String x)', returnType: 'void', description: 'Prints a String and then terminates the line' },
            { name: 'println(int x)', returnType: 'void', description: 'Prints an integer and then terminates the line' },
            { name: 'println(double x)', returnType: 'void', description: 'Prints a double and then terminates the line' },
            { name: 'println(Object x)', returnType: 'void', description: 'Prints an Object and then terminates the line' },
            { name: 'println(boolean x)', returnType: 'void', description: 'Prints a boolean and then terminates the line' },
            { name: 'printf(String format, Object... args)', returnType: 'PrintStream', description: 'A convenience method to write a formatted string to this output stream using the specified format string and arguments' }
        ]
    },
    'Integer': {
        fields: [
            { name: 'MAX_VALUE', type: 'int', description: 'A constant holding the maximum value an int can have, 2^31-1' },
            { name: 'MIN_VALUE', type: 'int', description: 'A constant holding the minimum value an int can have, -2^31' }
        ],
        methods: [
            { name: 'parseInt(String s)', returnType: 'int', description: 'Parses the string argument as a signed decimal integer' },
            { name: 'toString(int i)', returnType: 'String', description: 'Returns a String object representing the specified integer' },
            { name: 'valueOf(int i)', returnType: 'Integer', description: 'Returns an Integer instance representing the specified int value' },
            { name: 'valueOf(String s)', returnType: 'Integer', description: 'Returns an Integer object holding the value of the specified String' },
            { name: 'intValue()', returnType: 'int', description: 'Returns the value of this Integer as an int' }
        ]
    },
    'Math': {
        methods: [
            { name: 'abs(int a)', returnType: 'int', description: 'Returns the absolute value of an int value' },
            { name: 'abs(double a)', returnType: 'double', description: 'Returns the absolute value of a double value' },
            { name: 'max(int a, int b)', returnType: 'int', description: 'Returns the greater of two int values' },
            { name: 'min(int a, int b)', returnType: 'int', description: 'Returns the smaller of two int values' },
            { name: 'random()', returnType: 'double', description: 'Returns a double value with a positive sign, greater than or equal to 0.0 and less than 1.0' },
            { name: 'sqrt(double a)', returnType: 'double', description: 'Returns the correctly rounded positive square root of a double value' },
            { name: 'pow(double a, double b)', returnType: 'double', description: 'Returns the value of the first argument raised to the power of the second argument' },
            { name: 'sin(double a)', returnType: 'double', description: 'Returns the trigonometric sine of an angle' },
            { name: 'cos(double a)', returnType: 'double', description: 'Returns the trigonometric cosine of an angle' },
            { name: 'tan(double a)', returnType: 'double', description: 'Returns the trigonometric tangent of an angle' },
            { name: 'round(float a)', returnType: 'int', description: 'Returns the closest int to the argument' },
            { name: 'round(double a)', returnType: 'long', description: 'Returns the closest long to the argument' }
        ],
        fields: [
            { name: 'PI', type: 'double', description: 'The double value that is closer than any other to pi, the ratio of the circumference of a circle to its diameter' },
            { name: 'E', type: 'double', description: 'The double value that is closer than any other to e, the base of the natural logarithms' }
        ]
    },
    'java.util.ArrayList': {
        methods: [
            { name: 'add(E e)', returnType: 'boolean', description: 'Appends the specified element to the end of this list' },
            { name: 'add(int index, E element)', returnType: 'void', description: 'Inserts the specified element at the specified position in this list' },
            { name: 'get(int index)', returnType: 'E', description: 'Returns the element at the specified position in this list' },
            { name: 'remove(int index)', returnType: 'E', description: 'Removes the element at the specified position in this list' },
            { name: 'remove(Object o)', returnType: 'boolean', description: 'Removes the first occurrence of the specified element from this list' },
            { name: 'size()', returnType: 'int', description: 'Returns the number of elements in this list' },
            { name: 'clear()', returnType: 'void', description: 'Removes all of the elements from this list' },
            { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this list contains no elements' },
            { name: 'contains(Object o)', returnType: 'boolean', description: 'Returns true if this list contains the specified element' },
            { name: 'indexOf(Object o)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified element in this list' },
            { name: 'lastIndexOf(Object o)', returnType: 'int', description: 'Returns the index of the last occurrence of the specified element in this list' },
            { name: 'toArray()', returnType: 'Object[]', description: 'Returns an array containing all of the elements in this list in proper sequence' },
            { name: 'subList(int fromIndex, int toIndex)', returnType: 'List<E>', description: 'Returns a view of the portion of this list between the specified fromIndex, inclusive, and toIndex, exclusive' }
        ]
    },
    'java.io.File': {
        methods: [
            { name: 'canRead()', returnType: 'boolean', description: 'Tests whether the application can read the file denoted by this abstract pathname' },
            { name: 'canWrite()', returnType: 'boolean', description: 'Tests whether the application can modify the file denoted by this abstract pathname' },
            { name: 'delete()', returnType: 'boolean', description: 'Deletes the file or directory denoted by this abstract pathname' },
            { name: 'exists()', returnType: 'boolean', description: 'Tests whether the file or directory denoted by this abstract pathname exists' },
            { name: 'getName()', returnType: 'String', description: 'Returns the name of the file or directory denoted by this abstract pathname' },
            { name: 'getPath()', returnType: 'String', description: 'Converts this abstract pathname into a pathname string' },
            { name: 'isDirectory()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a directory' },
            { name: 'isFile()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a normal file' },
            { name: 'length()', returnType: 'long', description: 'Returns the length of the file denoted by this abstract pathname' },
            { name: 'list()', returnType: 'String[]', description: 'Returns an array of strings naming the files and directories in the directory denoted by this abstract pathname' },
            { name: 'mkdir()', returnType: 'boolean', description: 'Creates the directory named by this abstract pathname' },
            { name: 'mkdirs()', returnType: 'boolean', description: 'Creates the directory named by this abstract pathname, including any necessary but nonexistent parent directories' }
        ]
    }
};

// Java Variable Type Tracking System
const javaVariableTypes = {};

// Analyze code to infer variable types
function analyzeJavaCode(model) {
    // Reset variable types
    Object.keys(javaVariableTypes).forEach(key => {
        delete javaVariableTypes[key];
    });
    
    // Get all the text from the model
    const text = model.getValue();
    
    // Match variable declarations
    // Pattern: Type varName = ...
    const declarationRegex = /\b(\w+(?:\.\w+)*)\s+(\w+)\s*=/g;
    let match;
    
    while ((match = declarationRegex.exec(text)) !== null) {
        const type = match[1]; // e.g., "String"
        const varName = match[2]; // e.g., "myString"
        javaVariableTypes[varName] = type;
    }
    
    // Add well-known variables
    javaVariableTypes['System'] = 'System';
    javaVariableTypes['Math'] = 'Math';
    javaVariableTypes['Integer'] = 'Integer';
    
    // Match method return values
    // Pattern: varName = object.method()
    const methodReturnRegex = /(\w+)\s*=\s*(\w+)\.(\w+)\(/g;
    while ((match = methodReturnRegex.exec(text)) !== null) {
        const varName = match[1]; // e.g., "result"
        const objectName = match[2]; // e.g., "myString"
        const methodName = match[3]; // e.g., "substring"
        
        // Look up the object's type
        const objectType = javaVariableTypes[objectName];
        if (objectType && javaTypeSystem[objectType]) {
            // Find the method in the type system to get its return type
            const method = javaTypeSystem[objectType].methods.find(m => 
                m.name.startsWith(methodName + '('));
            
            if (method) {
                // Extract return type and store it
                javaVariableTypes[varName] = method.returnType;
            }
        }
    }
    
    console.log('Java Variable Types:', javaVariableTypes);
}

// Setup function for context-aware completion
function setupContextAwareCompletion() {
    if (!monaco || !window.editor) {
        console.error('Monaco or editor not available for context-aware completion setup');
        return;
    }
    
    console.log('Setting up context-aware Java completion...');
    
    // Register for model changes to track variable types
    window.editor.onDidChangeModelContent(() => {
        const model = window.editor.getModel();
        if (model && model.getLanguageId() === 'java') {
            analyzeJavaCode(model);
        }
    });
    
    // Initial code analysis
    const model = window.editor.getModel();
    if (model && model.getLanguageId() === 'java') {
        analyzeJavaCode(model);
    }
    
    // Register context-aware completion provider
    monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.'],
        provideCompletionItems: function(model, position) {
            // Get text until cursor (up to 100 characters back to limit processing)
            const maxLookback = Math.max(1, position.column - 100);
            const lineUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: maxLookback,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            console.log('Context text:', lineUntilPosition);
            
            // Check if we're after a dot
            if (!lineUntilPosition.endsWith('.')) {
                return { suggestions: [] };
            }
            
            // Extract the object name before the dot
            // This regex finds the word right before the last dot
            const objectNameMatch = lineUntilPosition.match(/[\w$]+(?=\.\s*$)|[\w$]+(?=\.$)/);
            if (!objectNameMatch) {
                return { suggestions: [] };
            }
            
            const objectName = objectNameMatch[0];
            console.log('Object name before dot:', objectName);
            
            // Map from variable name to its type
            let objectType = javaVariableTypes[objectName];
            
            // Handle fully qualified types that might be used directly
            if (!objectType) {
                // Check if objectName is a direct type
                if (javaTypeSystem[objectName]) {
                    objectType = objectName;
                }
                
                // Handle common packages
                if (objectName === 'java') {
                    return getJavaPackages();
                }
            }
            
            // Check if we know this type
            if (!objectType || !javaTypeSystem[objectType]) {
                console.log('Unknown type for object:', objectName);
                return { suggestions: [] };
            }
            
            console.log('Object type:', objectType);
            
            // Get the type info from our database
            const typeInfo = javaTypeSystem[objectType];
            const suggestions = [];
            
            // Add all methods for this type
            if (typeInfo.methods) {
                typeInfo.methods.forEach(method => {
                    // Parse method signature for display and insertion
                    const methodNameEnd = method.name.indexOf('(');
                    const methodName = method.name.substring(0, methodNameEnd);
                    
                    // Create completion item
                    suggestions.push({
                        label: {
                            label: method.name,
                            description: method.returnType
                        },
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: methodName + getMethodSnippet(method.name),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: {
                            value: `**${method.returnType} ${method.name}**\n\n${method.description}`
                        },
                        detail: `${method.returnType} - ${method.description}`,
                        sortText: 'a' + methodName // Sort methods first
                    });
                });
            }
            
            // Add all fields for this type
            if (typeInfo.fields) {
                typeInfo.fields.forEach(field => {
                    suggestions.push({
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
                        sortText: 'b' + field.name // Sort fields after methods
                    });
                });
            }
            
            return { suggestions };
        }
    });
    
    // Show notification of successful setup
    if (typeof showNotification === 'function') {
        showNotification('Context-aware Java IntelliSense enabled');
    } else {
        console.log('Context-aware Java IntelliSense enabled');
    }
}

// Helper function to create Java package completion suggestions
function getJavaPackages() {
    const packages = [
        { name: 'java.lang', description: 'Core Java classes' },
        { name: 'java.util', description: 'Utility classes' },
        { name: 'java.io', description: 'Input/output classes' },
        { name: 'java.math', description: 'Mathematics classes' },
        { name: 'java.net', description: 'Networking classes' },
        { name: 'java.time', description: 'Date and time classes' },
        { name: 'java.sql', description: 'Database access classes' },
        { name: 'java.awt', description: 'Abstract Window Toolkit' },
        { name: 'java.nio', description: 'New I/O classes' }
    ];
    
    return {
        suggestions: packages.map(pkg => ({
            label: {
                label: pkg.name.substring('java.'.length),
                description: pkg.description
            },
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: pkg.name.substring('java.'.length),
            documentation: {
                value: `**${pkg.name}**\n\n${pkg.description}`
            },
            detail: pkg.description
        }))
    };
}

// Convert method signature to a snippet
function getMethodSnippet(methodSignature) {
    // Extract parameters
    const paramsStart = methodSignature.indexOf('(') + 1;
    const paramsEnd = methodSignature.lastIndexOf(')');
    const paramsText = methodSignature.substring(paramsStart, paramsEnd).trim();
    
    if (!paramsText) {
        return '()';
    }
    
    // Split parameters
    const params = paramsText.split(',');
    
    // Create snippet with tab stops
    let snippet = '(';
    params.forEach((param, index) => {
        // Extract parameter name (last word in the param definition)
        const paramNameMatch = param.trim().match(/\w+$/);
        const paramName = paramNameMatch ? paramNameMatch[0] : `param${index + 1}`;
        
        // Add to snippet
        if (index > 0) {
            snippet += ', ';
        }
        snippet += '${' + (index + 1) + ':' + paramName + '}';
    });
    snippet += ')';
    
    return snippet;
}
