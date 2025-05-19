/**
 * Java code snippets for Monaco Editor
 * Provides a comprehensive set of Java code templates
 */

const JavaSnippets = [
    // Class templates
    {
        label: 'class',
        description: 'Class definition',
        insertText: 'public class ${1:ClassName} {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'class-main',
        description: 'Class with main method',
        insertText: 'public class ${1:ClassName} {\n\tpublic static void main(String[] args) {\n\t\t${0}\n\t}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'abstract-class',
        description: 'Abstract class definition',
        insertText: 'public abstract class ${1:AbstractClassName} {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'interface',
        description: 'Interface definition',
        insertText: 'public interface ${1:InterfaceName} {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'enum',
        description: 'Enum definition',
        insertText: 'public enum ${1:EnumName} {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    
    // Method templates
    {
        label: 'main',
        description: 'Main method',
        insertText: 'public static void main(String[] args) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'method',
        description: 'Method definition',
        insertText: 'public ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'method-private',
        description: 'Private method definition',
        insertText: 'private ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'method-protected',
        description: 'Protected method definition',
        insertText: 'protected ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'method-static',
        description: 'Static method definition',
        insertText: 'public static ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'constructor',
        description: 'Constructor definition',
        insertText: 'public ${1:ClassName}(${2}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'getter',
        description: 'Getter method',
        insertText: 'public ${1:Type} get${2:FieldName}() {\n\treturn ${3:fieldName};\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'setter',
        description: 'Setter method',
        insertText: 'public void set${1:FieldName}(${2:Type} ${3:fieldName}) {\n\tthis.${3:fieldName} = ${3:fieldName};\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'override',
        description: 'Override method',
        insertText: '@Override\npublic ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'equals',
        description: 'equals() method',
        insertText: '@Override\npublic boolean equals(Object obj) {\n\tif (this == obj) return true;\n\tif (obj == null || getClass() != obj.getClass()) return false;\n\t${1:ClassName} other = (${1:ClassName}) obj;\n\treturn ${2:field} == other.${2:field};\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'hashCode',
        description: 'hashCode() method',
        insertText: '@Override\npublic int hashCode() {\n\treturn Objects.hash(${1:fields});\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'toString',
        description: 'toString() method',
        insertText: '@Override\npublic String toString() {\n\treturn "${1:ClassName}{" +\n\t\t"${2:field}=" + ${2:field} +\n\t\t\'}\'\n\t;\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },

    // Control structures
    {
        label: 'if',
        description: 'If statement',
        insertText: 'if (${1:condition}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'ifelse',
        description: 'If-else statement',
        insertText: 'if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'ifnull',
        description: 'If null check',
        insertText: 'if (${1:variable} == null) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'ifnotnull',
        description: 'If not null check',
        insertText: 'if (${1:variable} != null) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'for',
        description: 'For loop',
        insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:size}; ${1:i}++) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'foreach',
        description: 'For-each loop',
        insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'while',
        description: 'While loop',
        insertText: 'while (${1:condition}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'do-while',
        description: 'Do-while loop',
        insertText: 'do {\n\t${0}\n} while (${1:condition});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'switch',
        description: 'Switch statement',
        insertText: 'switch (${1:variable}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${0}\n\t\tbreak;\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'try-catch',
        description: 'Try-catch block',
        insertText: 'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'try-finally',
        description: 'Try-finally block',
        insertText: 'try {\n\t${1}\n} finally {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'try-catch-finally',
        description: 'Try-catch-finally block',
        insertText: 'try {\n\t${1}\n} catch (${2:Exception} e) {\n\t${3}\n} finally {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'try-resources',
        description: 'Try-with-resources block',
        insertText: 'try (${1:Resource} ${2:name} = new ${1:Resource}(${3})) {\n\t${0}\n} catch (Exception e) {\n\te.printStackTrace();\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },

    // Comments and Javadoc
    {
        label: 'comment-block',
        description: 'Block comment',
        insertText: '/**\n * ${0}\n */',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'javadoc-class',
        description: 'Javadoc for class',
        insertText: '/**\n * ${1:Description}\n *\n * @author ${2:author}\n * @version ${3:1.0}\n */',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'javadoc-method',
        description: 'Javadoc for method',
        insertText: '/**\n * ${1:Description}\n *\n * @param ${2:param} ${3:description}\n * @return ${4:description}\n * @throws ${5:Exception} ${6:description}\n */',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'todo',
        description: 'TODO comment',
        insertText: '// TODO: ${0}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },

    // Common Java code patterns
    {
        label: 'sout',
        description: 'System.out.println',
        insertText: 'System.out.println(${1});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'psvm',
        description: 'Public static void main',
        insertText: 'public static void main(String[] args) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'newobj',
        description: 'Create new object',
        insertText: '${1:Type} ${2:name} = new ${1:Type}(${3});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'list',
        description: 'Create ArrayList',
        insertText: 'List<${1:Type}> ${2:list} = new ArrayList<>();',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'map',
        description: 'Create HashMap',
        insertText: 'Map<${1:KeyType}, ${2:ValueType}> ${3:map} = new HashMap<>();',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'set',
        description: 'Create HashSet',
        insertText: 'Set<${1:Type}> ${2:set} = new HashSet<>();',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'sync',
        description: 'Synchronized block',
        insertText: 'synchronized (${1:this}) {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'lambda',
        description: 'Lambda expression',
        insertText: '(${1:params}) -> {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'optional',
        description: 'Optional usage pattern',
        insertText: 'Optional<${1:Type}> ${2:opt} = Optional.ofNullable(${3:value});\n${2:opt}.ifPresent(${4:val} -> {\n\t${0}\n});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'stream',
        description: 'Stream pattern',
        insertText: '${1:collection}.stream()\n\t.${2:filter}(${3:predicate})\n\t.${4:map}(${5:mapper})\n\t.${6:collect}(Collectors.${7:toList}());',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    
    // Testing
    {
        label: 'junit-test',
        description: 'JUnit test method',
        insertText: '@Test\npublic void ${1:testName}() {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'junit-before',
        description: 'JUnit setup method',
        insertText: '@Before\npublic void setUp() {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'junit-after',
        description: 'JUnit teardown method',
        insertText: '@After\npublic void tearDown() {\n\t${0}\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'assert-equals',
        description: 'JUnit assertEquals',
        insertText: 'assertEquals(${1:expected}, ${2:actual});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'assert-true',
        description: 'JUnit assertTrue',
        insertText: 'assertTrue(${1:condition});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'assert-false',
        description: 'JUnit assertFalse',
        insertText: 'assertFalse(${1:condition});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'assert-null',
        description: 'JUnit assertNull',
        insertText: 'assertNull(${1:object});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    },
    {
        label: 'assert-not-null',
        description: 'JUnit assertNotNull',
        insertText: 'assertNotNull(${1:object});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
    }
];

// Function to register all snippets with Monaco
function registerJavaSnippets(monaco) {
    // Create a completion provider for Java with these snippets
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: (model, position) => {
            return {
                suggestions: JavaSnippets
            };
        }
    });
}

// Export the function
if (typeof module !== 'undefined') {
    module.exports = { registerJavaSnippets };
} else {
    window.registerJavaSnippets = registerJavaSnippets;
}
