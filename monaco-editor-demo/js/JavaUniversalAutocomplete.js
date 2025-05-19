/**
 * JavaUniversalAutocomplete.js
 * Implements comprehensive autocomplete for all Java elements
 */

(function() {
    'use strict';

    // Main autocomplete handler
    window.JavaUniversalAutocomplete = {
        initialize: function() {
            console.log('Initializing Java Universal Autocomplete...');
            this.registerAutocompleteProviders();
        },

        registerAutocompleteProviders: function() {
            // Register the universal autocomplete provider
            monaco.languages.registerCompletionItemProvider('java', {
                triggerCharacters: ['.', ' ', '(', '{', '[', '<', '@', '"', '\'', '/', '=', ':', ',', ';'],
                provideCompletionItems: this.provideUniversalCompletions
            });
        },

        // Main completion handler that determines context and delegates to specific handlers
        provideUniversalCompletions: function(model, position) {
            const lineContent = model.getLineContent(position.lineNumber);
            const textUntilCursor = lineContent.substring(0, position.column - 1);
            const wordUntilPosition = model.getWordUntilPosition(position);
            
            // Create word range for proper replacement
            const wordRange = new monaco.Range(
                position.lineNumber,
                wordUntilPosition.startColumn,
                position.lineNumber,
                wordUntilPosition.endColumn
            );
            
            // Determine context and provide appropriate suggestions
            
            // 1. After a dot - member access (highest priority)
            if (textUntilCursor.endsWith('.')) {
                return JavaMemberCompletion.provideMemberCompletions(model, position, wordRange);
            }
            
            // 2. Import statements
            if (/^\s*import\s+[\w.]*$/.test(textUntilCursor)) {
                return JavaImportCompletion.provideImportCompletions(textUntilCursor, wordRange);
            }
            
            // 3. Package declaration
            if (/^\s*package\s+[\w.]*$/.test(textUntilCursor)) {
                return JavaPackageCompletion.providePackageCompletions(wordRange);
            }
            
            // 4. Class instantiation (after 'new')
            if (/new\s+[\w<>]*$/.test(textUntilCursor)) {
                return JavaClassCompletion.provideClassCompletions(wordRange);
            }
            
            // 5. Annotations (after @)
            if (textUntilCursor.endsWith('@') || /^\s*@[\w]*$/.test(textUntilCursor)) {
                return JavaAnnotationCompletion.provideAnnotationCompletions(wordRange);
            }
            
            // 6. Exception handling (catch/throws)
            if (/catch\s*\(\s*[\w]*$/.test(textUntilCursor) || 
                /throws\s+[\w,\s]*$/.test(textUntilCursor)) {
                return JavaExceptionCompletion.provideExceptionCompletions(wordRange);
            }
            
            // 7. Variable/parameter declarations
            if (/^\s*(private|protected|public|static|final)?\s*[\w<>]*$/.test(textUntilCursor) ||
                /[\(,]\s*[\w<>]*$/.test(textUntilCursor)) {
                return JavaTypeCompletion.provideTypeCompletions(wordRange);
            }
            
            // 8. Default completions - keywords, snippets, etc.
            return JavaDefaultCompletion.provideDefaultCompletions(wordRange);
        }
    };
    
    // Initialize on load
    window.initJavaUniversalAutocomplete = function() {
        JavaUniversalAutocomplete.initialize();
    };
    
    // Make available globally
    window.provideUniversalCompletions = JavaUniversalAutocomplete.provideUniversalCompletions;
})();

// Component handlers
var JavaMemberCompletion = {
    provideMemberCompletions: function(model, position, wordRange) {
        // Extract expression before the dot
        const lineContent = model.getLineContent(position.lineNumber);
        const beforeDot = this.getExpressionBeforeDot(lineContent, position.column);
        
        // Get type for the expression if possible
        const expressionType = this.inferTypeForExpression(beforeDot, model);
        
        if (!expressionType) {
            return { suggestions: [] };
        }
        
        // Get members for the type
        return { 
            suggestions: this.getMembersForType(expressionType, wordRange)
        };
    },
    
    getExpressionBeforeDot: function(lineContent, column) {
        const beforeCursor = lineContent.substring(0, column - 2); // exclude the dot
        
        // Find start of expression (handling parentheses and operators)
        let expressionStart = beforeCursor.length;
        let parenDepth = 0;
        
        for (let i = beforeCursor.length - 1; i >= 0; i--) {
            const char = beforeCursor.charAt(i);
            
            if (char === ')') parenDepth++;
            else if (char === '(') {
                parenDepth--;
                if (parenDepth < 0) {
                    expressionStart = i + 1;
                    break;
                }
            }
            else if (parenDepth === 0 && /[^a-zA-Z0-9_.]/.test(char)) {
                expressionStart = i + 1;
                break;
            }
        }
        
        return beforeCursor.substring(expressionStart);
    },
    
    inferTypeForExpression: function(expression, model) {
        // Simplified type inference
        if (expression === 'System.out') return 'PrintStream';
        if (expression === 'System') return 'System';
        
        // Check for common types
        if (expression.match(/^".*"$/) || expression === 'String') return 'String';
        if (expression.match(/^\d+$/) || expression === 'Integer') return 'Integer';
        if (expression.match(/^\d+\.\d+$/) || expression === 'Double') return 'Double';
        if (expression === 'true' || expression === 'false' || expression === 'Boolean') return 'Boolean';
        
        // Try to use the JavaTypeInference module if available
        if (window.JavaTypeInference && window.JavaTypeInference.getExpressionType) {
            const inferredType = window.JavaTypeInference.getExpressionType(expression);
            if (inferredType) return inferredType;
        }
        
        // Fallback to Object
        return 'Object';
    },
    
    getMembersForType: function(type, wordRange) {
        const suggestions = [];
        const typeInfo = window.JavaTypeSystem && window.JavaTypeSystem[type];
        
        if (typeInfo) {
            // Add methods
            if (typeInfo.methods) {
                typeInfo.methods.forEach(method => {
                    suggestions.push({
                        label: method.name,
                        kind: monaco.languages.CompletionItemKind.Method,
                        detail: `${method.returnType} ${method.name}`,
                        insertText: this.getMethodInsertText(method),
                        range: wordRange,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: {
                            value: `**${method.returnType} ${method.name}**\n\n${method.description || ''}`
                        }
                    });
                });
            }
            
            // Add fields
            if (typeInfo.fields) {
                typeInfo.fields.forEach(field => {
                    suggestions.push({
                        label: field.name,
                        kind: monaco.languages.CompletionItemKind.Field,
                        detail: `${field.type} ${field.name}`,
                        insertText: field.name,
                        range: wordRange,
                        documentation: {
                            value: `**${field.type} ${field.name}**\n\n${field.description || ''}`
                        }
                    });
                });
            }
        } else {
            // Fallback for common types if not in JavaTypeSystem
            if (type === 'String') {
                suggestions.push(
                    { label: 'length()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'length()', detail: 'int length()' },
                    { label: 'charAt()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'charAt(${1:index})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'char charAt(int index)' },
                    { label: 'substring()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'substring(${1:beginIndex})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'String substring(int beginIndex)' }
                );
            } else if (type === 'System') {
                suggestions.push(
                    { label: 'out', kind: monaco.languages.CompletionItemKind.Field, insertText: 'out', detail: 'PrintStream out' },
                    { label: 'err', kind: monaco.languages.CompletionItemKind.Field, insertText: 'err', detail: 'PrintStream err' }
                );
            } else if (type === 'PrintStream') {
                suggestions.push(
                    { label: 'println()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'println(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'void println(Object x)' },
                    { label: 'print()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'print(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'void print(Object x)' }
                );
            }
        }
        
        // Add Object methods if empty or as fallback
        if (suggestions.length === 0) {
            suggestions.push(
                { label: 'toString()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'toString()', detail: 'String toString()' },
                { label: 'equals()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'equals(${1:obj})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'boolean equals(Object obj)' },
                { label: 'hashCode()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'hashCode()', detail: 'int hashCode()' },
                { label: 'getClass()', kind: monaco.languages.CompletionItemKind.Method, insertText: 'getClass()', detail: 'Class<?> getClass()' }
            );
        }
        
        return suggestions;
    },
    
    getMethodInsertText: function(method) {
        // Extract method name and parameters
        const methodNameMatch = method.name.match(/^([a-zA-Z0-9_]+)(\(.*\))$/);
        if (!methodNameMatch) return method.name;
        
        const methodName = methodNameMatch[1];
        const paramsSignature = methodNameMatch[2];
        
        if (paramsSignature === '()') return `${methodName}()`;
        
        // Extract parameter names from signature
        const params = paramsSignature.substring(1, paramsSignature.length - 1).split(',');
        const paramNames = params.map((param, idx) => {
            const parts = param.trim().split(' ');
            return parts.length > 1 ? parts[parts.length - 1] : `param${idx + 1}`;
        });
        
        // Create snippet
        return `${methodName}(${paramNames.map((name, i) => `\${${i + 1}:${name}}`).join(', ')})`;
    }
};

var JavaImportCompletion = {
    provideImportCompletions: function(textUntilCursor, wordRange) {
        const importPrefix = textUntilCursor.substring(textUntilCursor.indexOf('import') + 'import'.length).trim();
        
        // Get matching packages from JavaTypeSystem
        const packages = window.JavaTypeSystem && window.JavaTypeSystem.packageHierarchy ? 
            window.JavaTypeSystem.packageHierarchy.filter(pkg => 
                pkg.name.startsWith(importPrefix)
            ) : [];
        
        // Fallback for common packages if none found
        if (packages.length === 0) {
            const commonPackages = [
                { name: 'java.util', description: 'Utility classes and collections' },
                { name: 'java.io', description: 'Input/output operations' },
                { name: 'java.lang', description: 'Core Java classes' },
                { name: 'java.math', description: 'Mathematical operations' },
                { name: 'java.net', description: 'Networking operations' }
            ];
            
            return {
                suggestions: commonPackages
                    .filter(pkg => pkg.name.startsWith(importPrefix))
                    .map(pkg => ({
                        label: pkg.name,
                        kind: monaco.languages.CompletionItemKind.Module,
                        detail: pkg.description,
                        insertText: pkg.name,
                        range: wordRange,
                        documentation: {
                            value: `**${pkg.name}**\n\n${pkg.description}`
                        }
                    }))
            };
        }
        
        return {
            suggestions: packages.map(pkg => ({
                label: pkg.name,
                kind: monaco.languages.CompletionItemKind.Module,
                detail: pkg.description || '',
                insertText: pkg.name,
                range: wordRange,
                documentation: {
                    value: `**${pkg.name}**\n\n${pkg.description || 'Java package'}`
                }
            }))
        };
    }
};

var JavaDefaultCompletion = {
    provideDefaultCompletions: function(wordRange) {
        return {
            suggestions: [
                ...this.getJavaKeywords(wordRange),
                ...this.getJavaPrimitiveTypes(wordRange),
                ...this.getCommonClassSuggestions(wordRange),
                ...this.getJavaSnippets(wordRange)
            ]
        };
    },
    
    getJavaKeywords: function(wordRange) {
        const keywords = [
            { word: 'abstract', description: 'Indicates a class or method that must be implemented by a subclass' },
            { word: 'assert', description: 'Checks if a condition is true' },
            { word: 'break', description: 'Terminates a loop or switch statement' },
            { word: 'case', description: 'A branch in a switch statement' },
            { word: 'catch', description: 'Catches exceptions generated by try statements' },
            { word: 'class', description: 'Declares a class' },
            { word: 'const', description: 'Reserved but not used' },
            { word: 'continue', description: 'Skips to the next iteration of a loop' },
            { word: 'default', description: 'Default branch in a switch statement' },
            { word: 'do', description: 'Starts a do-while loop' },
            { word: 'else', description: 'Alternative branch in an if statement' },
            { word: 'enum', description: 'Declares an enumerated type' },
            { word: 'extends', description: 'Indicates a class inherits from another class' },
            { word: 'final', description: 'Indicates a value cannot be changed or a method cannot be overridden' },
            { word: 'finally', description: 'Block of code executed after try-catch blocks regardless of flow' },
            { word: 'for', description: 'Starts a for loop' },
            { word: 'if', description: 'Starts a conditional statement' },
            { word: 'implements', description: 'Indicates a class implements an interface' },
            { word: 'import', description: 'Imports a package or class' },
            { word: 'instanceof', description: 'Tests if an object is an instance of a class' },
            { word: 'interface', description: 'Declares an interface' },
            { word: 'native', description: 'Indicates a method is implemented in native code' },
            { word: 'new', description: 'Creates a new object' },
            { word: 'package', description: 'Declares a package' },
            { word: 'private', description: 'Access modifier that makes an element accessible only in its class' },
            { word: 'protected', description: 'Access modifier that makes an element accessible in the same package and subclasses' },
            { word: 'public', description: 'Access modifier that makes an element accessible from any class' },
            { word: 'return', description: 'Returns a value from a method' },
            { word: 'static', description: 'Makes an element a class member rather than instance member' },
            { word: 'super', description: 'Refers to the parent class' },
            { word: 'switch', description: 'Multiple branch statement' },
            { word: 'synchronized', description: 'Controls access to code by multiple threads' },
            { word: 'this', description: 'Refers to the current object' },
            { word: 'throw', description: 'Throws an exception' },
            { word: 'throws', description: 'Declares exceptions a method might throw' },
            { word: 'transient', description: 'Indicates a field should not be serialized' },
            { word: 'try', description: 'Starts a block of code that might throw exceptions' },
            { word: 'void', description: 'Indicates a method returns no value' },
            { word: 'volatile', description: 'Indicates a variable may change asynchronously' },
            { word: 'while', description: 'Starts a while loop' }
        ];
        
        return keywords.map(kw => ({
            label: kw.word,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: kw.word,
            insertText: kw.word,
            range: wordRange,
            documentation: {
                value: `**${kw.word}**\n\n${kw.description}`
            }
        }));
    },
    
    getJavaPrimitiveTypes: function(wordRange) {
        const primitiveTypes = [
            { name: 'boolean', description: 'Represents true or false values' },
            { name: 'byte', description: '8-bit signed integer, from -128 to 127' },
            { name: 'char', description: '16-bit Unicode character' },
            { name: 'double', description: '64-bit floating point number' },
            { name: 'float', description: '32-bit floating point number' },
            { name: 'int', description: '32-bit signed integer' },
            { name: 'long', description: '64-bit signed integer' },
            { name: 'short', description: '16-bit signed integer, from -32,768 to 32,767' }
        ];
        
        return primitiveTypes.map(type => ({
            label: type.name,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: `primitive ${type.name}`,
            insertText: type.name,
            range: wordRange,
            documentation: {
                value: `**${type.name}**\n\n${type.description}`
            }
        }));
    },
    
    getCommonClassSuggestions: function(wordRange) {
        const commonClasses = [
            { name: 'String', description: 'Represents character strings' },
            { name: 'Integer', description: 'Wrapper class for int values' },
            { name: 'Boolean', description: 'Wrapper class for boolean values' },
            { name: 'Double', description: 'Wrapper class for double values' },
            { name: 'Object', description: 'The root of the class hierarchy' },
            { name: 'System', description: 'Provides system-related functionality' },
            { name: 'ArrayList', description: 'Resizable-array implementation of the List interface' },
            { name: 'HashMap', description: 'Hash table implementation of the Map interface' },
            { name: 'List', description: 'An ordered collection' },
            { name: 'Map', description: 'Maps keys to values' },
            { name: 'Set', description: 'A collection that contains no duplicate elements' },
            { name: 'Exception', description: 'The superclass of all exceptions' },
            { name: 'Runtime', description: 'Provides access to the Java runtime system' },
            { name: 'Math', description: 'Contains methods for performing basic numeric operations' },
            { name: 'StringBuilder', description: 'A mutable sequence of characters' },
            { name: 'File', description: 'Represents a file or directory path' }
        ];
        
        return commonClasses.map(cls => ({
            label: cls.name,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: `class ${cls.name}`,
            insertText: cls.name,
            range: wordRange,
            documentation: {
                value: `**${cls.name}**\n\n${cls.description}`
            }
        }));
    },
    
    getJavaSnippets: function(wordRange) {
        const snippets = [
            {
                label: 'main',
                detail: 'public static void main method',
                insertText: 'public static void main(String[] args) {\n\t${0}\n}',
                documentation: 'Creates a main method'
            },
            {
                label: 'sout',
                detail: 'System.out.println',
                insertText: 'System.out.println(${0});',
                documentation: 'Prints to the standard output'
            },
            {
                label: 'fori',
                detail: 'for loop with index',
                insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:max}; ${1:i}++) {\n\t${0}\n}',
                documentation: 'Creates a for loop with index'
            },
            {
                label: 'foreach',
                detail: 'for-each loop',
                insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t${0}\n}',
                documentation: 'Creates a for-each loop'
            },
            {
                label: 'if',
                detail: 'if statement',
                insertText: 'if (${1:condition}) {\n\t${0}\n}',
                documentation: 'Creates an if statement'
            },
            {
                label: 'ifelse',
                detail: 'if/else statement',
                insertText: 'if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}',
                documentation: 'Creates an if/else statement'
            },
            {
                label: 'try',
                detail: 'try/catch block',
                insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${0}\n}',
                documentation: 'Creates a try/catch block'
            },
            {
                label: 'class',
                detail: 'Class definition',
                insertText: 'public class ${1:ClassName} {\n\t${0}\n}',
                documentation: 'Creates a new class definition'
            }
        ];
        
        return snippets.map(snippet => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: snippet.detail,
            insertText: snippet.insertText,
            range: wordRange,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: {
                value: `**${snippet.label}**\n\n${snippet.documentation}`
            }
        }));
    }
};

// Define stubs for other completers (will be implemented in separate files)
var JavaPackageCompletion = {
    providePackageCompletions: function(wordRange) {
        return { suggestions: [] };
    }
};

var JavaClassCompletion = {
    provideClassCompletions: function(wordRange) {
        return { suggestions: [] };
    }
};

var JavaAnnotationCompletion = {
    provideAnnotationCompletions: function(wordRange) {
        return { suggestions: [] };
    }
};

var JavaExceptionCompletion = {
    provideExceptionCompletions: function(wordRange) {
        return { suggestions: [] };
    }
};

var JavaTypeCompletion = {
    provideTypeCompletions: function(wordRange) {
        return { suggestions: [] };
    }
};
