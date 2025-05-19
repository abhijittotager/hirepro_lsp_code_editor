import asyncio
import json
import sys
import os
import logging
from pylsp.python_lsp import PythonLSPServer
from pylsp_jsonrpc.dispatchers import MethodDispatcher

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('pylsp')

class LSPHandler(MethodDispatcher):
    def __init__(self):
        self.server = None
        self.initialize_params = None
        logger.info("LSPHandler initialized")

    def initialize(self, params):
        logger.info("Initializing LSP server with params: %s", params)
        self.initialize_params = params
        return {
            'capabilities': {
                'textDocumentSync': 1,  # Full sync
                'completionProvider': {
                    'triggerCharacters': ['.']
                },
                'hoverProvider': True,
                'signatureHelpProvider': {
                    'triggerCharacters': ['(', ',']
                },
                'definitionProvider': True,
                'referencesProvider': True,
                'documentSymbolProvider': True,
                'workspaceSymbolProvider': True,
                'codeActionProvider': True,
                'documentFormattingProvider': True,
                'documentRangeFormattingProvider': True,
                'renameProvider': True
            }
        }

    def initialized(self, params):
        logger.info("LSP server initialized")
        pass

    def shutdown(self):
        logger.info("Shutting down LSP server")
        if self.server:
            self.server.shutdown()
        return None

    def exit(self):
        logger.info("Exiting LSP server")
        if self.server:
            self.server.exit()
        sys.exit(0)

def main():
    try:
        logger.info("Starting Python LSP server")
        
        # Create stdin/stdout streams
        stdin = sys.stdin.buffer
        stdout = sys.stdout.buffer

        # Create the LSP server
        handler = LSPHandler()
        server = PythonLSPServer(handler, stdin, stdout)
        handler.server = server

        # Start the server
        logger.info("LSP server ready")
        server.start()
    except Exception as e:
        logger.error("Error starting LSP server: %s", e, exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main() 