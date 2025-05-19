import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * A simple LSP server for testing Monaco editor integration.
 * This doesn't require Maven or external dependencies.
 */
public class SimpleLSPServer {
    private static final int PORT = 8090;
    private static final ExecutorService threadPool = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("Simple Java LSP Server started on port " + PORT);
            System.out.println("Connect with your Monaco editor to test integration");
            
            while (true) {
                try {
                    // Accept client connections
                    Socket clientSocket = serverSocket.accept();
                    System.out.println("New client connected: " + clientSocket.getInetAddress());
                    
                    // Handle each client in a separate thread
                    threadPool.execute(() -> handleClient(clientSocket));
                } catch (IOException e) {
                    System.err.println("Error accepting client connection: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            System.err.println("Could not start server on port " + PORT + ": " + e.getMessage());
        }
    }

    private static void handleClient(Socket clientSocket) {
        try (
            BufferedReader reader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            PrintWriter writer = new PrintWriter(clientSocket.getOutputStream(), true)
        ) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("Received: " + line);
                
                // Simple response for testing
                if (line.contains("textDocument/completion")) {
                    // Send back some completion items
                    String completionResponse = createCompletionResponse();
                    writer.println(completionResponse);
                } else if (line.contains("textDocument/hover")) {
                    // Send back hover information
                    String hoverResponse = createHoverResponse();
                    writer.println(hoverResponse);
                } else if (line.contains("initialize")) {
                    // Send initialize response
                    String initResponse = createInitializeResponse();
                    writer.println(initResponse);
                } else {
                    // Generic response
                    writer.println("{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{}}");
                }
            }
        } catch (IOException e) {
            System.err.println("Error handling client: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
                System.out.println("Client disconnected");
            } catch (IOException e) {
                System.err.println("Error closing client socket: " + e.getMessage());
            }
        }
    }

    private static String createCompletionResponse() {
        return "{"
            + "\"jsonrpc\":\"2.0\","
            + "\"id\":1,"
            + "\"result\":{"
            + "  \"isIncomplete\":false,"
            + "  \"items\":["
            + "    {\"label\":\"println\",\"kind\":2,\"detail\":\"void println(String s)\",\"insertText\":\"println(\\\"${1:message}\\\")\"},"
            + "    {\"label\":\"print\",\"kind\":2,\"detail\":\"void print(String s)\",\"insertText\":\"print(\\\"${1:message}\\\")\"},"
            + "    {\"label\":\"printf\",\"kind\":2,\"detail\":\"void printf(String format, Object... args)\",\"insertText\":\"printf(\\\"${1:format}\\\", ${2:args})\"}"
            + "  ]"
            + "}}";
    }

    private static String createHoverResponse() {
        return "{"
            + "\"jsonrpc\":\"2.0\","
            + "\"id\":1,"
            + "\"result\":{"
            + "  \"contents\":{"
            + "    \"kind\":\"markdown\","
            + "    \"value\":\"**System.out.println**\\n\\nPrints a string and then terminates the line.\""
            + "  }"
            + "}}";
    }

    private static String createInitializeResponse() {
        return "{"
            + "\"jsonrpc\":\"2.0\","
            + "\"id\":1,"
            + "\"result\":{"
            + "  \"capabilities\":{"
            + "    \"textDocumentSync\":1,"
            + "    \"completionProvider\":{\"triggerCharacters\":[\".\"]},"
            + "    \"hoverProvider\":true,"
            + "    \"signatureHelpProvider\":{\"triggerCharacters\":[\"(\",\",\"]},"
            + "    \"definitionProvider\":true,"
            + "    \"typeDefinitionProvider\":true,"
            + "    \"implementationProvider\":true,"
            + "    \"documentSymbolProvider\":true,"
            + "    \"workspaceSymbolProvider\":true,"
            + "    \"codeActionProvider\":true,"
            + "    \"codeLensProvider\":{\"resolveProvider\":true},"
            + "    \"documentFormattingProvider\":true,"
            + "    \"documentRangeFormattingProvider\":true,"
            + "    \"renameProvider\":true,"
            + "    \"documentHighlightProvider\":true"
            + "  }"
            + "}}";
    }
}
