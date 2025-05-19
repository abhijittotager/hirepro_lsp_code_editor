package com.monacoide.lsp;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.eclipse.lsp4j.CompletionItem;
import org.eclipse.lsp4j.CompletionItemKind;
import org.eclipse.lsp4j.InsertTextFormat;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.TextEdit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Provides Java code completion suggestions
 */
public class JavaCompletionProvider {
    private static final Logger LOG = LoggerFactory.getLogger(JavaCompletionProvider.class);
    
    // Java keywords
    private static final List<String> KEYWORDS = Arrays.asList(
        "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const",
        "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float",
        "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new",
        "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super",
        "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"
    );
    
    // Common Java types
    private static final List<String> TYPES = Arrays.asList(
        "String", "Integer", "Boolean", "Double", "Float", "Long", "Character", "Byte", "Short",
        "StringBuilder", "StringBuffer", "ArrayList", "LinkedList", "HashMap", "HashSet", "TreeMap",
        "TreeSet", "List", "Map", "Set", "Collection", "Arrays", "Collections", "Optional", "Stream",
        "BigInteger", "BigDecimal", "Date", "Calendar", "LocalDate", "LocalTime", "LocalDateTime",
        "File", "Path", "Files", "Paths", "Scanner", "Exception", "RuntimeException"
    );
    
    // Common Java methods
    private static final List<String> METHODS = Arrays.asList(
        "equals", "toString", "hashCode", "compareTo", "valueOf",
        "length", "charAt", "substring", "indexOf", "lastIndexOf", 
        "replace", "toUpperCase", "toLowerCase", "trim", "split", 
        "startsWith", "endsWith", "contains", "isEmpty", "size"
    );
    
    // Code snippets
    private static final List<SnippetCompletionItem> SNIPPETS = Arrays.asList(
        new SnippetCompletionItem("class", "public class ${1:ClassName} {\n\t${0}\n}", "Create a new class"),
        new SnippetCompletionItem("main", "public static void main(String[] args) {\n\t${0}\n}", "Create main method"),
        new SnippetCompletionItem("sout", "System.out.println(${1});\n${0}", "Print to console"),
        new SnippetCompletionItem("for", "for (int ${1:i} = 0; ${1:i} < ${2:size}; ${1:i}++) {\n\t${0}\n}", "Create for loop"),
        new SnippetCompletionItem("foreach", "for (${1:Type} ${2:item} : ${3:collection}) {\n\t${0}\n}", "Create foreach loop"),
        new SnippetCompletionItem("if", "if (${1:condition}) {\n\t${0}\n}", "Create if statement"),
        new SnippetCompletionItem("ifelse", "if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}", "Create if-else statement"),
        new SnippetCompletionItem("try", "try {\n\t${1}\n} catch (${2:Exception} ${3:e}) {\n\t${0}\n}", "Create try-catch block"),
        new SnippetCompletionItem("method", "public ${1:void} ${2:methodName}(${3}) {\n\t${0}\n}", "Create method")
    );
    
    /**
     * Provides code completion items based on document text and cursor position
     */
    public static List<CompletionItem> provideCompletions(String text, Position position) {
        List<CompletionItem> items = new ArrayList<>();
        
        try {
            // Extract the line before the cursor
            String[] lines = text.split("\\r?\\n");
            int lineIndex = Math.min(position.getLine(), lines.length - 1);
            String line = lineIndex >= 0 ? lines[lineIndex] : "";
            int charIndex = Math.min(position.getCharacter(), line.length());
            String linePrefix = charIndex >= 0 ? line.substring(0, charIndex) : "";
            
            // Determine context for completions
            boolean isInComment = isInComment(text, position);
            boolean isInString = isInString(line, charIndex);
            boolean isImportStatement = linePrefix.trim().startsWith("import ");
            boolean isDotCompletion = linePrefix.endsWith(".");
            
            if (isInComment || isInString) {
                // No completions in comments or strings
                return items;
            }
            
            if (isImportStatement) {
                // Provide package and class name completions for imports
                addImportCompletions(items);
            } else if (isDotCompletion) {
                // Provide method completions after dot
                addMethodCompletions(items, linePrefix);
            } else {
                // Add keyword completions
                addKeywordCompletions(items);
                
                // Add type completions
                addTypeCompletions(items);
                
                // Add snippet completions
                addSnippetCompletions(items);
            }
        } catch (Exception e) {
            LOG.error("Error providing completions", e);
        }
        
        return items;
    }
    
    private static boolean isInComment(String text, Position position) {
        // Simple check for being in a line comment
        String[] lines = text.split("\\r?\\n");
        int lineIndex = Math.min(position.getLine(), lines.length - 1);
        if (lineIndex >= 0) {
            String line = lines[lineIndex];
            int commentIdx = line.lastIndexOf("//", position.getCharacter());
            if (commentIdx >= 0 && commentIdx < position.getCharacter()) {
                return true;
            }
        }
        
        // More complex check for being in a block comment would need to parse the document
        return false;
    }
    
    private static boolean isInString(String line, int charIndex) {
        boolean inString = false;
        char stringDelimiter = '"';
        boolean escaped = false;
        
        for (int i = 0; i < charIndex; i++) {
            char c = line.charAt(i);
            
            if (escaped) {
                escaped = false;
                continue;
            }
            
            if (c == '\\') {
                escaped = true;
                continue;
            }
            
            if (c == '"' || c == '\'') {
                if (!inString) {
                    inString = true;
                    stringDelimiter = c;
                } else if (c == stringDelimiter) {
                    inString = false;
                }
            }
        }
        
        return inString;
    }
    
    private static void addKeywordCompletions(List<CompletionItem> items) {
        for (String keyword : KEYWORDS) {
            CompletionItem item = new CompletionItem(keyword);
            item.setKind(CompletionItemKind.Keyword);
            item.setDetail("Java keyword");
            items.add(item);
        }
    }
    
    private static void addTypeCompletions(List<CompletionItem> items) {
        for (String type : TYPES) {
            CompletionItem item = new CompletionItem(type);
            item.setKind(CompletionItemKind.Class);
            item.setDetail("Java type");
            items.add(item);
        }
    }
    
    private static void addMethodCompletions(List<CompletionItem> items, String linePrefix) {
        String className = linePrefix.substring(0, linePrefix.length() - 1).trim();
        
        // System.out completions
        if (className.equals("System.out")) {
            addSystemOutCompletions(items);
            return;
        }
        
        // Default method completions
        for (String method : METHODS) {
            CompletionItem item = new CompletionItem(method);
            item.setKind(CompletionItemKind.Method);
            item.setDetail("Method");
            
            // Add parentheses for method calls
            TextEdit textEdit = new TextEdit();
            textEdit.setNewText(method + "()");
            Range range = new Range();
            range.setStart(new Position(0, 0));
            range.setEnd(new Position(0, 0));
            textEdit.setRange(range);
            
            item.setTextEdit(Either.forLeft(textEdit));
            
            items.add(item);
        }
    }
    
    private static void addSystemOutCompletions(List<CompletionItem> items) {
        // println
        CompletionItem println = new CompletionItem("println");
        println.setKind(CompletionItemKind.Method);
        println.setDetail("System.out.println()");
        println.setInsertText("println(${1:message})");
        println.setInsertTextFormat(InsertTextFormat.Snippet);
        items.add(println);
        
        // print
        CompletionItem print = new CompletionItem("print");
        print.setKind(CompletionItemKind.Method);
        print.setDetail("System.out.print()");
        print.setInsertText("print(${1:message})");
        print.setInsertTextFormat(InsertTextFormat.Snippet);
        items.add(print);
        
        // printf
        CompletionItem printf = new CompletionItem("printf");
        printf.setKind(CompletionItemKind.Method);
        printf.setDetail("System.out.printf()");
        printf.setInsertText("printf(${1:format}, ${2:args})");
        printf.setInsertTextFormat(InsertTextFormat.Snippet);
        items.add(printf);
    }
    
    private static void addImportCompletions(List<CompletionItem> items) {
        // Common package completions
        String[] commonPackages = {
            "java.util", 
            "java.io", 
            "java.net", 
            "java.time", 
            "java.text", 
            "java.math", 
            "java.nio", 
            "java.sql", 
            "java.awt", 
            "javax.swing"
        };
        
        for (String pkg : commonPackages) {
            CompletionItem item = new CompletionItem(pkg);
            item.setKind(CompletionItemKind.Module);
            item.setDetail("Package");
            items.add(item);
        }
    }
    
    private static void addSnippetCompletions(List<CompletionItem> items) {
        for (SnippetCompletionItem snippet : SNIPPETS) {
            CompletionItem item = new CompletionItem(snippet.getLabel());
            item.setKind(CompletionItemKind.Snippet);
            item.setDetail(snippet.getDetail());
            item.setInsertText(snippet.getInsertText());
            item.setInsertTextFormat(InsertTextFormat.Snippet);
            items.add(item);
        }
    }
    
    /**
     * Helper class for snippet completion items
     */
    private static class SnippetCompletionItem {
        private final String label;
        private final String insertText;
        private final String detail;
        
        public SnippetCompletionItem(String label, String insertText, String detail) {
            this.label = label;
            this.insertText = insertText;
            this.detail = detail;
        }
        
        public String getLabel() {
            return label;
        }
        
        public String getInsertText() {
            return insertText;
        }
        
        public String getDetail() {
            return detail;
        }
    }
    
    // Helper class to simplify Either<TextEdit, InsertReplaceEdit> code
    private static class Either<L, R> {
        private final L left;
        private final R right;
        
        private Either(L left, R right) {
            this.left = left;
            this.right = right;
        }
        
        public static <L, R> Either<L, R> forLeft(L left) {
            return new Either<>(left, null);
        }
        
        public static <L, R> Either<L, R> forRight(R right) {
            return new Either<>(null, right);
        }
    }
}
