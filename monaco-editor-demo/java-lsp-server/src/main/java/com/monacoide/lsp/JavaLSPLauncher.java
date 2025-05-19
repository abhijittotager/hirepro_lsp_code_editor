package com.monacoide.lsp;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.websocket.server.config.JettyWebSocketServletContainerInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main entry point for the Java LSP server.
 * This class sets up a WebSocket server that connects the LSP protocol
 * to browsers running Monaco Editor.
 */
public class JavaLSPLauncher {
    private static final Logger LOG = LoggerFactory.getLogger(JavaLSPLauncher.class);
    private static final int DEFAULT_PORT = 8090;
    
    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        
        // Parse command-line arguments for port if provided
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                LOG.warn("Invalid port number: {}. Using default port: {}", args[0], DEFAULT_PORT);
            }
        }
        
        try {
            // Create and configure the Jetty server
            Server server = new Server();
            ServerConnector connector = new ServerConnector(server);
            connector.setPort(port);
            server.addConnector(connector);
            
            // Set up the WebSocket context
            ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
            context.setContextPath("/");
            server.setHandler(context);
            
            // Configure WebSocket support
            JettyWebSocketServletContainerInitializer.configure(context, (servletContext, wsContainer) -> {
                // Set idle timeout
                wsContainer.setIdleTimeout(300000);
                
                // Register our WebSocket endpoint
                wsContainer.addMapping("/jdt.ls", (req, resp) -> new JavaLSPWebSocket());
                
                LOG.info("WebSocket endpoint registered at /jdt.ls");
            });
            
            // Start the server
            server.start();
            LOG.info("Java LSP Server started on port {}", port);
            LOG.info("WebSocket endpoint available at: ws://localhost:{}/jdt.ls", port);
            
            // Keep the server running
            server.join();
        } catch (Exception e) {
            LOG.error("Error starting Java LSP server", e);
            System.exit(1);
        }
    }
}
