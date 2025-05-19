/**
 * JavaAutocompleteHandlers.js
 * Provides handlers for different autocomplete scenarios in Java
 */

(function() {
    'use strict';

    window.JavaAutocompleteHandlers = {
        /**
         * Handles autocomplete after a dot (member access)
         */
        handleDotCompletion: function(model, position, lineContent) {
            const beforeDot = getExpressionBeforeDot(model, position);
            const expressionType = JavaTypeInference.getExpressionType(beforeDot);
            
            if (!expressionType) {
                return { suggestions: [] };
            }
            
            return {
                suggestions: getCompletionsForType(expressionType)
            };
        },
        
        /**
         * Handles autocomplete for import statements
         */
        handleImportCompletion: function(model, position, lineContent) {
            const importText = lineContent.substring(0, position.column - 1).trim();
            const importPrefix = importText.substring('import '.length).trim();
            
            // Get matching packages
            const packages = JavaTypeSystem.packageHierarchy.filter(pkg => 
                pkg.name.startsWith(importPrefix)
            );
            
            return {
                suggestions: packages.map(pkg => ({
                    label: pkg.name,
                    kind: monaco.languages.CompletionItemKind.Module,
                    detail: pkg.description || '',
                    insertText: pkg.name,
                    sortText: `0_${pkg.name}`,
                    documentation: {
                        value: `**${pkg.name}**\n\n${pkg.description || 'Java package'}`
                    }
                }))
            };
        },
        
        /**
         * Handles autocomplete after 'new' keyword
         */
        handleNewCompletion: function(wordRange) {
            const instantiableTypes = getAllInstantiableTypes();
            
            return {
                suggestions: instantiableTypes.map(type => ({
                    label: type.name,
                    kind: monaco.languages.CompletionItemKind.Class,
                    detail: `class ${type.name}`,
                    insertText: getConstructorSnippet(type),
                    range: wordRange,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: {
                        value: getTypeDocumentation(type)
                    }
                }))
            };
        },
        
        /**
         * Handles autocomplete for package declaration
         */
        handlePackageCompletion: function(wordRange) {
            // Get common Java package names
            const commonPackages = JavaTypeSystem.packageHierarchy.filter(pkg => 
                !pkg.name.includes('.') || pkg.name.split('.').length <= 2
            );
            
            return {
                suggestions: commonPackages.map(pkg => ({
                    label: pkg.name,
                    kind: monaco.languages.CompletionItemKind.Module,
                    detail: pkg.description || '',
                    insertText: pkg.name + ';',
                    range: wordRange,
                    documentation: {
                        value: `**${pkg.name}**\n\n${pkg.description || 'Java package'}`
                    }
                }))
            };
        },
        
        /**
         * Handles autocomplete for Java annotations
         */
        handleAnnotationCompletion: function(wordRange) {
            const commonAnnotations = [
                { name: 'Override', description: 'Indicates that a method declaration is intended to override a method declaration in a supertype.' },
                { name: 'Deprecated', description: 'Indicates that the marked element is deprecated and should no longer be used.' },
                { name: 'SuppressWarnings', description: 'Indicates that the named compiler warnings should be suppressed.' },
                { name: 'FunctionalInterface', description: 'Indicates that an interface type declaration is intended to be a functional interface.' },
                { name: 'SafeVarargs', description: 'Suppresses unchecked warnings related to varargs.' },
                { name: 'Documented', description: 'Indicates that annotations with this type should be documented by javadoc tools.' },
                { name: 'Retention', description: 'Indicates how long annotations with this type are to be retained.' },
                { name: 'Target', description: 'Indicates the kinds of program element to which an annotation type is applicable.' }
            ];
            
            return {
                suggestions: commonAnnotations.map(annotation => ({
                    label: annotation.name,
                    kind: monaco.languages.CompletionItemKind.Interface,
                    detail: `@${annotation.name}`,
                    insertText: getAnnotationSnippet(annotation),
                    range: wordRange,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: {
                        value: `**@${annotation.name}**\n\n${annotation.description}`
                    }
                }))
            };
        },
        
        /**
         * Handles autocomplete for exceptions in catch/throws
         */
        handleExceptionCompletion: function(wordRange) {
            const exceptionClasses = getExceptionClasses();
            
            return {
                suggestions: exceptionClasses.map(exception => ({
                    label: exception.name,
                    kind: monaco.languages.CompletionItemKind.Class,
                    detail: `class ${exception.name}`,
                    insertText: exception.name,
                    range: wordRange,
                    documentation: {
                        value: getExceptionDocumentation(exception)
                    }
                }))
            };
        },
        
        /**
         * Handles default completions (keywords, basic types, etc.)
         */
        handleDefaultCompletions: function() {
            // Java keywords
            const keywords = getJavaKeywords();
            
            // Java primitive types
            const primitiveTypes = getJavaPrimitiveTypes();
            
            // Java common classes
            const commonClasses = getCommonJavaClasses();
            
            // Combine all suggestions
            return {
                suggestions: [
                    ...keywords,
                    ...primitiveTypes,
                    ...commonClasses,
                    ...getJavaSnippets()
                ]
            };
        }
    };
    
    // Export to global scope
    window.handleDotCompletion = JavaAutocompleteHandlers.handleDotCompletion;
    window.handleImportCompletion = JavaAutocompleteHandlers.handleImportCompletion;
    window.handleNewCompletion = JavaAutocompleteHandlers.handleNewCompletion;
    window.handlePackageCompletion = JavaAutocompleteHandlers.handlePackageCompletion;
    window.handleAnnotationCompletion = JavaAutocompleteHandlers.handleAnnotationCompletion;
    window.handleExceptionCompletion = JavaAutocompleteHandlers.handleExceptionCompletion;
    window.handleDefaultCompletions = JavaAutocompleteHandlers.handleDefaultCompletions;
    
    /**
     * Helper function to get expression before the dot
     */
    function getExpressionBeforeDot(model, position) {
        const lineContent = model.getLineContent(position.lineNumber);
        const beforeCursor = lineContent.substring(0, position.column - 2); // exclude the dot
        
        // Find the start of the expression (handle nested expressions)
        let expressionStart = beforeCursor.length;
        let parenCount = 0;
        
        for (let i = beforeCursor.length - 1; i >= 0; i--) {
            const char = beforeCursor.charAt(i);
            
            if (char === ')') parenCount++;
            else if (char === '(') {
                parenCount--;
                if (parenCount < 0) {
                    expressionStart = i + 1;
                    break;
                }
            }
            else if (parenCount === 0 && /[^a-zA-Z0-9_.]/.test(char)) {
                expressionStart = i + 1;
                break;
            }
        }
        
        return beforeCursor.substring(expressionStart);
    }
    
    /**
     * Get completions for a specific type
     */
    function getCompletionsForType(typeName) {
        const typeInfo = JavaTypeSystem[typeName];
        
        if (!typeInfo) {
            return [];
        }
        
        const suggestions = [];
        
        // Add methods
        if (typeInfo.methods) {
            typeInfo.methods.forEach(method => {
                suggestions.push({
                    label: method.name,
                    kind: monaco.languages.CompletionItemKind.Method,
                    detail: `${method.returnType} ${method.name}`,
                    insertText: getMethodInsertText(method),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: {
                        value: `**${method.returnType} ${method.name}**\n\n${method.description || ''}`
                    },
                    sortText: `2_${method.name}`
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
                    documentation: {
                        value: `**${field.type} ${field.name}**\n\n${field.description || ''}`
                    },
                    sortText: `1_${field.name}`
                });
            });
        }
        
        return suggestions;
    }
    
    /**
     * Helper to get method insert text with parameters
     */
    function getMethodInsertText(method) {
        // Parse method signature to extract parameters
        const methodNameMatch = method.name.match(/^([a-zA-Z0-9_]+)(\(.*\))$/);
        
        if (!methodNameMatch) {
            return method.name;
        }
        
        const methodName = methodNameMatch[1];
        const paramsSignature = methodNameMatch[2];
        
        // Handle no parameters case
        if (paramsSignature === '()') {
            return `${methodName}()`;
        }
        
        // Extract parameter names from signature
        const params = paramsSignature.substring(1, paramsSignature.length - 1).split(',');
        const paramNames = params.map((param, index) => {
            const paramParts = param.trim().split(' ');
            return paramParts.length > 1 ? paramParts[paramParts.length - 1] : `param${index + 1}`;
        });
        
        // Create snippet with tabstops
        return `${methodName}(${paramNames.map((name, i) => `\${${i + 1}:${name}}`).join(', ')})`;
    }

    /**
     * Get Java keywords with descriptions
     */
    function getJavaKeywords() {
        const keywords = [
            { word: 'abstract', description: 'Indicates a class or method that must be implemented by a subclass' },
            { word: 'assert', description: 'Checks if a condition is true' },
            { word: 'boolean', description: 'Primitive data type with true or false values' },
            { word: 'break', description: 'Terminates a loop or switch statement' },
            { word: 'byte', description: 'Primitive data type (8-bit integer)' },
            { word: 'case', description: 'A branch in a switch statement' },
            { word: 'catch', description: 'Catches exceptions generated by try statements' },
            { word: 'char', description: 'Primitive data type for Unicode characters' },
            { word: 'class', description: 'Declares a class' },
            { word: 'const', description: 'Reserved but not used' },
            { word: 'continue', description: 'Skips to the next iteration of a loop' },
            { word: 'default', description: 'Default branch in a switch statement' },
            { word: 'do', description: 'Starts a do-while loop' },
            { word: 'double', description: 'Primitive data type (64-bit floating point)' },
            { word: 'else', description: 'Alternative branch in an if statement' },
            { word: 'enum', description: 'Declares an enumerated type' },
            { word: 'extends', description: 'Indicates a class inherits from another class' },
            { word: 'final', description: 'Indicates a value cannot be changed or a method cannot be overridden' },
            { word: 'finally', description: 'Block of code executed after try-catch blocks regardless of flow' },
            { word: 'float', description: 'Primitive data type (32-bit floating point)' },
            { word: 'for', description: 'Starts a for loop' },
            { word: 'goto', description: 'Reserved but not used' },
            { word: 'if', description: 'Starts a conditional statement' },
            { word: 'implements', description: 'Indicates a class implements an interface' },
            { word: 'import', description: 'Imports a package or class' },
            { word: 'instanceof', description: 'Tests if an object is an instance of a class' },
            { word: 'int', description: 'Primitive data type (32-bit integer)' },
            { word: 'interface', description: 'Declares an interface' },
            { word: 'long', description: 'Primitive data type (64-bit integer)' },
            { word: 'native', description: 'Indicates a method is implemented in native code' },
            { word: 'new', description: 'Creates a new object' },
            { word: 'package', description: 'Declares a package' },
            { word: 'private', description: 'Access modifier that makes an element accessible only in its class' },
            { word: 'protected', description: 'Access modifier that makes an element accessible in the same package and subclasses' },
            { word: 'public', description: 'Access modifier that makes an element accessible from any class' },
            { word: 'return', description: 'Returns a value from a method' },
            { word: 'short', description: 'Primitive data type (16-bit integer)' },
            { word: 'static', description: 'Makes an element a class member rather than instance member' },
            { word: 'strictfp', description: 'Ensures floating point calculations are consistent on all platforms' },
            { word: 'super', description: 'Refers to the parent class' },
            { word: 'switch', description: 'Multiple branch statement' },
            { word: 'synchronized', description: 'Controls access to code by multiple threads' },
            { word: 'this', description: 'Refers to the current object' },
            { word: 'throw', description: 'Throws an exception' },
            { word: 'throws', description: 'Declares exceptions a method might throw' },
            { word: 'transient', description: 'Indicates a field should not be serialized' },
            { word: 'try', description: 'Starts a block of code that might throw exceptions' },
            { word: 'void', description: 'Indicates a method returns no value' },
            { word: 'volatile', description: 'Indicates a variable's value might change asynchronously' },
            { word: 'while', description: 'Starts a while loop' }
        ];
        
        return keywords.map(kw => ({
            label: kw.word,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: kw.word,
            insertText: kw.word,
            documentation: {
                value: `**${kw.word}**\n\n${kw.description}`
            }
        }));
    }
})();

    /**
     * Get Java keywords with descriptions
     */
    function getJavaKeywords() {
            { word: 'do', description: 'Starts a do-while loop' },
            { word: 'double', description: 'Primitive data type (64-bit floating point)' },
            { word: 'else', description: 'Alternative branch in an if statement' },
            { word: 'enum', description: 'Declares an enumerated type' },
            { word: 'extends', description: 'Indicates a class inherits from another class' },
            { word: 'final', description: 'Indicates a value cannot be changed or a method cannot be overridden' },
            { word: 'finally', description: 'Block of code executed after try-catch blocks regardless of flow' },
            { word: 'float', description: 'Primitive data type (32-bit floating point)' },
            { word: 'for', description: 'Starts a for loop' },
            { word: 'goto', description: 'Reserved but not used' },
            { word: 'if', description: 'Starts a conditional statement' },
            { word: 'implements', description: 'Indicates a class implements an interface' },
            { word: 'import', description: 'Imports a package or class' },
            { word: 'instanceof', description: 'Tests if an object is an instance of a class' },
            { word: 'int', description: 'Primitive data type (32-bit integer)' },
            { word: 'interface', description: 'Declares an interface' },
            { word: 'long', description: 'Primitive data type (64-bit integer)' },
            { word: 'native', description: 'Indicates a method is implemented in native code' },
            { word: 'new', description: 'Creates a new object' },
            { word: 'package', description: 'Declares a package' },
            { word: 'private', description: 'Access modifier that makes an element accessible only in its class' },
            { word: 'protected', description: 'Access modifier that makes an element accessible in the same package and subclasses' },
            { word: 'public', description: 'Access modifier that makes an element accessible from any class' },
            { word: 'return', description: 'Returns a value from a method' },
            { word: 'short', description: 'Primitive data type (16-bit integer)' },
            { word: 'static', description: 'Makes an element a class member rather than instance member' },
            { word: 'strictfp', description: 'Ensures floating point calculations are consistent on all platforms' },
            { word: 'super', description: 'Refers to the parent class' },
            { word: 'switch', description: 'Multiple branch statement' },
            { word: 'synchronized', description: 'Controls access to code by multiple threads' },
            { word: 'this', description: 'Refers to the current object' },
            { word: 'throw', description: 'Throws an exception' },
            { word: 'throws', description: 'Declares exceptions a method might throw' },
            { word: 'transient', description: 'Indicates a field should not be serialized' },
            { word: 'try', description: 'Starts a block of code that might throw exceptions' },
            { word: 'void', description: 'Indicates a method returns no value' },
            { word: 'volatile', description: 'Indicates a variable's value might change asynchronously' },
            { word: 'while', description: 'Starts a while loop' }
        ];
        
        return keywords.map(kw => ({
            label: kw.word,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: kw.word,
            insertText: kw.word,
            documentation: {
                value: `**${kw.word}**\n\n${kw.description}`
            }
        }));
    }
})();
