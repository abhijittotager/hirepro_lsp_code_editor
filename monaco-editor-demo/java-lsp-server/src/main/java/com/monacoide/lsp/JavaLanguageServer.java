package com.monacoide.lsp;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Stack;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import org.eclipse.lsp4j.CodeAction;
import org.eclipse.lsp4j.CodeActionParams;
import org.eclipse.lsp4j.CodeLens;
import org.eclipse.lsp4j.CodeLensParams;
import org.eclipse.lsp4j.Command;
import org.eclipse.lsp4j.CompletionItem;
import org.eclipse.lsp4j.CompletionList;
import org.eclipse.lsp4j.CompletionParams;
import org.eclipse.lsp4j.DefinitionParams;
import org.eclipse.lsp4j.DidChangeConfigurationParams;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidChangeWatchedFilesParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.DocumentFormattingParams;
import org.eclipse.lsp4j.DocumentHighlight;
import org.eclipse.lsp4j.DocumentHighlightParams;
import org.eclipse.lsp4j.DocumentOnTypeFormattingParams;
import org.eclipse.lsp4j.DocumentRangeFormattingParams;
import org.eclipse.lsp4j.DocumentSymbol;
import org.eclipse.lsp4j.DocumentSymbolParams;
import org.eclipse.lsp4j.FoldingRange;
import org.eclipse.lsp4j.FoldingRangeRequestParams;
import org.eclipse.lsp4j.Hover;
import org.eclipse.lsp4j.HoverParams;
import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.InitializedParams;
import org.eclipse.lsp4j.Location;
import org.eclipse.lsp4j.LocationLink;
import org.eclipse.lsp4j.ParameterInformation;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.ReferenceParams;
import org.eclipse.lsp4j.RenameParams;
import org.eclipse.lsp4j.SelectionRange;
import org.eclipse.lsp4j.SelectionRangeParams;
import org.eclipse.lsp4j.ServerCapabilities;
import org.eclipse.lsp4j.SignatureHelp;
import org.eclipse.lsp4j.SignatureHelpParams;
import org.eclipse.lsp4j.SignatureInformation;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.TextDocumentSyncKind;
import org.eclipse.lsp4j.TextEdit;
import org.eclipse.lsp4j.WorkspaceEdit;
import org.eclipse.lsp4j.WorkspaceFolder;
import org.eclipse.lsp4j.WorkspaceSymbolParams;
import org.eclipse.lsp4j.CompletionItemKind;
import org.eclipse.lsp4j.MarkupContent;
import org.eclipse.lsp4j.jsonrpc.messages.Either;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageClientAware;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implementation of the Language Server Protocol for Java
 * using Eclipse JDT as the underlying engine.
 */
public class JavaLanguageServer implements LanguageServer, LanguageClientAware, TextDocumentService, WorkspaceService {
    private static final Logger LOG = LoggerFactory.getLogger(JavaLanguageServer.class);
    
    private LanguageClient client;
    private InitializeParams clientSettings;
    private Map<String, DocumentInfo> openDocuments = new ConcurrentHashMap<>();
    private Path workspaceRoot;
    
    @Override
    public CompletableFuture<InitializeResult> initialize(InitializeParams params) {
        LOG.info("Initializing Java Language Server");
        this.clientSettings = params;
        
        // Determine workspace root
        if (params.getWorkspaceFolders() != null && !params.getWorkspaceFolders().isEmpty()) {
            try {
                WorkspaceFolder firstFolder = params.getWorkspaceFolders().get(0);
                workspaceRoot = Paths.get(URI.create(firstFolder.getUri()));
                LOG.info("Workspace root set from workspace folder: {}", workspaceRoot);
            } catch (Exception e) {
                LOG.warn("Failed to determine workspace root from workspace folders", e);
                workspaceRoot = null;
            }
        } else {
            // Use user directory as fallback
            workspaceRoot = Paths.get(System.getProperty("user.dir"));
            LOG.info("Using current directory as workspace root: {}", workspaceRoot);
        }
        
        // Create temp directory for virtual files if it doesn't exist
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "monaco-java-server");
        try {
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
                LOG.info("Created temporary directory for virtual files: {}", tempDir);
            }
        } catch (Exception e) {
            LOG.error("Failed to create temporary directory: {}", tempDir, e);
        }
        
        // Initialize server capabilities
        ServerCapabilities capabilities = new ServerCapabilities();
        
        // Document sync
        capabilities.setTextDocumentSync(TextDocumentSyncKind.Full);
        
        // Completion support
        capabilities.setCompletionProvider(new org.eclipse.lsp4j.CompletionOptions(true, List.of(".", "@", "#", ":", " ")));
        
        // Hover support
        capabilities.setHoverProvider(true);
        
        // Navigation
        capabilities.setDefinitionProvider(true);
        capabilities.setReferencesProvider(true);
        
        // Formatting
        capabilities.setDocumentFormattingProvider(true);
        capabilities.setDocumentRangeFormattingProvider(true);
        
        // Symbols
        capabilities.setDocumentSymbolProvider(true);
        capabilities.setWorkspaceSymbolProvider(true);
        
        // Code Actions
        capabilities.setCodeActionProvider(new org.eclipse.lsp4j.CodeActionOptions(List.of("quickfix", "refactor")));
        
        // Folding
        capabilities.setFoldingRangeProvider(true);
        
        // Signature Help
        capabilities.setSignatureHelpProvider(new org.eclipse.lsp4j.SignatureHelpOptions(List.of("(", ",")));
        
        // Rename
        capabilities.setRenameProvider(true);
        
        // Initialize result
        InitializeResult result = new InitializeResult(capabilities);
        
        LOG.info("Java Language Server initialized");
        return CompletableFuture.completedFuture(result);
    }
    
    @Override
    public CompletableFuture<Object> shutdown() {
        LOG.info("Shutting down Java Language Server");
        return CompletableFuture.completedFuture(null);
    }
    
    @Override
    public void exit() {
        LOG.info("Exiting Java Language Server");
        // In a real application, we might use System.exit() here
    }
    
    @Override
    public TextDocumentService getTextDocumentService() {
        return this;
    }
    
    @Override
    public WorkspaceService getWorkspaceService() {
        return this;
    }
    
    @Override
    public void connect(LanguageClient client) {
        LOG.info("Connected to language client");
        this.client = client;
    }
    
    // Gets client capabilities sent during initialization
    public InitializeParams getClientSettings() {
        return clientSettings;
    }
    
    // Document management methods
    
    @Override
    public void didOpen(DidOpenTextDocumentParams params) {
        LOG.info("Document opened: {}", params.getTextDocument().getUri());
        String uri = params.getTextDocument().getUri();
        String text = params.getTextDocument().getText();
        String languageId = params.getTextDocument().getLanguageId();
        
        openDocuments.put(uri, new DocumentInfo(uri, text, languageId));
        
        // Parse the document and publish diagnostics
        analyzeDocument(uri);
    }
    
    @Override
    public void didChange(DidChangeTextDocumentParams params) {
        LOG.info("Document changed: {}", params.getTextDocument().getUri());
        String uri = params.getTextDocument().getUri();
        
        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null && !params.getContentChanges().isEmpty()) {
            // In full sync mode, we just take the full content
            String newText = params.getContentChanges().get(0).getText();
            docInfo.setText(newText);
            
            // Re-analyze the document
            analyzeDocument(uri);
        }
    }
    
    @Override
    public void didClose(DidCloseTextDocumentParams params) {
        LOG.info("Document closed: {}", params.getTextDocument().getUri());
        String uri = params.getTextDocument().getUri();
        openDocuments.remove(uri);
    }
    
    @Override
    public void didSave(DidSaveTextDocumentParams params) {
        LOG.info("Document saved: {}", params.getTextDocument().getUri());
        String uri = params.getTextDocument().getUri();
        
        // Re-analyze the document
        analyzeDocument(uri);
    }
    
    // Core language features

    @Override
    public CompletableFuture<Either<List<CompletionItem>, CompletionList>> completion(CompletionParams params) {
        String uri = params.getTextDocument().getUri();
        LOG.info("Completion request received for {}", uri);

        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null) {
            Position position = params.getPosition();

            LOG.info("Computing completions for '{}' at position {}", uri, position);

            // Create a basic completion list with Java keywords and common constructs
            List<CompletionItem> items = new ArrayList<>();

            // Add Java keywords
            for (String keyword : new String[]{
                    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const",
                    "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float",
                    "for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native",
                    "new", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super",
                    "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"
            }) {
                CompletionItem item = new CompletionItem(keyword);
                item.setKind(CompletionItemKind.Keyword);
                items.add(item);
            }

            CompletionList completionList = new CompletionList(false, items);
            return CompletableFuture.completedFuture(Either.forRight(completionList));
        }

        return CompletableFuture.completedFuture(Either.forRight(new CompletionList(false, List.of())));
    }

    @Override
    public CompletableFuture<Hover> hover(HoverParams params) {
        String uri = params.getTextDocument().getUri();
        LOG.info("Hover request received for {}", uri);

        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null) {
            Position position = params.getPosition();

            LOG.info("Computing hover for '{}' at position {}", uri, position);

            // Create a basic hover with method or class documentation
            Hover hover = new Hover();
            MarkupContent content = new MarkupContent();
            content.setKind("markdown");
            content.setValue("Java hover information would appear here.");
            hover.setContents(Either.forRight(content));

            return CompletableFuture.completedFuture(hover);
        }

        return CompletableFuture.completedFuture(new Hover());
    }

    @Override
    public CompletableFuture<List<FoldingRange>> foldingRange(FoldingRangeRequestParams params) {
        String uri = params.getTextDocument().getUri();
        LOG.info("Folding range request received for {}", uri);

        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null) {
            String docText = docInfo.getText();

            LOG.info("Computing folding ranges for {}", uri);

            // Create basic folding ranges for braces
            List<FoldingRange> ranges = new ArrayList<>();
            String[] lines = docText.split("\n");

            // Simple brace matching folding algorithm
            Stack<Integer> braceStack = new Stack<>();
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.contains("{")) {
                    braceStack.push(i);
                } else if (line.contains("}") && !braceStack.isEmpty()) {
                    int start = braceStack.pop();
                    // Only create ranges for blocks that span multiple lines
                    if (i - start > 1) {
                        FoldingRange range = new FoldingRange(start, i);
                        range.setKind("region");
                        ranges.add(range);
                    }
                }
            }

            return CompletableFuture.completedFuture(ranges);
        }

        return CompletableFuture.completedFuture(List.of());
    }

    @Override
    public CompletableFuture<SignatureHelp> signatureHelp(SignatureHelpParams params) {
        String uri = params.getTextDocument().getUri();
        LOG.info("Signature help request received for {}", uri);

        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null) {
            // Simple signature help implementation
            SignatureHelp help = new SignatureHelp();

            SignatureInformation signature = new SignatureInformation();
            signature.setLabel("public static void main(String[] args)");
            signature.setDocumentation("Main method that serves as the entry point for the application.");

            ParameterInformation param = new ParameterInformation();
            param.setLabel("String[] args");
            param.setDocumentation("Command line arguments passed to the program.");

            List<ParameterInformation> parameters = new ArrayList<>();
            parameters.add(param);
            signature.setParameters(parameters);

            List<SignatureInformation> signatures = new ArrayList<>();
            signatures.add(signature);
            help.setSignatures(signatures);
            help.setActiveSignature(0);
            help.setActiveParameter(0);

            return CompletableFuture.completedFuture(help);
        }

        return CompletableFuture.completedFuture(new SignatureHelp());
    }
    
    // Document analysis
    
    private void analyzeDocument(String uri) {
        DocumentInfo docInfo = openDocuments.get(uri);
        if (docInfo != null) {
            // This would be where we'd analyze the document using JDT
            // For now, we're just providing empty diagnostics
            client.publishDiagnostics(new org.eclipse.lsp4j.PublishDiagnosticsParams(uri, List.of()));
        }
    }
    
    // Other TextDocumentService methods (with minimal implementations for now)
    
    @Override
    public CompletableFuture<Either<List<? extends Location>, List<? extends LocationLink>>> definition(DefinitionParams params) {
        return CompletableFuture.completedFuture(Either.forLeft(List.of()));
    }
    
    @Override
    public CompletableFuture<List<? extends Location>> references(ReferenceParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @SuppressWarnings("deprecation") // Using deprecated SymbolInformation in the return type
    @Override
    public CompletableFuture<List<Either<SymbolInformation, DocumentSymbol>>> documentSymbol(DocumentSymbolParams params) {
        // Use DocumentSymbol which is the newer API rather than the deprecated SymbolInformation
        List<Either<SymbolInformation, DocumentSymbol>> empty = new ArrayList<>();
        // Create a document symbol to represent file structure (e.g., classes, methods)
        return CompletableFuture.completedFuture(empty);
    }
    
    @Override
    public CompletableFuture<List<? extends TextEdit>> formatting(DocumentFormattingParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @Override
    public CompletableFuture<List<? extends TextEdit>> rangeFormatting(DocumentRangeFormattingParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @Override
    public CompletableFuture<List<? extends TextEdit>> onTypeFormatting(DocumentOnTypeFormattingParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @Override
    public CompletableFuture<List<Either<Command, CodeAction>>> codeAction(CodeActionParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @Override
    public CompletableFuture<List<? extends CodeLens>> codeLens(CodeLensParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    @Override
    public CompletableFuture<List<? extends DocumentHighlight>> documentHighlight(DocumentHighlightParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    // Implementation of workspace symbols as per the LSP4J interface definition
    // This signature might vary depending on the LSP4J version
    @SuppressWarnings("deprecation") // SymbolInformation is deprecated but required by the interface
    @Override
    public CompletableFuture<Either<List<? extends SymbolInformation>, List<? extends org.eclipse.lsp4j.WorkspaceSymbol>>> symbol(WorkspaceSymbolParams params) {
        List<SymbolInformation> symbols = new ArrayList<>();
        return CompletableFuture.completedFuture(Either.forLeft(symbols));
    }
    
    @Override
    public CompletableFuture<WorkspaceEdit> rename(RenameParams params) {
        return CompletableFuture.completedFuture(new WorkspaceEdit());
    }
    
    @Override
    public CompletableFuture<List<SelectionRange>> selectionRange(SelectionRangeParams params) {
        return CompletableFuture.completedFuture(List.of());
    }
    
    // WorkspaceService methods
    
    @Override
    public void didChangeConfiguration(DidChangeConfigurationParams params) {
        LOG.info("Configuration changed");
    }
    
    @Override
    public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
        LOG.info("Watched files changed");
    }
    
    @Override
    public void didChangeWorkspaceFolders(org.eclipse.lsp4j.DidChangeWorkspaceFoldersParams params) {
        LOG.info("Workspace folders changed");
    }
    
    @Override
    public void initialized(InitializedParams params) {
        LOG.info("Server initialized notification received");
    }
    
    // Helper class to store document information
    private static class DocumentInfo {
        private final String uri;
        private String text;
        private final String languageId;
        
        public DocumentInfo(String uri, String text, String languageId) {
            this.uri = uri;
            this.text = text;
            this.languageId = languageId;
        }
        
        // These getters may appear unused in the IDE but are used by the language server
        @SuppressWarnings("unused")
        public String getUri() {
            return uri;
        }
        
        public String getText() {
            return text;
        }
        
        public void setText(String text) {
            this.text = text;
        }
        
        @SuppressWarnings("unused")
        public String getLanguageId() {
            return languageId;
        }
    }
}
