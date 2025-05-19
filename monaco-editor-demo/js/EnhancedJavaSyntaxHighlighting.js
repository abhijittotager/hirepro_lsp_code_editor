/**
 * EnhancedJavaSyntaxHighlighting.js
 * Provides improved syntax highlighting for Java in Monaco Editor
 */

(function() {
    'use strict';

    // Define the enhanced Java syntax highlighting rules
    function registerEnhancedJavaSyntaxHighlighting(monaco) {
        monaco.languages.setMonarchTokensProvider('java', {
            // Set defaultToken to invalid to see what you do not tokenize yet
            defaultToken: 'invalid',

            keywords: [
                'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 
                'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 
                'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 
                'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 
                'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 
                'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
                'var', 'record', 'yield', 'sealed', 'permits' // Java 9-17 features
            ],

            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
                '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>=', '>>>='
            ],

            // we include these common regular expressions
            symbols: /[=><!~?:&|+\-*\/\^%]+/,

            // C# style strings
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            // The main tokenizer for our languages
            tokenizer: {
                root: [
                    // Annotations
                    [/@[a-zA-Z]\w*/, { token: 'annotation', next: '@after_annotation' }],
                    
                    // Java Object methods (highlighted specially)
                    [/\b(toString|equals|hashCode|clone|finalize|getClass|notify|notifyAll|wait)\b(?=\s*\()/, 'predefined.method'],
                    
                    // Java standard library classes (highlighted specially)
                    [/\b(String|System|StringBuilder|StringBuffer|Math|Object|Class|Enum|Thread|Runnable|Exception|RuntimeException|Throwable|Error|StackTraceElement|Number|Integer|Double|Float|Long|Boolean|Byte|Short|Character|Void)\b/, 'predefined.class'],
                    
                    // Java Collection Framework classes (highlighted specially)
                    [/\b(List|ArrayList|LinkedList|Map|HashMap|TreeMap|Set|HashSet|TreeSet|Queue|Deque|Collection|Collections|Arrays|Iterator|Iterable|Comparable|Comparator|Optional)\b/, 'predefined.collection'],
                    
                    // identifiers and keywords
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            '@keywords': { token: 'keyword.$0' },
                            '@default': 'identifier'
                        }
                    }],

                    // Package and import statements
                    [/(package|import)(\s+)([a-zA-Z_][\w\.]*)/, ['keyword', 'white', 'namespace']],

                    // whitespace
                    { include: '@whitespace' },

                    // delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // delimiter: after number because of .\d floats
                    [/[;,.]/, 'delimiter'],

                    // numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
                    [/0[xX][0-9a-fA-F_]*[0-9a-fA-F][Ll]?/, 'number.hex'],
                    [/0[bB][01_]*[01][Ll]?/, 'number.binary'],
                    [/0[0-7_]*[0-7][Ll]?/, 'number.octal'],
                    [/\d+[lL]?/, 'number'],

                    // strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

                    // characters
                    [/'[^\\']'/, 'string'],
                    [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                    [/'/, 'string.invalid']
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    ["\\*/", 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],

                after_annotation: [
                    [/\(/, { token: '@brackets', next: '@annotation_params' }],
                    [/[ \t]*/, { token: 'white', next: '@pop' }]
                ],

                annotation_params: [
                    [/[a-zA-Z_]\w*\s*=/, 'annotation.parameter'],
                    [/[,)]/, { token: '@brackets', next: '@pop' }],
                    [/[^,)]/, 'annotation.value']
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                    [/\/\*\*(?!\/)/, 'comment.doc', '@javadoc']
                ],

                javadoc: [
                    [/[^\/*]+/, 'comment.doc'],
                    [/\*\//, 'comment.doc', '@pop'],
                    [/[\/*]/, 'comment.doc']
                ],
            }
        });

        // Update the editor theme for better Java syntax highlighting
        monaco.editor.defineTheme('enhancedJavaTheme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
                { token: 'predefined.class', foreground: '267f99', fontStyle: 'italic' },
                { token: 'predefined.method', foreground: '795E26' },
                { token: 'predefined.collection', foreground: '267f99', fontStyle: 'italic' },
                { token: 'annotation', foreground: '808000' },
                { token: 'annotation.parameter', foreground: '808000' },
                { token: 'annotation.value', foreground: '008080' },
                { token: 'comment.doc', foreground: '008800' },
                { token: 'namespace', foreground: '098658' },
                { token: 'string', foreground: 'a31515' },
                { token: 'identifier', foreground: '001080' }
            ],
            colors: {
                'editor.lineHighlightBackground': '#f0f0f0',
                'editor.selectionHighlightBackground': '#e0e0e0'
            }
        });

        // Also define a dark theme
        monaco.editor.defineTheme('enhancedJavaDarkTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
                { token: 'predefined.class', foreground: '4EC9B0', fontStyle: 'italic' },
                { token: 'predefined.method', foreground: 'DCDCAA' },
                { token: 'predefined.collection', foreground: '4EC9B0', fontStyle: 'italic' },
                { token: 'annotation', foreground: 'DCDCAA' },
                { token: 'annotation.parameter', foreground: 'DCDCAA' },
                { token: 'annotation.value', foreground: 'CE9178' },
                { token: 'comment.doc', foreground: '6A9955' },
                { token: 'namespace', foreground: '4EC9B0' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'identifier', foreground: '9CDCFE' }
            ],
            colors: {
                'editor.lineHighlightBackground': '#2d2d2d',
                'editor.selectionHighlightBackground': '#444444'
            }
        });

        console.log('Enhanced Java syntax highlighting registered!');
    }

    // Make function available globally
    window.registerEnhancedJavaSyntaxHighlighting = registerEnhancedJavaSyntaxHighlighting;
})();
