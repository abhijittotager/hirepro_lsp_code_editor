package com.monacoide.lsp;

import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;
import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.services.LanguageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * WebSocket endpoint that connects browser clients to the Java LSP server.
 * This class handles the WebSocket connection and bridges it to the LSP protocol.
 */
public class JavaLSPWebSocket extends WebSocketAdapter {
    private static final Logger LOG = LoggerFactory.getLogger(JavaLSPWebSocket.class);
    private ExecutorService executor;
    private JavaLanguageServer languageServer;
    private Launcher<LanguageClient> launcher;
    
    @Override
    public void onWebSocketConnect(Session session) {
        super.onWebSocketConnect(session);
        LOG.info("WebSocket connection established");
        
        try {
            // Create the executor service
            this.executor = Executors.newCachedThreadPool();
            
            // Create new language server instance
            this.languageServer = new JavaLanguageServer();
            
            // For a simplified version, we'll use the builder API
            // In a full implementation, we would have proper stream adapters
            PipedInputStream in = new PipedInputStream();
            PipedOutputStream out = new PipedOutputStream();
            
            try {
                in.connect(new PipedOutputStream()); // dummy connection
                out.connect(new PipedInputStream()); // dummy connection
            } catch (IOException e) {
                LOG.error("Error setting up pipes", e);
            }
            
            // Create the launcher using the builder
            this.launcher = new Launcher.Builder<LanguageClient>()
                .setLocalService(languageServer)
                .setRemoteInterface(LanguageClient.class)
                .setInput(in)
                .setOutput(out)
                .setExecutorService(executor)
                .create();
            
            // Connect the language server to the client
            languageServer.connect(launcher.getRemoteProxy());
            
            // Start listening for incoming messages - in a real implementation,
            // this would be integrated with the WebSocket messages
            launcher.startListening();
            
            LOG.info("Language server connected to client");
        } catch (Exception e) {
            LOG.error("Error initializing language server connection", e);
            session.close(500, "Error initializing language server: " + e.getMessage());
        }
    }
    
    /**
     * Process incoming WebSocket messages
     */
    @Override
    public void onWebSocketText(String message) {
        LOG.debug("Received message: {}", message);
        try {
            // In a complete implementation, we'd parse the JSON message
            // and forward it to the language server via LSP4J
            
            // For now, just echo it back
            Session currentSession = getSession();
            if (currentSession != null && currentSession.isOpen()) {
                currentSession.getRemote().sendString("Received: " + message);
            }
        } catch (IOException e) {
            LOG.error("Error processing message", e);
        }
    }
    
    // Implementation was merged with the other onWebSocketText method
    
    @Override
    public void onWebSocketClose(int statusCode, String reason) {
        LOG.info("WebSocket closed: {} - {}", statusCode, reason);
        
        // Shutdown language server
        if (languageServer != null) {
            languageServer.shutdown();
            languageServer.exit();
        }
        
        // Shutdown executor
        if (executor != null) {
            executor.shutdown();
        }
        
        super.onWebSocketClose(statusCode, reason);
    }
    
    @Override
    public void onWebSocketError(Throwable cause) {
        LOG.error("WebSocket error", cause);
        super.onWebSocketError(cause);
    }
}
