package com.monacoide.lsp;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;

import java.time.Duration;

/**
 * Simple WebSocket server for the Java LSP implementation
 */
public class JavaLSPWebSocketServer {
    private static final int PORT = 8090;
    
    public static void main(String[] args) {
        try {
            // Create and configure the Jetty server
            Server server = new Server();
            ServerConnector connector = new ServerConnector(server);
            connector.setPort(PORT);
            server.addConnector(connector);
            
            // Set up the WebSocket handler
            ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
            context.setContextPath("/");
            server.setHandler(context);
            
            // Configure WebSocket
            JettyWebSocketServletContainerInitializer.configure(context, (servletContext, wsContainer) -> {
                wsContainer.addMapping("/jdt.ls", (req, resp) -> new JavaLSPWebSocket());
                wsContainer.setIdleTimeout(Duration.ofMillis(0));  // No timeout
                wsContainer.setMaxTextMessageSize(65535);
            });
            
            // Start the server
            server.start();
            System.out.println("Java LSP server started on ws://localhost:" + PORT + "/jdt.ls");
            
            // Keep the server running
            server.join();
        } catch (Exception e) {
            System.err.println("Error starting Java LSP server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
