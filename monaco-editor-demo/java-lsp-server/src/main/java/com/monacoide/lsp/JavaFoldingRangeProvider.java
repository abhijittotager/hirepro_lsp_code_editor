package com.monacoide.lsp;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.eclipse.lsp4j.FoldingRange;
import org.eclipse.lsp4j.FoldingRangeKind;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Provides folding ranges for Java code
 */
public class JavaFoldingRangeProvider {
    private static final Logger LOG = LoggerFactory.getLogger(JavaFoldingRangeProvider.class);
    
    /**
     * Provides folding ranges for the given text
     */
    public static List<FoldingRange> provideFoldingRanges(String text) {
        List<FoldingRange> ranges = new ArrayList<>();
        
        try {
            // Split the text into lines
            String[] lines = text.split("\\r?\\n");
            
            // Find folding ranges
            findBraceFoldingRanges(lines, ranges);
            findCommentFoldingRanges(lines, ranges);
            findImportFoldingRanges(lines, ranges);
            findMethodFoldingRanges(lines, ranges);
            
        } catch (Exception e) {
            LOG.error("Error providing folding ranges", e);
        }
        
        return ranges;
    }
    
    /**
     * Find folding ranges based on braces
     */
    private static void findBraceFoldingRanges(String[] lines, List<FoldingRange> ranges) {
        Stack<Integer> startLines = new Stack<>();
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            
            // Count opening and closing braces
            int openBraces = countChar(line, '{');
            int closeBraces = countChar(line, '}');
            
            // Handle opening braces
            for (int j = 0; j < openBraces; j++) {
                startLines.push(i);
            }
            
            // Handle closing braces
            for (int j = 0; j < closeBraces; j++) {
                if (!startLines.isEmpty()) {
                    int start = startLines.pop();
                    
                    // Only create folding range if it spans multiple lines
                    if (i > start) {
                        FoldingRange range = new FoldingRange();
                        range.setStartLine(start);
                        range.setEndLine(i);
                        range.setKind(FoldingRangeKind.Region);
                        ranges.add(range);
                    }
                }
            }
        }
    }
    
    /**
     * Find folding ranges for comments
     */
    private static void findCommentFoldingRanges(String[] lines, List<FoldingRange> ranges) {
        int startLine = -1;
        boolean inBlockComment = false;
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // Block comment start
            if (line.startsWith("/*") || line.startsWith("/**")) {
                startLine = i;
                inBlockComment = true;
            }
            
            // Block comment end
            if (inBlockComment && line.endsWith("*/")) {
                inBlockComment = false;
                
                // Only create folding range if it spans multiple lines
                if (i > startLine) {
                    FoldingRange range = new FoldingRange();
                    range.setStartLine(startLine);
                    range.setEndLine(i);
                    range.setKind(FoldingRangeKind.Comment);
                    ranges.add(range);
                }
            }
            
            // Multiple single-line comments
            if (line.startsWith("//")) {
                int j = i;
                while (j + 1 < lines.length && lines[j + 1].trim().startsWith("//")) {
                    j++;
                }
                
                // Only create folding range if it spans multiple lines
                if (j > i) {
                    FoldingRange range = new FoldingRange();
                    range.setStartLine(i);
                    range.setEndLine(j);
                    range.setKind(FoldingRangeKind.Comment);
                    ranges.add(range);
                    
                    // Skip the lines we've processed
                    i = j;
                }
            }
        }
    }
    
    /**
     * Find folding ranges for import statements
     */
    private static void findImportFoldingRanges(String[] lines, List<FoldingRange> ranges) {
        int startLine = -1;
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // First import statement
            if (startLine == -1 && line.startsWith("import ")) {
                startLine = i;
            }
            
            // Not an import statement and not an empty line or comment
            if (startLine != -1 && !line.startsWith("import ") && !line.isEmpty() && 
                !line.startsWith("//") && !line.startsWith("/*")) {
                
                // Only create folding range if it spans multiple lines
                if (i - 1 > startLine) {
                    FoldingRange range = new FoldingRange();
                    range.setStartLine(startLine);
                    range.setEndLine(i - 1);
                    range.setKind(FoldingRangeKind.Imports);
                    ranges.add(range);
                }
                
                startLine = -1;
            }
        }
        
        // Handle case where imports continue to the end of the file
        if (startLine != -1 && startLine < lines.length - 1) {
            FoldingRange range = new FoldingRange();
            range.setStartLine(startLine);
            range.setEndLine(lines.length - 1);
            range.setKind(FoldingRangeKind.Imports);
            ranges.add(range);
        }
    }
    
    /**
     * Find folding ranges for method declarations
     */
    private static void findMethodFoldingRanges(String[] lines, List<FoldingRange> ranges) {
        // Pattern for method declarations
        Pattern methodPattern = Pattern.compile("^\\s*(public|protected|private|static|\\s)*\\s+[\\w<>\\[\\]]+\\s+[\\w]+\\s*\\([^\\)]*\\)\\s*(throws\\s+[\\w\\s,]+)?\\s*\\{");
        
        for (int i = 0; i < lines.length; i++) {
            Matcher matcher = methodPattern.matcher(lines[i]);
            
            if (matcher.find()) {
                // Found a method declaration
                int startLine = i;
                
                // Find the matching closing brace
                int braceCount = 1;
                int endLine = -1;
                
                for (int j = i + 1; j < lines.length; j++) {
                    String line = lines[j];
                    
                    braceCount += countChar(line, '{');
                    braceCount -= countChar(line, '}');
                    
                    if (braceCount == 0) {
                        endLine = j;
                        break;
                    }
                }
                
                // If we found the matching closing brace, create a folding range
                if (endLine > startLine) {
                    FoldingRange range = new FoldingRange();
                    range.setStartLine(startLine);
                    range.setEndLine(endLine);
                    range.setKind(FoldingRangeKind.Region);
                    ranges.add(range);
                }
            }
        }
    }
    
    /**
     * Count occurrences of a character in a string
     */
    private static int countChar(String str, char ch) {
        int count = 0;
        for (int i = 0; i < str.length(); i++) {
            if (str.charAt(i) == ch) {
                count++;
            }
        }
        return count;
    }
}
