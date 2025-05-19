/**
 * AdvancedJavaSnippets.js
 * Provides enhanced Java code snippets for Monaco Editor
 */

(function() {
    'use strict';

    const advancedJavaSnippets = [
        // OOP Patterns
        {
            label: 'class',
            detail: 'Java class template',
            insertText: 
`public class \${1:ClassName} {
    \${0}
}`,
            documentation: 'Creates a new Java class'
        },
        {
            label: 'classwithmain',
            detail: 'Java class with main method',
            insertText: 
`public class \${1:ClassName} {
    public static void main(String[] args) {
        \${0}
    }
}`,
            documentation: 'Creates a Java class with a main method'
        },
        {
            label: 'interface',
            detail: 'Java interface template',
            insertText: 
`public interface \${1:InterfaceName} {
    \${0}
}`,
            documentation: 'Creates a new Java interface'
        },
        {
            label: 'enum',
            detail: 'Java enumeration template',
            insertText: 
`public enum \${1:EnumName} {
    \${2:VALUE1},
    \${3:VALUE2},
    \${4:VALUE3}\${0}
}`,
            documentation: 'Creates a new Java enumeration'
        },
        {
            label: 'abstract',
            detail: 'Java abstract class template',
            insertText: 
`public abstract class \${1:AbstractClassName} {
    \${0}
}`,
            documentation: 'Creates a new Java abstract class'
        },
        
        // Methods
        {
            label: 'method',
            detail: 'Public method',
            insertText: 
`public \${1:void} \${2:methodName}(\${3:parameters}) {
    \${0}
}`,
            documentation: 'Creates a public method'
        },
        {
            label: 'private',
            detail: 'Private method',
            insertText: 
`private \${1:void} \${2:methodName}(\${3:parameters}) {
    \${0}
}`,
            documentation: 'Creates a private method'
        },
        {
            label: 'static',
            detail: 'Static method',
            insertText: 
`public static \${1:void} \${2:methodName}(\${3:parameters}) {
    \${0}
}`,
            documentation: 'Creates a static method'
        },
        {
            label: 'getter',
            detail: 'Getter method',
            insertText: 
`public \${1:Type} get\${2:PropertyName}() {
    return \${3:fieldName};
}`,
            documentation: 'Creates a getter method'
        },
        {
            label: 'setter',
            detail: 'Setter method',
            insertText: 
`public void set\${1:PropertyName}(\${2:Type} \${3:paramName}) {
    this.\${4:fieldName} = \${3:paramName};
}`,
            documentation: 'Creates a setter method'
        },
        {
            label: 'constructor',
            detail: 'Constructor',
            insertText: 
`public \${1:ClassName}(\${2:parameters}) {
    \${0}
}`,
            documentation: 'Creates a constructor'
        },
        
        // Control Structures
        {
            label: 'if',
            detail: 'If statement',
            insertText: 
`if (\${1:condition}) {
    \${0}
}`,
            documentation: 'Creates an if statement'
        },
        {
            label: 'ifelse',
            detail: 'If-else statement',
            insertText: 
`if (\${1:condition}) {
    \${2}
} else {
    \${0}
}`,
            documentation: 'Creates an if-else statement'
        },
        {
            label: 'ifelseif',
            detail: 'If-else-if statement',
            insertText: 
`if (\${1:condition1}) {
    \${2}
} else if (\${3:condition2}) {
    \${4}
} else {
    \${0}
}`,
            documentation: 'Creates an if-else-if statement'
        },
        {
            label: 'for',
            detail: 'For loop',
            insertText: 
`for (int \${1:i} = 0; \${1:i} < \${2:max}; \${1:i}++) {
    \${0}
}`,
            documentation: 'Creates a for loop'
        },
        {
            label: 'foreach',
            detail: 'For-each loop',
            insertText: 
`for (\${1:ElementType} \${2:element} : \${3:collection}) {
    \${0}
}`,
            documentation: 'Creates a for-each loop'
        },
        {
            label: 'while',
            detail: 'While loop',
            insertText: 
`while (\${1:condition}) {
    \${0}
}`,
            documentation: 'Creates a while loop'
        },
        {
            label: 'dowhile',
            detail: 'Do-while loop',
            insertText: 
`do {
    \${0}
} while (\${1:condition});`,
            documentation: 'Creates a do-while loop'
        },
        {
            label: 'switch',
            detail: 'Switch statement',
            insertText: 
`switch (\${1:variable}) {
    case \${2:value1}:
        \${3}
        break;
    case \${4:value2}:
        \${5}
        break;
    default:
        \${0}
        break;
}`,
            documentation: 'Creates a switch statement'
        },
        
        // Exception Handling
        {
            label: 'try',
            detail: 'Try-catch block',
            insertText: 
`try {
    \${1}
} catch (\${2:Exception} \${3:e}) {
    \${0}
}`,
            documentation: 'Creates a try-catch block'
        },
        {
            label: 'trycf',
            detail: 'Try-catch-finally block',
            insertText: 
`try {
    \${1}
} catch (\${2:Exception} \${3:e}) {
    \${4}
} finally {
    \${0}
}`,
            documentation: 'Creates a try-catch-finally block'
        },
        {
            label: 'trywithresources',
            detail: 'Try-with-resources block',
            insertText: 
`try (\${1:Resource} \${2:resource} = new \${1:Resource}()) {
    \${0}
} catch (\${3:Exception} \${4:e}) {
    
}`,
            documentation: 'Creates a try-with-resources block'
        },
        {
            label: 'throw',
            detail: 'Throw exception',
            insertText: 'throw new \${1:Exception}("\${2:message}");',
            documentation: 'Throws an exception'
        },
        
        // Java Collections
        {
            label: 'arraylist',
            detail: 'ArrayList declaration',
            insertText: 'List<\${1:String}> \${2:list} = new ArrayList<>();',
            documentation: 'Creates an ArrayList'
        },
        {
            label: 'hashmap',
            detail: 'HashMap declaration',
            insertText: 'Map<\${1:String}, \${2:Object}> \${3:map} = new HashMap<>();',
            documentation: 'Creates a HashMap'
        },
        {
            label: 'hashset',
            detail: 'HashSet declaration',
            insertText: 'Set<\${1:String}> \${2:set} = new HashSet<>();',
            documentation: 'Creates a HashSet'
        },
        
        // Java 8+ Features
        {
            label: 'lambda',
            detail: 'Lambda expression',
            insertText: '(\${1:params}) -> \${2:expression}',
            documentation: 'Creates a lambda expression'
        },
        {
            label: 'lambdablock',
            detail: 'Lambda block',
            insertText: 
`(\${1:params}) -> {
    \${0}
}`,
            documentation: 'Creates a lambda block'
        },
        {
            label: 'stream',
            detail: 'Stream pipeline',
            insertText: '\${1:collection}.stream()\n    .\${0}',
            documentation: 'Creates a stream pipeline'
        },
        {
            label: 'optional',
            detail: 'Optional usage',
            insertText: 
`Optional<\${1:Type}> \${2:optionalValue} = Optional.ofNullable(\${3:value});
\${2:optionalValue}.ifPresent(\${4:val} -> {
    \${0}
});`,
            documentation: 'Creates an Optional with usage example'
        },
        
        // Concurrency
        {
            label: 'thread',
            detail: 'New Thread',
            insertText: 
`Thread \${1:thread} = new Thread(() -> {
    \${0}
});
\${1:thread}.start();`,
            documentation: 'Creates and starts a new Thread'
        },
        {
            label: 'runnable',
            detail: 'Runnable implementation',
            insertText: 
`Runnable \${1:runnable} = () -> {
    \${0}
};`,
            documentation: 'Creates a Runnable implementation with lambda'
        },
        
        // Testing (JUnit)
        {
            label: 'test',
            detail: 'JUnit test method',
            insertText: 
`@Test
public void \${1:testMethod}() {
    \${0}
}`,
            documentation: 'Creates a JUnit test method'
        },
        {
            label: 'before',
            detail: 'JUnit setup method',
            insertText: 
`@Before
public void setUp() {
    \${0}
}`,
            documentation: 'Creates a JUnit setup method'
        },
        {
            label: 'assert',
            detail: 'JUnit assertion',
            insertText: 'assertEquals(\${1:expected}, \${2:actual});',
            documentation: 'JUnit assertEquals assertion'
        },
        
        // Convenience functions
        {
            label: 'sout',
            detail: 'System.out.println',
            insertText: 'System.out.println(\${0});',
            documentation: 'Prints to standard output'
        },
        {
            label: 'souf',
            detail: 'System.out.printf',
            insertText: 'System.out.printf("\${1:%s}\\n", \${0});',
            documentation: 'Prints formatted output to standard output'
        },
        {
            label: 'loginfo',
            detail: 'Logger info message',
            insertText: 'logger.info("\${0}");',
            documentation: 'Logs an info message'
        },
        {
            label: 'logdebug',
            detail: 'Logger debug message',
            insertText: 'logger.debug("\${0}");',
            documentation: 'Logs a debug message'
        },
        {
            label: 'logerror',
            detail: 'Logger error message',
            insertText: 'logger.error("\${0}", \${1:exception});',
            documentation: 'Logs an error message with exception'
        }
    ];

    // Register advanced Java snippets with Monaco
    function registerAdvancedJavaSnippets(monaco) {
        // Register the snippets as completions
        monaco.languages.registerCompletionItemProvider('java', {
            provideCompletionItems: function() {
                return {
                    suggestions: advancedJavaSnippets.map(snippet => ({
                        label: snippet.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: {
                            value: `**${snippet.label}**: ${snippet.documentation}`
                        },
                        insertText: snippet.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `📋 ${snippet.detail}`,
                        sortText: 's_' + snippet.label // Make snippets appear first in the list
                    }))
                };
            }
        });

        console.log('Advanced Java snippets registered!');
    }

    // Make function available globally
    window.registerAdvancedJavaSnippets = registerAdvancedJavaSnippets;
})();
