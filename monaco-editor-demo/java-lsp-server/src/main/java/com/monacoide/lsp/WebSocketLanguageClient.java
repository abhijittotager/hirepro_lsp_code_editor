package com.monacoide.lsp;

import java.util.concurrent.CompletableFuture;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.lsp4j.MessageActionItem;
import org.eclipse.lsp4j.MessageParams;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.ShowMessageRequestParams;
import org.eclipse.lsp4j.services.LanguageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implementation of the LSP4J LanguageClient interface that forwards
 * notifications from the server to the WebSocket client.
 */
public class WebSocketLanguageClient implements LanguageClient {
    private static final Logger LOG = LoggerFactory.getLogger(WebSocketLanguageClient.class);
    private final Session session;
    
    public WebSocketLanguageClient(Session session) {
        this.session = session;
    }
    
    @Override
    public void telemetryEvent(Object object) {
        LOG.debug("Telemetry event: {}", object);
    }
    
    @Override
    public void publishDiagnostics(PublishDiagnosticsParams diagnostics) {
        LOG.debug("Publishing diagnostics for {}: {} issues", 
                diagnostics.getUri(), 
                diagnostics.getDiagnostics().size());
        // These are forwarded automatically through the JSON-RPC protocol
    }
    
    @Override
    public void showMessage(MessageParams messageParams) {
        LOG.debug("Show message: {}", messageParams.getMessage());
        // These are forwarded automatically through the JSON-RPC protocol
    }
    
    @Override
    public CompletableFuture<MessageActionItem> showMessageRequest(ShowMessageRequestParams requestParams) {
        LOG.debug("Show message request: {}", requestParams.getMessage());
        // These are forwarded automatically through the JSON-RPC protocol
        return CompletableFuture.completedFuture(null);
    }
    
    @Override
    public void logMessage(MessageParams messageParams) {
        LOG.debug("Log message [{}]: {}", messageParams.getType(), messageParams.getMessage());
        // These are forwarded automatically through the JSON-RPC protocol
    }
}
