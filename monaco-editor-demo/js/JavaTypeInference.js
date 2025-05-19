/**
 * JavaTypeInference.js
 * 
 * Advanced type inference system for Java code in Monaco editor
 * - Tracks variable types including generics
 * - Handles complex expressions
 * - Analyzes method return types
 */

// Global state for type inference
const JavaTypeTracker = {
    // Map of variables to their inferred types
    variables: {},
    
    // Map of method return types
    methodReturnTypes: {},
    
    // Current imports for resolving unqualified types
    imports: [],
    
    // Inferred type parameters for generic classes
    typeParameters: {},
    
    // Reset the tracking state
    reset: function() {
        this.variables = {
            // Add built-in globals
            'System': 'java.lang.System',
            'Math': 'java.lang.Math'
        };
        this.methodReturnTypes = {};
        this.imports = ['java.lang.*']; // Always imported
        this.typeParameters = {};
    }
};

// Initialize the tracker
JavaTypeTracker.reset();

/**
 * Analyze Java code to infer types for variables and expressions
 */
function analyzeJavaCode(code) {
    // Reset the type tracker state
    JavaTypeTracker.reset();
    
    // Parse imports
    const importRegex = /import\s+([\w.]+)(?:\.\*)?;/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        JavaTypeTracker.imports.push(match[1]);
    }
    
    // Variable declarations with type
    const varDeclarationRegex = /(?:final\s+)?(\w+(?:\.\w+)*)\s*(?:<[^>]+>)?\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    while ((match = varDeclarationRegex.exec(code)) !== null) {
        const type = match[1]; // e.g., String, ArrayList<String>
        const name = match[2]; // e.g., myVar
        
        // Process generic types
        if (type.includes('<')) {
            const baseType = type.substring(0, type.indexOf('<'));
            const genericParam = type.substring(type.indexOf('<') + 1, type.lastIndexOf('>'));
            
            // Store both the raw type and the generic info
            JavaTypeTracker.variables[name] = resolveType(baseType);
            JavaTypeTracker.typeParameters[name] = genericParam.split(',').map(t => t.trim());
        } else {
            JavaTypeTracker.variables[name] = resolveType(type);
        }
        
        // If there's an initializer, analyze it too
        if (match[3]) {
            analyzeExpression(match[3], name);
        }
    }
    
    // Method calls with assignment
    const methodCallRegex = /(\w+)\s*=\s*(\w+)\.(\w+)\(([^)]*)\)/g;
    while ((match = methodCallRegex.exec(code)) !== null) {
        const varName = match[1]; // e.g., result
        const objectName = match[2]; // e.g., str
        const methodName = match[3]; // e.g., substring
        
        // Determine object type
        const objectType = JavaTypeTracker.variables[objectName];
        if (objectType) {
            const returnType = inferMethodReturnType(objectType, methodName);
            if (returnType) {
                JavaTypeTracker.variables[varName] = returnType;
            }
        }
    }
    
    // Constructor calls with assignment
    const constructorRegex = /(\w+)\s*=\s*new\s+(\w+(?:\.\w+)*)(?:<([^>]+)>)?\(([^)]*)\)/g;
    while ((match = constructorRegex.exec(code)) !== null) {
        const varName = match[1]; // e.g., list
        const typeName = match[2]; // e.g., ArrayList
        const genericParams = match[3]; // e.g., String
        
        const resolvedType = resolveType(typeName);
        JavaTypeTracker.variables[varName] = resolvedType;
        
        // Store generic parameters if present
        if (genericParams) {
            JavaTypeTracker.typeParameters[varName] = genericParams.split(',').map(t => t.trim());
        }
    }
    
    // Log the current state
    console.log('Java types inferred:', JavaTypeTracker.variables);
    console.log('Type parameters:', JavaTypeTracker.typeParameters);
}

/**
 * Resolve a type name to its fully qualified form
 */
function resolveType(typeName) {
    // Already fully qualified
    if (typeName.includes('.')) {
        return typeName;
    }
    
    // Check java.lang first (implicitly imported)
    if (window.JavaTypeSystem && window.JavaTypeSystem.java.lang[typeName]) {
        return 'java.lang.' + typeName;
    }
    
    // Check all imports
    for (const importPath of JavaTypeTracker.imports) {
        if (importPath.endsWith('.*')) {
            const packageName = importPath.substring(0, importPath.length - 2);
            // Check if the package contains this type
            if (window.JavaTypeSystem && 
                window.JavaTypeSystem.java[packageName.substring(5)] && 
                window.JavaTypeSystem.java[packageName.substring(5)][typeName]) {
                return packageName + '.' + typeName;
            }
        } else if (importPath.endsWith('.' + typeName)) {
            return importPath;
        }
    }
    
    // Default to just the type name if we can't resolve it
    return typeName;
}

/**
 * Infer method return type from the Java type system
 */
function inferMethodReturnType(typeName, methodName) {
    if (!window.getAllMethodsForType) {
        return null;
    }
    
    // Get all methods for this type
    const methods = window.getAllMethodsForType(typeName);
    
    // Find the matching method
    for (const method of methods) {
        const methodSignature = method.name;
        if (methodSignature.startsWith(methodName + '(')) {
            return method.returnType;
        }
    }
    
    return null;
}

/**
 * Analyze a Java expression to infer its type
 */
function analyzeExpression(expr, targetVar) {
    expr = expr.trim();
    
    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
        JavaTypeTracker.variables[targetVar] = 'java.lang.String';
        return 'java.lang.String';
    }
    
    // Integer literal
    if (/^-?\d+$/.test(expr)) {
        JavaTypeTracker.variables[targetVar] = 'int';
        return 'int';
    }
    
    // Double literal
    if (/^-?\d+\.\d+$/.test(expr)) {
        JavaTypeTracker.variables[targetVar] = 'double';
        return 'double';
    }
    
    // Boolean literal
    if (expr === 'true' || expr === 'false') {
        JavaTypeTracker.variables[targetVar] = 'boolean';
        return 'boolean';
    }
    
    // Character literal
    if (expr.startsWith("'") && expr.endsWith("'") && expr.length === 3) {
        JavaTypeTracker.variables[targetVar] = 'char';
        return 'char';
    }
    
    // Constructor call
    const newExprRegex = /new\s+(\w+(?:\.\w+)*)(?:<([^>]+)>)?\(/;
    const newMatch = expr.match(newExprRegex);
    if (newMatch) {
        const typeName = newMatch[1];
        const resolvedType = resolveType(typeName);
        JavaTypeTracker.variables[targetVar] = resolvedType;
        
        // Handle generic type parameters
        if (newMatch[2]) {
            JavaTypeTracker.typeParameters[targetVar] = newMatch[2].split(',').map(t => t.trim());
        }
        
        return resolvedType;
    }
    
    // Method call
    const methodCallRegex = /(\w+)\.(\w+)\(/;
    const methodMatch = expr.match(methodCallRegex);
    if (methodMatch) {
        const objectName = methodMatch[1];
        const methodName = methodMatch[2];
        
        // Determine object type
        const objectType = JavaTypeTracker.variables[objectName];
        if (objectType) {
            const returnType = inferMethodReturnType(objectType, methodName);
            if (returnType) {
                JavaTypeTracker.variables[targetVar] = returnType;
                return returnType;
            }
        }
    }
    
    // Variable reference
    if (JavaTypeTracker.variables[expr]) {
        JavaTypeTracker.variables[targetVar] = JavaTypeTracker.variables[expr];
        return JavaTypeTracker.variables[expr];
    }
    
    return null;
}

/**
 * Infer type of an expression in the current editor context
 */
function inferExpressionType(expr) {
    if (!expr) return null;
    
    // Variable reference
    if (JavaTypeTracker.variables[expr]) {
        return JavaTypeTracker.variables[expr];
    }
    
    // Static field access
    if (expr.includes('.')) {
        const parts = expr.split('.');
        if (parts.length === 2) {
            const typeName = parts[0];
            const fieldName = parts[1];
            
            // Common cases
            if (typeName === 'System' && fieldName === 'out') {
                return 'java.io.PrintStream';
            }
            
            // Look up in type system
            if (window.lookupJavaType) {
                const type = window.lookupJavaType(typeName);
                if (type && type.fields) {
                    const field = type.fields.find(f => f.name === fieldName);
                    if (field) {
                        return field.type;
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * Get completion items for a type, considering generics if applicable
 */
function getCompletionsForTypeWithGenerics(typeName, varName) {
    if (!window.JavaTypeSystem) {
        return [];
    }
    
    // Get base completions
    let completions = [];
    
    if (window.getAllMethodsForType) {
        const methods = window.getAllMethodsForType(typeName);
        completions = completions.concat(methods);
    }
    
    if (window.getAllFieldsForType) {
        const fields = window.getAllFieldsForType(typeName);
        completions = completions.concat(fields);
    }
    
    // Handle generics
    if (varName && JavaTypeTracker.typeParameters[varName]) {
        // Replace E, K, V with actual type parameters
        const typeParams = JavaTypeTracker.typeParameters[varName];
        
        completions = completions.map(item => {
            let newItem = {...item};
            
            // Replace in return type
            if (newItem.returnType === 'E' && typeParams[0]) {
                newItem.returnType = typeParams[0];
            } else if (newItem.returnType === 'K' && typeParams[0]) {
                newItem.returnType = typeParams[0];
            } else if (newItem.returnType === 'V' && typeParams[1]) {
                newItem.returnType = typeParams[1];
            }
            
            return newItem;
        });
    }
    
    return completions;
}

// Export functions for use in other modules
window.JavaTypeTracker = JavaTypeTracker;
window.analyzeJavaCode = analyzeJavaCode;
window.inferExpressionType = inferExpressionType;
window.getCompletionsForTypeWithGenerics = getCompletionsForTypeWithGenerics;
