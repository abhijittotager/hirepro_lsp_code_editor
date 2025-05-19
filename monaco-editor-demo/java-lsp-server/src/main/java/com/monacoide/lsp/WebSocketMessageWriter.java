package com.monacoide.lsp;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.lsp4j.jsonrpc.MessageConsumer;
import org.eclipse.lsp4j.jsonrpc.json.MessageJsonHandler;
import org.eclipse.lsp4j.jsonrpc.messages.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;

/**
 * Writes LSP messages to a WebSocket connection.
 */
public class WebSocketMessageWriter implements MessageConsumer {
    private static final Logger LOG = LoggerFactory.getLogger(WebSocketMessageWriter.class);
    private final Session session;
    private final MessageJsonHandler jsonHandler;
    
    public WebSocketMessageWriter(Session session) {
        this.session = session;
        this.jsonHandler = new MessageJsonHandler(null);
    }
    
    @Override
    public void consume(Message message) {
        try {
            // Convert LSP message to JSON
            JsonElement json = jsonHandler.toJson(message);
            String content = json.toString();
            
            // Send message via WebSocket
            if (session.isOpen()) {
                CompletableFuture.runAsync(() -> {
                    try {
                        session.getRemote().sendString(content);
                        LOG.debug("Sent message: {}", content);
                    } catch (IOException e) {
                        LOG.error("Failed to send message", e);
                    }
                });
            } else {
                LOG.warn("Cannot send message, WebSocket session is closed");
            }
        } catch (Exception e) {
            LOG.error("Error processing message for sending", e);
        }
    }
}
