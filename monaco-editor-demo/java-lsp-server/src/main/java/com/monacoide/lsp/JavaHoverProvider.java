package com.monacoide.lsp;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.eclipse.lsp4j.Hover;
import org.eclipse.lsp4j.MarkupContent;
import org.eclipse.lsp4j.MarkupKind;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.Range;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Provides hover information for Java code elements
 */
public class JavaHoverProvider {
    private static final Logger LOG = LoggerFactory.getLogger(JavaHoverProvider.class);
    
    // Common Java classes and their documentation
    private static final Map<String, String> TYPE_DOCS = new HashMap<>();
    
    static {
        // Initialize documentations for common Java types
        TYPE_DOCS.put("String", "A string is a sequence of characters. In Java, strings are objects.\n\n"
                + "```java\nString text = \"Hello, World!\";\n```");
        
        TYPE_DOCS.put("Integer", "The Integer class wraps a primitive int value in an object.\n\n"
                + "```java\nInteger number = Integer.valueOf(42);\n```");
        
        TYPE_DOCS.put("ArrayList", "ArrayList is a resizable-array implementation of the List interface.\n\n"
                + "```java\nArrayList<String> list = new ArrayList<>();\n```");
        
        TYPE_DOCS.put("HashMap", "HashMap is a hash table based implementation of the Map interface.\n\n"
                + "```java\nHashMap<String, Integer> map = new HashMap<>();\n```");
        
        TYPE_DOCS.put("System.out", "System.out is a PrintStream object that provides methods to output text to the console.\n\n"
                + "```java\nSystem.out.println(\"Hello, World!\");\n```");
        
        TYPE_DOCS.put("System.out.println", "Prints a string and then terminates the line.\n\n"
                + "```java\nSystem.out.println(\"Hello, World!\");\n```\n\n"
                + "**Syntax**: `System.out.println(message)`");
    }
    
    /**
     * Provides hover information for the element at the given position
     */
    public static Hover provideHover(String text, Position position) {
        try {
            // Get the current line
            String[] lines = text.split("\\r?\\n");
            int lineIndex = Math.min(position.getLine(), lines.length - 1);
            String line = lineIndex >= 0 ? lines[lineIndex] : "";
            
            // Get the word at the current position
            String word = getWordAtPosition(line, position.getCharacter());
            
            if (word != null && !word.isEmpty()) {
                // Check for dot expression (e.g., System.out.println)
                String dotExpression = getDotExpressionAtPosition(line, position.getCharacter());
                
                // Check for hover information
                String hoverContent = null;
                
                if (dotExpression != null && TYPE_DOCS.containsKey(dotExpression)) {
                    hoverContent = TYPE_DOCS.get(dotExpression);
                } else if (TYPE_DOCS.containsKey(word)) {
                    hoverContent = TYPE_DOCS.get(word);
                } else {
                    // Try to get information based on the context
                    hoverContent = getHoverForContext(text, lines, lineIndex, word, position);
                }
                
                if (hoverContent != null) {
                    MarkupContent content = new MarkupContent();
                    content.setKind(MarkupKind.MARKDOWN);
                    content.setValue(hoverContent);
                    
                    Hover hover = new Hover();
                    hover.setContents(content);
                    
                    // Set range if applicable
                    int wordStart = line.indexOf(word, Math.max(0, position.getCharacter() - word.length()));
                    if (wordStart >= 0) {
                        Range range = new Range();
                        range.setStart(new Position(lineIndex, wordStart));
                        range.setEnd(new Position(lineIndex, wordStart + word.length()));
                        hover.setRange(range);
                    }
                    
                    return hover;
                }
            }
        } catch (Exception e) {
            LOG.error("Error providing hover information", e);
        }
        
        return new Hover();
    }
    
    /**
     * Gets the word at the specified position in the line
     */
    private static String getWordAtPosition(String line, int position) {
        if (line.isEmpty() || position >= line.length()) {
            return "";
        }
        
        // Find word boundaries
        int start = position;
        int end = position;
        
        // Move start to beginning of word
        while (start > 0 && isWordChar(line.charAt(start - 1))) {
            start--;
        }
        
        // Move end to end of word
        while (end < line.length() && isWordChar(line.charAt(end))) {
            end++;
        }
        
        if (start < end) {
            return line.substring(start, end);
        }
        
        return "";
    }
    
    /**
     * Gets the dot expression (e.g., "System.out.println") at the specified position
     */
    private static String getDotExpressionAtPosition(String line, int position) {
        if (line.isEmpty() || position >= line.length()) {
            return null;
        }
        
        // Find the start of the expression
        int start = position;
        
        // Include dots and word characters
        while (start > 0 && (isWordChar(line.charAt(start - 1)) || line.charAt(start - 1) == '.')) {
            start--;
        }
        
        // Find the end of the expression
        int end = position;
        while (end < line.length() && (isWordChar(line.charAt(end)) || line.charAt(end) == '.')) {
            end++;
        }
        
        if (start < end) {
            String expr = line.substring(start, end);
            // Only return expressions with dots
            if (expr.contains(".")) {
                return expr;
            }
        }
        
        return null;
    }
    
    /**
     * Determines if the character is a valid word character for Java identifiers
     */
    private static boolean isWordChar(char c) {
        return Character.isLetterOrDigit(c) || c == '_';
    }
    
    /**
     * Try to get hover information based on context (method, variable, etc.)
     */
    private static String getHoverForContext(String text, String[] lines, int lineIndex, String word, Position position) {
        // Check for method declaration
        String methodPattern = "\\b(public|protected|private|static|\\s)*\\s+[\\w<>\\[\\]]+\\s+" + Pattern.quote(word) + "\\s*\\(";
        Pattern pattern = Pattern.compile(methodPattern);
        
        for (int i = Math.max(0, lineIndex - 10); i <= Math.min(lines.length - 1, lineIndex + 10); i++) {
            Matcher matcher = pattern.matcher(lines[i]);
            if (matcher.find()) {
                // Extract method signature and surrounding comments
                StringBuilder sb = new StringBuilder();
                sb.append("**Method**: `").append(word).append("`\n\n");
                
                // Look for JavaDoc comment before method
                String javadoc = extractJavadoc(lines, i);
                if (javadoc != null) {
                    sb.append(javadoc).append("\n\n");
                }
                
                // Add method signature
                sb.append("```java\n");
                sb.append(lines[i].trim());
                
                // Add method body start
                int j = i + 1;
                while (j < lines.length && !lines[j].contains("{")) {
                    sb.append("\n").append(lines[j].trim());
                    j++;
                }
                
                if (j < lines.length) {
                    sb.append("\n").append(lines[j].trim());
                }
                
                sb.append("\n```");
                
                return sb.toString();
            }
        }
        
        // Check for variable declaration
        String varPattern = "\\b(public|protected|private|static|\\s)*\\s+[\\w<>\\[\\]]+\\s+" + Pattern.quote(word) + "\\s*(=|;)";
        pattern = Pattern.compile(varPattern);
        
        for (int i = Math.max(0, lineIndex - 5); i <= Math.min(lines.length - 1, lineIndex + 5); i++) {
            Matcher matcher = pattern.matcher(lines[i]);
            if (matcher.find()) {
                // Extract variable declaration
                StringBuilder sb = new StringBuilder();
                sb.append("**Variable**: `").append(word).append("`\n\n");
                
                // Add variable declaration
                sb.append("```java\n");
                sb.append(lines[i].trim());
                sb.append("\n```");
                
                return sb.toString();
            }
        }
        
        // Check for class declaration
        String classPattern = "\\b(public|protected|private|abstract|\\s)*\\s+class\\s+" + Pattern.quote(word) + "\\b";
        pattern = Pattern.compile(classPattern);
        
        for (int i = 0; i < lines.length; i++) {
            Matcher matcher = pattern.matcher(lines[i]);
            if (matcher.find()) {
                // Extract class declaration
                StringBuilder sb = new StringBuilder();
                sb.append("**Class**: `").append(word).append("`\n\n");
                
                // Look for JavaDoc comment before class
                String javadoc = extractJavadoc(lines, i);
                if (javadoc != null) {
                    sb.append(javadoc).append("\n\n");
                }
                
                // Add class declaration and first lines
                sb.append("```java\n");
                sb.append(lines[i].trim());
                
                int count = 0;
                for (int j = i + 1; j < lines.length && count < 5; j++) {
                    if (!lines[j].trim().isEmpty()) {
                        sb.append("\n").append(lines[j].trim());
                        count++;
                    }
                }
                
                sb.append("\n...\n```");
                
                return sb.toString();
            }
        }
        
        // Default hover for Java keywords
        if (Arrays.asList("public", "private", "protected", "static", "final", "abstract", "class", 
                          "interface", "enum", "extends", "implements", "return", "if", "else", 
                          "for", "while", "do", "switch", "case", "break", "continue", "try", 
                          "catch", "finally", "throw", "throws", "new", "this", "super", "void",
                          "int", "boolean", "char", "byte", "short", "long", "float", "double").contains(word)) {
            
            return String.format("**Java Keyword**: `%s`\n\n", word) +
                   getKeywordDescription(word);
        }
        
        return null;
    }
    
    /**
     * Extract JavaDoc comment from code
     */
    private static String extractJavadoc(String[] lines, int methodLineIndex) {
        int commentStart = -1;
        
        // Look for JavaDoc start
        for (int i = methodLineIndex - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (line.startsWith("/**")) {
                commentStart = i;
                break;
            } else if (!line.isEmpty() && !line.startsWith("//")) {
                // Stop if we encounter non-empty, non-comment line
                break;
            }
        }
        
        if (commentStart >= 0) {
            StringBuilder javadoc = new StringBuilder();
            
            // Extract JavaDoc content
            for (int i = commentStart; i < methodLineIndex; i++) {
                String line = lines[i].trim();
                if (line.startsWith("/**")) {
                    // First line
                    String content = line.substring(3).trim();
                    if (!content.isEmpty()) {
                        javadoc.append(content).append(" ");
                    }
                } else if (line.startsWith("*/")) {
                    // Last line
                    break;
                } else if (line.startsWith("*")) {
                    // Middle line
                    String content = line.substring(1).trim();
                    
                    // Handle @param, @return, etc.
                    if (content.startsWith("@param")) {
                        javadoc.append("\n- **Parameter**: ").append(content.substring(6).trim());
                    } else if (content.startsWith("@return")) {
                        javadoc.append("\n- **Returns**: ").append(content.substring(7).trim());
                    } else if (content.startsWith("@throws")) {
                        javadoc.append("\n- **Throws**: ").append(content.substring(7).trim());
                    } else if (!content.isEmpty()) {
                        javadoc.append(content).append(" ");
                    } else {
                        javadoc.append("\n");
                    }
                }
            }
            
            return javadoc.toString().trim();
        }
        
        return null;
    }
    
    /**
     * Get description for Java keyword
     */
    private static String getKeywordDescription(String keyword) {
        switch (keyword) {
            case "public":
                return "Access modifier that makes a class, method, or field accessible from any other class.";
            case "private":
                return "Access modifier that restricts access to the class in which it is declared.";
            case "protected":
                return "Access modifier that allows access within the same package and by subclasses.";
            case "static":
                return "Keyword that makes a member belong to the type itself, rather than to an instance of that type.";
            case "final":
                return "Keyword that indicates that a variable can only be assigned once, a method cannot be overridden, or a class cannot be subclassed.";
            case "abstract":
                return "Keyword used to declare abstract classes or methods that must be implemented by subclasses.";
            case "class":
                return "Keyword used to declare a class.";
            case "interface":
                return "Keyword used to declare an interface, which defines a contract that implementing classes must fulfill.";
            case "enum":
                return "Keyword used to declare a type with a fixed set of constants.";
            case "extends":
                return "Keyword used to indicate that a class is derived from another class.";
            case "implements":
                return "Keyword used to indicate that a class implements an interface.";
            case "return":
                return "Keyword used to exit from a method, optionally providing a value.";
            case "if":
                return "Keyword used for conditional branching.";
            case "else":
                return "Keyword used with 'if' for alternative branching.";
            case "for":
                return "Keyword used to create a loop that iterates a specified number of times.";
            case "while":
                return "Keyword used to create a loop that continues as long as a condition is true.";
            case "do":
                return "Keyword used with 'while' to create a loop that executes at least once.";
            case "switch":
                return "Keyword used for multi-way branching based on a value.";
            case "case":
                return "Keyword used in a switch statement to identify a specific case to match.";
            case "break":
                return "Keyword used to exit a loop or switch statement.";
            case "continue":
                return "Keyword used to skip the current iteration of a loop and continue with the next.";
            case "try":
                return "Keyword used to start a block of code that might throw exceptions.";
            case "catch":
                return "Keyword used with 'try' to handle exceptions.";
            case "finally":
                return "Keyword used with 'try' to provide code that is always executed, regardless of exceptions.";
            case "throw":
                return "Keyword used to explicitly throw an exception.";
            case "throws":
                return "Keyword used in method declarations to indicate that the method might throw certain exceptions.";
            case "new":
                return "Keyword used to create new objects.";
            case "this":
                return "Keyword that refers to the current instance of the class.";
            case "super":
                return "Keyword used to refer to the superclass.";
            case "void":
                return "Keyword used to indicate that a method does not return a value.";
            case "int":
                return "Primitive data type for integer values (32-bit signed).";
            case "boolean":
                return "Primitive data type for boolean values (true/false).";
            case "char":
                return "Primitive data type for character values (16-bit Unicode).";
            case "byte":
                return "Primitive data type for byte values (8-bit signed).";
            case "short":
                return "Primitive data type for short integer values (16-bit signed).";
            case "long":
                return "Primitive data type for long integer values (64-bit signed).";
            case "float":
                return "Primitive data type for floating-point values (32-bit).";
            case "double":
                return "Primitive data type for double-precision floating-point values (64-bit).";
            default:
                return "Java keyword.";
        }
    }
}
