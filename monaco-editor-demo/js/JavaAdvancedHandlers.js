/**
 * JavaAdvancedHandlers.js
 * Provides additional handlers for advanced autocomplete scenarios in Java
 */

(function() {
    'use strict';

    window.JavaAdvancedHandlers = {
        /**
         * Handles parameter completion inside method calls
         */
        handleParameterCompletion: function(model, position, textUntilPosition, wordRange) {
            // Analyze context to determine what type of parameters are expected
            const variableCompletions = JavaTypeInference.getScopeVariables().map(variable => ({
                label: variable.name,
                kind: monaco.languages.CompletionItemKind.Variable,
                detail: `${variable.type} ${variable.name}`,
                insertText: variable.name,
                range: wordRange,
                documentation: {
                    value: `**${variable.type} ${variable.name}**\n\n${variable.description || ''}`
                }
            }));
            
            // Add literal completions (common literal values)
            const literalCompletions = [
                { label: 'true', detail: 'boolean literal', insertText: 'true' },
                { label: 'false', detail: 'boolean literal', insertText: 'false' },
                { label: 'null', detail: 'null reference', insertText: 'null' },
                { label: '0', detail: 'integer literal', insertText: '0' },
                { label: '1', detail: 'integer literal', insertText: '1' },
                { label: '"..."', detail: 'string literal', insertText: '"${1:text}"' },
                { label: 'new', detail: 'object creation', insertText: 'new ' }
            ].map(literal => ({
                label: literal.label,
                kind: monaco.languages.CompletionItemKind.Value,
                detail: literal.detail,
                insertText: literal.insertText,
                range: wordRange,
                insertTextRules: literal.insertText.includes('$') ? 
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                documentation: {
                    value: `**${literal.label}**\n\n${literal.detail}`
                }
            }));
            
            return {
                suggestions: [
                    ...variableCompletions,
                    ...literalCompletions
                ]
            };
        },
        
        /**
         * Handles type completion (for variable types, return types, etc.)
         */
        handleTypeCompletion: function(wordRange, preferClassesInterfaces) {
            // Get primitive types
            const primitiveTypes = preferClassesInterfaces ? [] : getJavaPrimitiveTypes();
            
            // Get all available types from JavaTypeSystem
            const allTypes = Object.keys(JavaTypeSystem)
                .filter(key => typeof JavaTypeSystem[key] === 'object' && key !== 'packageHierarchy')
                .map(key => {
                    const isClass = !JavaTypeSystem[key].isInterface;
                    const isInterface = !!JavaTypeSystem[key].isInterface;
                    
                    return {
                        name: key,
                        kind: isInterface ? monaco.languages.CompletionItemKind.Interface : 
                              monaco.languages.CompletionItemKind.Class,
                        detail: isInterface ? `interface ${key}` : `class ${key}`,
                        documentation: JavaTypeSystem[key].description || '',
                        sortText: preferClassesInterfaces ? 
                            (isClass ? `1_${key}` : `2_${key}`) : 
                            `3_${key}`
                    };
                })
                .filter(type => !preferClassesInterfaces || 
                    (type.kind === monaco.languages.CompletionItemKind.Class || 
                     type.kind === monaco.languages.CompletionItemKind.Interface));
            
            // Create completion items
            const typeCompletions = allTypes.map(type => ({
                label: type.name,
                kind: type.kind,
                detail: type.detail,
                insertText: type.name,
                range: wordRange,
                documentation: {
                    value: `**${type.name}**\n\n${type.documentation}`
                },
                sortText: type.sortText
            }));
            
            // Add generic collection types with type parameters
            const genericTypes = [
                { name: 'List<${1:Type}>', base: 'List', description: 'An ordered collection' },
                { name: 'ArrayList<${1:Type}>', base: 'ArrayList', description: 'Resizable-array implementation of the List interface' },
                { name: 'Set<${1:Type}>', base: 'Set', description: 'A collection that contains no duplicate elements' },
                { name: 'HashSet<${1:Type}>', base: 'HashSet', description: 'Hash table implementation of the Set interface' },
                { name: 'Map<${1:KeyType}, ${2:ValueType}>', base: 'Map', description: 'An object that maps keys to values' },
                { name: 'HashMap<${1:KeyType}, ${2:ValueType}>', base: 'HashMap', description: 'Hash table implementation of the Map interface' }
            ].map(generic => ({
                label: generic.base + '<...>',
                kind: monaco.languages.CompletionItemKind.Class,
                detail: `generic ${generic.base}`,
                insertText: generic.name,
                range: wordRange,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: {
                    value: `**${generic.base}**\n\n${generic.description}`
                },
                sortText: preferClassesInterfaces ? `1_${generic.base}` : `3_${generic.base}`
            }));
            
            return {
                suggestions: [
                    ...primitiveTypes,
                    ...typeCompletions,
                    ...genericTypes
                ]
            };
        },
        
        /**
         * Handles completions for variable declarations
         */
        handleVariableDeclarationCompletion: function(model, position, wordRange) {
            return this.handleTypeCompletion(wordRange, false);
        },
        
        /**
         * Handles completions inside JavaDoc comments
         */
        handleJavaDocCompletion: function(textUntilPosition, wordRange) {
            // JavaDoc tags
            const javadocTags = [
                { tag: '@param', description: 'Documents a method parameter', snippet: '@param ${1:paramName} ${0:description}' },
                { tag: '@return', description: 'Documents the return value', snippet: '@return ${0:description}' },
                { tag: '@throws', description: 'Documents an exception thrown by a method', snippet: '@throws ${1:ExceptionType} ${0:description}' },
                { tag: '@exception', description: 'Same as @throws', snippet: '@exception ${1:ExceptionType} ${0:description}' },
                { tag: '@see', description: 'Provides a reference to another element of the documentation', snippet: '@see ${0:reference}' },
                { tag: '@since', description: 'Specifies when this functionality was added', snippet: '@since ${0:version}' },
                { tag: '@deprecated', description: 'Marks this API as deprecated', snippet: '@deprecated ${0:explanation}' },
                { tag: '@author', description: 'Documents the author of the code', snippet: '@author ${0:name}' },
                { tag: '@version', description: 'Documents the version of the code', snippet: '@version ${0:version}' },
                { tag: '{@code}', description: 'Displays text in code font without interpreting the text as HTML', snippet: '{@code ${0:text}}' },
                { tag: '{@link}', description: 'Inserts an in-line link to another element of the documentation', snippet: '{@link ${0:reference}}' }
            ];
            
            return {
                suggestions: javadocTags.map(tag => ({
                    label: tag.tag,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: tag.description,
                    insertText: tag.snippet,
                    range: wordRange,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: {
                        value: `**${tag.tag}**\n\n${tag.description}`
                    }
                }))
            };
        },
        
        /**
         * Handles completions for string literals
         */
        handleStringLiteralCompletion: function(wordRange) {
            // Common string values based on context
            const commonStrings = [
                { value: "null", description: "Null string" },
                { value: "true", description: "Boolean true value" },
                { value: "false", description: "Boolean false value" },
                { value: "yes", description: "Affirmative value" },
                { value: "no", description: "Negative value" },
                { value: "on", description: "Enabled state" },
                { value: "off", description: "Disabled state" },
                { value: "enabled", description: "Enabled state" },
                { value: "disabled", description: "Disabled state" },
                { value: "UTF-8", description: "UTF-8 character encoding" },
                { value: "ISO-8859-1", description: "ISO Latin-1 character encoding" },
                { value: "application/json", description: "JSON content type" },
                { value: "text/html", description: "HTML content type" },
                { value: "text/plain", description: "Plain text content type" }
            ];
            
            return {
                suggestions: commonStrings.map(str => ({
                    label: str.value,
                    kind: monaco.languages.CompletionItemKind.Value,
                    detail: str.description,
                    insertText: str.value,
                    range: wordRange
                }))
            };
        },
        
        /**
         * Handles completions for conditions (if, while, etc.)
         */
        handleConditionCompletion: function(model, position, wordRange) {
            // Variables in scope that could be used in conditions
            const variableCompletions = JavaTypeInference.getScopeVariables()
                .filter(v => v.type === 'boolean' || v.type === 'int' || v.type === 'String' || 
                             v.type === 'long' || v.type === 'double' || v.type === 'float')
                .map(variable => ({
                    label: variable.name,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    detail: `${variable.type} ${variable.name}`,
                    insertText: variable.name,
                    range: wordRange
                }));
            
            // Common condition snippets
            const conditionSnippets = [
                { label: '==', snippet: '${1:a} == ${2:b}', description: 'Equality comparison' },
                { label: '!=', snippet: '${1:a} != ${2:b}', description: 'Inequality comparison' },
                { label: '>', snippet: '${1:a} > ${2:b}', description: 'Greater than comparison' },
                { label: '<', snippet: '${1:a} < ${2:b}', description: 'Less than comparison' },
                { label: '>=', snippet: '${1:a} >= ${2:b}', description: 'Greater than or equal comparison' },
                { label: '<=', snippet: '${1:a} <= ${2:b}', description: 'Less than or equal comparison' },
                { label: '&&', snippet: '${1:condition1} && ${2:condition2}', description: 'Logical AND' },
                { label: '||', snippet: '${1:condition1} || ${2:condition2}', description: 'Logical OR' },
                { label: '!', snippet: '!${1:condition}', description: 'Logical NOT' },
                { label: 'equals()', snippet: '${1:str1}.equals(${2:str2})', description: 'String equality comparison' },
                { label: 'isEmpty()', snippet: '${1:collection}.isEmpty()', description: 'Check if collection is empty' },
                { label: 'contains()', snippet: '${1:collection}.contains(${2:element})', description: 'Check if collection contains element' },
                { label: 'instanceof', snippet: '${1:obj} instanceof ${2:Type}', description: 'Type checking' }
            ];
            
            return {
                suggestions: [
                    ...variableCompletions,
                    ...conditionSnippets.map(cond => ({
                        label: cond.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        detail: cond.description,
                        insertText: cond.snippet,
                        range: wordRange,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: {
                            value: `**${cond.label}**\n\n${cond.description}`
                        }
                    }))
                ]
            };
        }
    };
    
    // Helper functions for constructing snippets
    
    /**
     * Generate constructor snippet based on constructor information
     */
    function getConstructorSnippet(type) {
        if (!type.hasConstructor || type.constructors.length === 0) {
            return `${type.name}()`;
        }
        
        // Use the first constructor by default
        const constructor = type.constructors[0];
        
        // Parse constructor parameters
        if (!constructor.params || constructor.params.length === 0) {
            return `${type.name}()`;
        }
        
        // Create snippet with parameter placeholders
        const paramSnippets = constructor.params.map((param, index) => 
            `\${${index + 1}:${param.name}}`
        );
        
        return `${type.name}(${paramSnippets.join(', ')})`;
    }
    
    /**
     * Generate annotation snippet with parameters if applicable
     */
    function getAnnotationSnippet(annotation) {
        switch(annotation.name) {
            case 'SuppressWarnings':
                return `@SuppressWarnings("\${1:warning}")`;
            case 'Retention':
                return `@Retention(RetentionPolicy.\${1|SOURCE,CLASS,RUNTIME|})`;
            case 'Target':
                return `@Target({\${1|ElementType.TYPE,ElementType.FIELD,ElementType.METHOD,ElementType.PARAMETER,ElementType.CONSTRUCTOR,ElementType.LOCAL_VARIABLE,ElementType.ANNOTATION_TYPE,ElementType.PACKAGE,ElementType.TYPE_PARAMETER,ElementType.TYPE_USE|}})`;
            default:
                return `@${annotation.name}`;
        }
    }
    
    /**
     * Get documentation for an exception class
     */
    function getExceptionDocumentation(exception) {
        if (!exception.description) {
            return `**${exception.name}**\n\nJava exception class`;
        }
        
        return `**${exception.name}**\n\n${exception.description}`;
    }
    
    /**
     * Get documentation for a type
     */
    function getTypeDocumentation(type) {
        let doc = `**${type.name}**`;
        
        if (JavaTypeSystem[type.name] && JavaTypeSystem[type.name].description) {
            doc += `\n\n${JavaTypeSystem[type.name].description}`;
        }
        
        if (type.constructors && type.constructors.length > 0) {
            doc += '\n\n**Constructors:**\n';
            type.constructors.forEach(ctor => {
                const paramList = ctor.params ? 
                    ctor.params.map(p => `${p.type} ${p.name}`).join(', ') : '';
                doc += `\n- ${type.name}(${paramList})`;
                if (ctor.description) {
                    doc += `\n  ${ctor.description}`;
                }
            });
        }
        
        return doc;
    }
    
    // Export to global scope
    window.handleParameterCompletion = JavaAdvancedHandlers.handleParameterCompletion.bind(JavaAdvancedHandlers);
    window.handleTypeCompletion = JavaAdvancedHandlers.handleTypeCompletion.bind(JavaAdvancedHandlers);
    window.handleVariableDeclarationCompletion = JavaAdvancedHandlers.handleVariableDeclarationCompletion.bind(JavaAdvancedHandlers);
    window.handleJavaDocCompletion = JavaAdvancedHandlers.handleJavaDocCompletion;
    window.handleStringLiteralCompletion = JavaAdvancedHandlers.handleStringLiteralCompletion;
    window.handleConditionCompletion = JavaAdvancedHandlers.handleConditionCompletion;
    window.getConstructorSnippet = getConstructorSnippet;
    window.getAnnotationSnippet = getAnnotationSnippet;
    window.getExceptionDocumentation = getExceptionDocumentation;
    window.getTypeDocumentation = getTypeDocumentation;
})();
