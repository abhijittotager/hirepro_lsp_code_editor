package com.monacoide.lsp;

import java.io.IOException;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.lsp4j.jsonrpc.MessageConsumer;
import org.eclipse.lsp4j.jsonrpc.MessageIssueHandler;
import org.eclipse.lsp4j.jsonrpc.MessageProducer;
import org.eclipse.lsp4j.jsonrpc.messages.Message;
import org.eclipse.lsp4j.jsonrpc.json.MessageJsonHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Reads LSP messages from a WebSocket connection and converts them
 * to LSP4J Message objects.
 */
public class WebSocketMessageReader implements MessageProducer {
    private static final Logger LOG = LoggerFactory.getLogger(WebSocketMessageReader.class);
    private final BlockingQueue<String> messageQueue = new LinkedBlockingQueue<>();
    private final MessageJsonHandler jsonHandler;
    private final Session session;
    private MessageConsumer callback;
    
    public WebSocketMessageReader(Session session) {
        this.session = session;
        this.jsonHandler = new MessageJsonHandler(null);
    }
    
    public void processMessage(String message) {
        try {
            if (callback != null) {
                // Parse the message as JSON
                JsonObject jsonObject = JsonParser.parseString(message).getAsJsonObject();
                
                // Convert to LSP4J message
                Message lspMessage = jsonHandler.parseMessage(jsonObject);
                
                // Pass to callback
                callback.consume(lspMessage);
            } else {
                // If no callback yet, queue the message
                messageQueue.add(message);
            }
        } catch (Exception e) {
            LOG.error("Error processing WebSocket message", e);
        }
    }
    
    @Override
    public void listen(MessageConsumer callback) {
        this.callback = callback;
        
        // Process any queued messages
        while (!messageQueue.isEmpty()) {
            try {
                String message = messageQueue.poll(100, TimeUnit.MILLISECONDS);
                if (message != null) {
                    processMessage(message);
                }
            } catch (InterruptedException e) {
                LOG.error("Interrupted while processing message queue", e);
                Thread.currentThread().interrupt();
            }
        }
        
        // Set up listener for future messages
        session.getPolicy().setTextMessageConsumer(this::processMessage);
    }

    @Override
    public void listen(MessageConsumer callback, MessageIssueHandler issueHandler) {
        listen(callback);
    }
}
