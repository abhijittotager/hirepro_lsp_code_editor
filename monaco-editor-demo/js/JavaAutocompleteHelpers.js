/**
 * JavaAutocompleteHelpers.js
 * Helper functions for Java autocomplete functionality
 */

(function() {
    'use strict';

    window.JavaAutocompleteHelpers = {
        /**
         * Checks if cursor is in method parameters
         */
        isInMethodParams: function(textUntilPosition) {
            // Check for unclosed parentheses that might indicate method parameters
            const openParenCount = (textUntilPosition.match(/\(/g) || []).length;
            const closeParenCount = (textUntilPosition.match(/\)/g) || []).length;
            
            if (openParenCount > closeParenCount) {
                // Look for method declaration pattern before the open paren
                const methodDeclRegex = /\b[A-Za-z_][A-Za-z0-9_]*\s*\(\s*([^)]*)\s*$/;
                return methodDeclRegex.test(textUntilPosition);
            }
            
            return false;
        },
        
        /**
         * Checks if cursor might be in a variable declaration
         */
        isPossibleVariableDeclaration: function(textUntilPosition) {
            // Look for patterns that might indicate variable declarations
            // 1. At the beginning of a line (possible field/variable)
            // 2. After semicolon (new statement)
            // 3. Inside method parameters
            // 4. Inside for loop initialization
            
            // Remove any leading whitespace
            const trimmedText = textUntilPosition.trim();
            
            // Check for variable patterns
            return (
                // New line or after semicolon
                /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText) ||
                /;\s*[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText) ||
                // Inside parentheses
                /\(\s*[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText) ||
                /,\s*[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText) ||
                // After modifier keywords
                /\b(public|private|protected|static|final|transient|volatile)\s+[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText)
            );
        },
        
        /**
         * Checks if cursor might be in a method return type position
         */
        isPossibleMethodReturnType: function(textUntilPosition) {
            // Look for patterns that indicate we're defining a method
            const trimmedText = textUntilPosition.trim();
            
            // Method declarations often start with modifiers followed by the return type
            return (
                /\b(public|private|protected|static|final|abstract|synchronized)\s+[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText) ||
                // Generic return type might end with angle bracket
                /\b(public|private|protected|static|final|abstract|synchronized)\s+[A-Za-z_][A-Za-z0-9_]*<.*>$/.test(trimmedText) ||
                // Check for class/interface methods
                /\{\s*[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedText)
            );
        },
        
        /**
         * Checks if cursor is inside a JavaDoc comment
         */
        isInJavaDocComment: function(model, position) {
            // Calculate starting line for search (don't go back too far)
            const startLine = Math.max(1, position.lineNumber - 10);
            
            // Get content for checking
            let commentStart = false;
            let commentEnd = false;
            
            for (let i = position.lineNumber; i >= startLine; i--) {
                const lineContent = model.getLineContent(i);
                
                // Check if we found the end of a comment before current position
                if (i === position.lineNumber) {
                    const lineToCursor = lineContent.substring(0, position.column - 1);
                    if (lineToCursor.includes("*/")) {
                        commentEnd = true;
                        break;
                    }
                } else if (lineContent.includes("*/")) {
                    commentEnd = true;
                    break;
                }
                
                // Check if we found the start of a comment
                if (lineContent.includes("/**")) {
                    commentStart = true;
                    break;
                }
            }
            
            // We're in a JavaDoc if we found a comment start but no end
            return commentStart && !commentEnd;
        },
        
        /**
         * Checks if cursor is inside a string literal
         */
        isInStringLiteral: function(lineContent, column) {
            let inString = false;
            let escape = false;
            
            // Scan the line up to the cursor position
            for (let i = 0; i < column - 1; i++) {
                const char = lineContent.charAt(i);
                
                if (char === '\\') {
                    escape = !escape;
                } else {
                    if (char === '"' && !escape) {
                        inString = !inString;
                    }
                    escape = false;
                }
            }
            
            return inString;
        },
        
        /**
         * Get Java primitive types
         */
        getJavaPrimitiveTypes: function() {
            const primitiveTypes = [
                { name: 'boolean', description: 'Represents true or false values' },
                { name: 'byte', description: '8-bit signed integer, from -128 to 127' },
                { name: 'char', description: '16-bit Unicode character' },
                { name: 'double', description: '64-bit floating point number' },
                { name: 'float', description: '32-bit floating point number' },
                { name: 'int', description: '32-bit signed integer' },
                { name: 'long', description: '64-bit signed integer' },
                { name: 'short', description: '16-bit signed integer, from -32,768 to 32,767' },
                { name: 'void', description: 'Indicates no value is returned' }
            ];
            
            return primitiveTypes.map(type => ({
                label: type.name,
                kind: monaco.languages.CompletionItemKind.Keyword,
                detail: `primitive ${type.name}`,
                insertText: type.name,
                documentation: {
                    value: `**${type.name}**\n\n${type.description}`
                },
                sortText: `0_${type.name}`
            }));
        },
        
        /**
         * Get common Java classes for import/type completion
         */
        getCommonJavaClasses: function() {
            // Extract common classes from the type system
            const commonClassNames = Object.keys(JavaTypeSystem)
                .filter(key => typeof JavaTypeSystem[key] === 'object' && key !== 'packageHierarchy');
                
            return commonClassNames.map(className => ({
                label: className,
                kind: monaco.languages.CompletionItemKind.Class,
                detail: `class ${className}`,
                insertText: className,
                documentation: {
                    value: `**${className}**\n\n${JavaTypeSystem[className].description || 'Java class'}`
                },
                sortText: `1_${className}`
            }));
        },
        
        /**
         * Get Java exception classes
         */
        getExceptionClasses: function() {
            return [
                { name: 'Exception', description: 'The base class for checked exceptions' },
                { name: 'RuntimeException', description: 'The base class for unchecked exceptions' },
                { name: 'IOException', description: 'Signals that an I/O exception has occurred' },
                { name: 'FileNotFoundException', description: 'Signals that an attempt to open a file has failed' },
                { name: 'SQLException', description: 'Exception thrown when accessing a database' },
                { name: 'ClassNotFoundException', description: 'Thrown when an application tries to load a class through its string name but no definition for the class can be found' },
                { name: 'NullPointerException', description: 'Thrown when an application attempts to use null where an object is required' },
                { name: 'ArrayIndexOutOfBoundsException', description: 'Thrown to indicate that an array has been accessed with an illegal index' },
                { name: 'IllegalArgumentException', description: 'Thrown to indicate that a method has been passed an illegal or inappropriate argument' },
                { name: 'ArithmeticException', description: 'Thrown when an exceptional arithmetic condition has occurred' },
                { name: 'SecurityException', description: 'Thrown by the security manager to indicate a security violation' },
                { name: 'InterruptedException', description: 'Thrown when a thread is interrupted' },
                { name: 'NoSuchMethodException', description: 'Thrown when a particular method cannot be found' },
                { name: 'NumberFormatException', description: 'Thrown when an attempt to convert a string to one of the numeric types fails' }
            ];
        },
        
        /**
         * Get instantiable Java types
         */
        getAllInstantiableTypes: function() {
            // Filter to only include classes that can be instantiated (not interfaces or abstract)
            const instantiableClasses = Object.keys(JavaTypeSystem)
                .filter(key => 
                    typeof JavaTypeSystem[key] === 'object' && 
                    key !== 'packageHierarchy' &&
                    !JavaTypeSystem[key].isInterface &&
                    !JavaTypeSystem[key].isAbstract
                )
                .map(key => ({
                    name: key,
                    hasConstructor: JavaTypeSystem[key].constructors && JavaTypeSystem[key].constructors.length > 0,
                    constructors: JavaTypeSystem[key].constructors || []
                }));
                
            return instantiableClasses;
        },
        
        /**
         * Get Java code snippets
         */
        getJavaSnippets: function() {
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
                    label: 'class',
                    detail: 'Class definition',
                    insertText: 'public class ${1:ClassName} {\n\t${0}\n}',
                    documentation: 'Creates a new class definition'
                },
                {
                    label: 'interface',
                    detail: 'Interface definition',
                    insertText: 'public interface ${1:InterfaceName} {\n\t${0}\n}',
                    documentation: 'Creates a new interface definition'
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
                    label: 'trycf',
                    detail: 'try/catch/finally block',
                    insertText: 'try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${4}\n} finally {\n\t${0}\n}',
                    documentation: 'Creates a try/catch/finally block'
                },
                {
                    label: 'method',
                    detail: 'method definition',
                    insertText: 'public ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
                    documentation: 'Creates a method'
                },
                {
                    label: 'switch',
                    detail: 'switch statement',
                    insertText: 'switch (${1:key}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${0}\n\t\tbreak;\n}',
                    documentation: 'Creates a switch statement'
                }
            ];
            
            return snippets.map(snippet => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                detail: snippet.detail,
                insertText: snippet.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: {
                    value: `**${snippet.label}**\n\n${snippet.documentation}`
                },
                sortText: `5_${snippet.label}` // Snippets should appear below keywords but above other items
            }));
        }
    };
    
    // Export functions to global scope for use by the ComprehensiveJavaIntelliSense.js
    window.isInMethodParams = JavaAutocompleteHelpers.isInMethodParams;
    window.isPossibleVariableDeclaration = JavaAutocompleteHelpers.isPossibleVariableDeclaration;
    window.isPossibleMethodReturnType = JavaAutocompleteHelpers.isPossibleMethodReturnType;
    window.isInJavaDocComment = JavaAutocompleteHelpers.isInJavaDocComment;
    window.isInStringLiteral = JavaAutocompleteHelpers.isInStringLiteral;
    window.getJavaPrimitiveTypes = JavaAutocompleteHelpers.getJavaPrimitiveTypes;
    window.getCommonJavaClasses = JavaAutocompleteHelpers.getCommonJavaClasses;
    window.getExceptionClasses = JavaAutocompleteHelpers.getExceptionClasses;
    window.getAllInstantiableTypes = JavaAutocompleteHelpers.getAllInstantiableTypes;
    window.getJavaSnippets = JavaAutocompleteHelpers.getJavaSnippets;
})();
