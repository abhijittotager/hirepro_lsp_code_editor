// Monaco Editor configuration
// Make editor available globally for diagnostics and other tools
window.editor = null;
let currentLanguage = 'java';
let currentTheme = 'vs'; // Default light theme
let editorContainer = null;
let fileCache = {};
let pythonLSPConnector = null; // Store the Python LSP connector instance

// Java LSP references
let javaLSPAdapter = null;
let javaLSPConnector = null;

// Track document version
let documentVersion = 1;

// LSP server connection status
let lspConnected = false;

// File URI for the virtual document
let currentFileUri = 'file:///workspace/Main.java';

// Function to get appropriate file extension based on language
function getFileExtension(language) {
    const extensions = {
        'java': '.java',
        'javascript': '.js',
        'typescript': '.ts',
        'python': '.py',
        'csharp': '.cs',
        'html': '.html',
        'css': '.css'
    };
    return extensions[language] || '.txt';
}

// Function to generate a proper file URI
function generateFileUri(filename, language) {
    const extension = getFileExtension(language);
    if (!filename.endsWith(extension)) {
        filename = filename.replace(/\.[^/.]+$/, '') + extension;
    }
    return `file:///workspace/${filename}`;
}

// Flag to track if editor is initialized
let editorInitialized = false;

// Cleanup function for when the page is unloaded
function cleanup() {
    try {
        if (pythonLSPConnector && typeof pythonLSPConnector.dispose === 'function') {
            pythonLSPConnector.dispose();
            pythonLSPConnector = null;
        }
        
        // Update global LSP connection status
        lspConnected = false;
        updateLSPStatus(false);
        
        // Clear any remaining timeouts
        if (window.editor) {
            const model = window.editor.getModel();
            if (model) {
                model.dispose();
            }
        }
        
        // Clear any remaining event listeners
        const editorContainer = document.getElementById('monaco-editor');
        if (editorContainer) {
            const newContainer = editorContainer.cloneNode(true);
            editorContainer.parentNode.replaceChild(newContainer, editorContainer);
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

/**
 * Initialize Python LSP connection
 * @returns {Promise} Resolves when initialization is complete
 */
async function initializePythonLSP() {
    // Clean up any existing Python LSP connector
    if (pythonLSPConnector && typeof pythonLSPConnector.dispose === 'function') {
        pythonLSPConnector.dispose();
        pythonLSPConnector = null;
        lspConnected = false;
    }
    
    // Only initialize for Python files
    if (currentLanguage !== 'python') {
        return;
    }
    
    if (!window.SimplePythonLSPConnector) {
        const error = new Error('SimplePythonLSPConnector is not available');
        setStatusMessage(error.message, 'error');
        throw error;
    }
    
    console.log('Initializing Python LSP connector...');
    
    try {
        // Detect Python environment
        const pythonEnv = await detectPythonEnvironment();
        
        // Get server URL from window config or default
        const serverUrl = (window.pythonLSPConfig && window.pythonLSPConfig.serverUrl) || 
                         'ws://localhost:2087';  // Default Python LSP server port
        
        // Create connector with proper configuration
        pythonLSPConnector = new window.SimplePythonLSPConnector({
            serverUrl,
            connectionTimeout: 3000,  // Shorter timeout for better UX
            retryConfig: {
                maxAttempts: 3,       // Fewer attempts to avoid long waits
                initialDelay: 500,    // Start retrying sooner
                maxDelay: 5000,       // Cap the retry delay
                backoffFactor: 1.5
            },
            fallbackToBasicFeatures: true,  // Enable fallback mode when LSP is unavailable
            onConnectionStatusChange: (connected) => {
                lspConnected = connected;
                updateLSPStatus(connected);
                
                // Update UI elements
                const statusEl = document.getElementById('lsp-status');
                const serverNameEl = document.getElementById('lsp-server-name');
                if (statusEl) {
                    statusEl.textContent = connected ? 'Connected' : 'Disconnected';
                    statusEl.className = connected ? 'lsp-connected' : 'lsp-disconnected';
                }
                if (serverNameEl) {
                    serverNameEl.textContent = connected ? 'Python LSP' : 'Not connected';
                }
            },
            onStatusMessage: (message, type) => {
                const statusType = ['', 'error', 'warning', 'info', 'log'][type] || 'info';
                setStatusMessage(`Python: ${message}`, statusType);
                
                // Update last error in UI if it's an error
                if (type === 1) { // error
                    const lastErrorEl = document.getElementById('lsp-last-error');
                    if (lastErrorEl) {
                        lastErrorEl.textContent = message;
                    }
                }
            },
            pythonConfig: {
                python: {
                    pythonPath: pythonEnv.pythonPath,
                    venvPath: pythonEnv.venvPath,
                    analysis: {
                        typeCheckingMode: 'strict',
                        autoSearchPaths: true,
                        useLibraryCodeForTypes: true,
                        diagnosticMode: 'workspace',
                        extraPaths: pythonEnv.extraPaths
                    }
                },
                formatting: {
                    provider: 'black',
                    args: ['--line-length=100']
                },
                linting: {
                    enabled: true,
                    pylintEnabled: true,
                    pycodestyleEnabled: true,
                    pyflakesEnabled: true,
                    mypyEnabled: true
                }
            }
        });
        
        // Initialize with monaco and editor
        await pythonLSPConnector.initialize(window.monaco, editor);
        
        // Register the current document
        const model = editor.getModel();
        if (model) {
            await pythonLSPConnector.registerDocument(model);
        }
        
        console.log('Python LSP connector initialized successfully');
        lspConnected = true;
        updateLSPStatus(true);
        setStatusMessage('Connected to Python LSP server');
        
        // Set up restart handler
        const restartButton = document.getElementById('restart-lsp');
        if (restartButton) {
            restartButton.onclick = async () => {
                try {
                    setStatusMessage('Restarting Python LSP...', 'info');
                    await initializePythonLSP();
                } catch (error) {
                    setStatusMessage(`Failed to restart Python LSP: ${error.message}`, 'error');
                }
            };
        }
        
        return pythonLSPConnector;
    } catch (error) {
        const errorMsg = `Failed to initialize Python LSP: ${error.message}`;
        console.error(errorMsg, error);
        setStatusMessage(errorMsg, 'error');
        updateLSPStatus(false);
        
        // Update last error in UI
        const lastErrorEl = document.getElementById('lsp-last-error');
        if (lastErrorEl) {
            lastErrorEl.textContent = error.message;
        }
        
        throw error;
    }
}

/**
 * Update LSP connection status in the UI
 * @param {boolean} connected - Whether the LSP server is connected
 */
function updateLSPStatus(connected) {
    const statusEl = document.getElementById('lsp-status');
    if (statusEl) {
        statusEl.textContent = connected ? 'LSP: Connected' : 'LSP: Disconnected';
        statusEl.className = connected ? 'lsp-connected' : 'lsp-disconnected';
        
        // Add tooltip with more information
        statusEl.title = connected 
            ? 'Connected to Python Language Server'
            : 'Disconnected from Python Language Server. Check if the server is running.';
    }
}

/**
 * Detect Python environment and available tools
 * @returns {Promise<Object>} Python environment information
 */
async function detectPythonEnvironment() {
    try {
        // Default values
        const env = {
            pythonPath: 'python',
            venvPath: '',
            extraPaths: []
        };
        
        // Try to detect Python path from window configuration
        if (window.pythonLSPConfig) {
            if (window.pythonLSPConfig.pythonPath) {
                env.pythonPath = window.pythonLSPConfig.pythonPath;
            }
            if (window.pythonLSPConfig.venvPath) {
                env.venvPath = window.pythonLSPConfig.venvPath;
            }
            if (window.pythonLSPConfig.extraPaths) {
                env.extraPaths = window.pythonLSPConfig.extraPaths;
            }
            console.log('Using Python configuration from window.pythonLSPConfig');
            return env;
        }
        
        // Try to detect Python path from API if available
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const response = await fetch('/api/detect-python', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'detect_python' }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.pythonPath) {
                    env.pythonPath = data.pythonPath;
                }
                if (data.venvPath) {
                    env.venvPath = data.venvPath;
                }
                if (data.extraPaths) {
                    env.extraPaths = data.extraPaths;
                }
                console.log('Detected Python environment from API:', env);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Python environment detection timed out, using defaults');
            } else {
                console.warn('Failed to detect Python environment from API:', error);
            }
            // Continue with default values
        }
        
        // Set up a global configuration for future use
        window.pythonLSPConfig = {
            ...window.pythonLSPConfig || {},
            pythonPath: env.pythonPath,
            venvPath: env.venvPath,
            extraPaths: env.extraPaths
        };
        
        console.log('Using Python environment:', env);
        return env;
    } catch (error) {
        console.error('Error detecting Python environment:', error);
        // Return defaults instead of throwing to ensure LSP can still initialize
        return {
            pythonPath: 'python',
            venvPath: '',
            extraPaths: []
        };
    }
}

// Initialize the editor when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Set up cleanup on page unload
        window.addEventListener('unload', cleanup);
        
        // Configure require paths for Monaco editor
        require.config({
            paths: {
                'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
            }
        });

        // Load Monaco editor and set it up
        await new Promise((resolve) => {
            require(['vs/editor/editor.main'], resolve);
        });
        
        // Load the PythonLSPConnector
        await loadScript('js/PythonLSPConnector.js');
        
        // Initialize editor
        initializeEditor();
        setupEventListeners();
        loadInitialFile();
        setupCompletionProviders();
        setupCodeFolding();
        
        // Set up language change handler
        setupLanguageChangeHandler();
        
        // Initialize Python LSP if needed
        if (currentLanguage === 'python') {
            await initializePythonLSP();
        }
        
        setStatusMessage('Editor initialized successfully');
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        setStatusMessage(`Failed to initialize editor: ${error.message}`, 'error');
    }
});

// Initialize the Monaco editor with default settings
function initializeEditor() {
    // Find the editor container - needs to be done here not at top level
    editorContainer = document.getElementById('monaco-editor');
    
    if (!editorContainer) {
        console.error('Editor container not found! Monaco editor cannot be initialized.');
        setStatusMessage('Error: Editor container not found!');
        return;
    }
    
    // Default code to load based on language
    const defaultCode = {
        'java': `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
        'python': `
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
`
    };
    
    const defaultCodeSnippet = defaultCode[currentLanguage] || defaultCode['java'];
    
    // Define editor options
    const options = {
        value: defaultCodeSnippet,
        language: currentLanguage,
        theme: currentTheme,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        scrollbar: {
            useShadows: false,
            verticalHasArrows: true,
            horizontalHasArrows: true,
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
        },
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        renderIndentGuides: true,
        formatOnType: true,
        formatOnPaste: true,
    };

    try {
        // Create the editor instance and store it in both local and global variables
        const editorInstance = monaco.editor.create(editorContainer, options);
        editor = editorInstance; // Local reference
        window.editor = editorInstance; // Global reference for diagnostics
        
        // Set a flag indicating successful initialization
        editorInitialized = true;
        setStatusMessage('Editor initialized with Java model');
        
        // Create a model with the appropriate language
        const model = editor.getModel();
        if (model) {
            // Set the model language based on currentLanguage
            monaco.editor.setModelLanguage(model, currentLanguage);
            
            // Mark the current language in the status bar
            const langElement = document.getElementById('current-language');
            if (langElement) {
                langElement.textContent = currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);
            }
        } else {
            console.error('Failed to get editor model');
        }
        
        // Set up language-specific features based on the current language
        if (currentLanguage === 'java') {
            // Set up Java language features if available
            setupJavaLanguageFeatures();
        } else if (currentLanguage === 'python') {
            // Initialize Python LSP connector for Python
            console.log('Initializing Python LSP for initial Python selection');
            initializePythonLSP();
        }
        
        // Register Java snippets
        if (typeof registerJavaSnippets === 'function') {
            registerJavaSnippets(monaco);
        }
        
        // Initialize Universal Java Autocomplete if available
        if (typeof initJavaUniversalAutocomplete === 'function') {
            initJavaUniversalAutocomplete();
            console.log('Universal Java Autocomplete initialized');
        }
        
        // Initialize advanced Java snippets if available
        if (typeof registerAdvancedJavaSnippets === 'function') {
            registerAdvancedJavaSnippets(monaco);
            console.log('Advanced Java snippets initialized');
        }
        
        // Initialize enhanced Java syntax highlighting if available
        if (typeof registerEnhancedJavaSyntaxHighlighting === 'function') {
            registerEnhancedJavaSyntaxHighlighting(monaco);
            
            // Apply the enhanced Java theme when editing Java files
            if (currentLanguage === 'java') {
                // Use dark theme if system preference is dark, otherwise use light theme
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                monaco.editor.setTheme(prefersDark ? 'enhancedJavaDarkTheme' : 'enhancedJavaTheme');
            }
            
            console.log('Enhanced Java syntax highlighting initialized');
        }
        
        // Initialize Java inline documentation if available
        if (typeof registerJavaInlineDocumentation === 'function') {
            registerJavaInlineDocumentation(monaco);
            console.log('Java inline documentation initialized');
        }
        
        // Setup code folding
        setupCodeFolding();

        // Update statusbar on cursor position change
        editor.onDidChangeCursorPosition(e => {
            const lineElement = document.getElementById('line-number');
            const colElement = document.getElementById('column-number');
            if (lineElement) lineElement.textContent = e.position.lineNumber;
            if (colElement) colElement.textContent = e.position.column;
        });

        // Register custom completion providers for different languages
        setupCompletionProviders();
        
        console.log('Monaco editor initialized successfully with Java model');
    } catch (error) {
        console.error('Error initializing Monaco editor:', error);
        setStatusMessage('Error initializing editor: ' + error.message);
    }
}

// Set up event listeners for UI interaction
function setupEventListeners() {
    // Language selector
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', function() {
        const newLanguage = this.value;
        
        // Save current content
        if (editor) {
            fileCache[currentLanguage] = editor.getValue();
            
            // Update current language
            currentLanguage = newLanguage;
            document.getElementById('current-language').textContent = 
                currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);
            
            // Set the editor language
            monaco.editor.setModelLanguage(editor.getModel(), currentLanguage);
            
            // Load the appropriate content
            const template = document.getElementById(`${currentLanguage}-template`);
            const templateContent = template ? template.textContent.trim() : '';
            
            // Use cached content if available, otherwise use template
            editor.setValue(fileCache[currentLanguage] || templateContent || '');
            
            // Clean up previous language features
            
            // Always clean up Python LSP if it exists
            if (pythonLSPConnector && typeof pythonLSPConnector.dispose === 'function' && currentLanguage !== 'python') {
                pythonLSPConnector.dispose();
                pythonLSPConnector = null;
                lspConnected = false;
            }
            
            // Setup language-specific features
            if (currentLanguage === 'java') {
                // Setup Java features if needed
                setupJavaLanguageFeatures();
            } else if (currentLanguage === 'python') {
                // Initialize Python LSP
                initializePythonLSP();
            }
        }
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', function() {
        if (currentTheme === 'vs') {
            currentTheme = 'vs-dark';
            document.body.classList.add('dark-theme');
        } else {
            currentTheme = 'vs';
            document.body.classList.remove('dark-theme');
        }
        monaco.editor.setTheme(currentTheme);
    });

    // Format code button
    const formatButton = document.getElementById('format-code');
    formatButton.addEventListener('click', function() {
        if (editor) {
            editor.getAction('editor.action.formatDocument').run();
        }
    });

    // File list click events
    const fileList = document.getElementById('file-list');
    fileList.addEventListener('click', function(e) {
        if (e.target.classList.contains('file')) {
            // Remove active class from all files
            document.querySelectorAll('.file').forEach(file => {
                file.classList.remove('active');
            });
            
            // Add active class to clicked file
            e.target.classList.add('active');
            
            // Get the file extension to determine language
            const fileName = e.target.getAttribute('data-file');
            const fileExt = fileName.split('.').pop().toLowerCase();
            
            // Store the current file name for URI mapping
            window.currentFileName = fileName;
            
            // Map file extensions to languages
            const languageMap = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'java': 'java',
                'html': 'html',
                'css': 'css',
                'cs': 'csharp'
            };
            
            // Set language in the select dropdown
            if (languageMap[fileExt]) {
                const langSelect = document.getElementById('language-select');
                langSelect.value = languageMap[fileExt];
                // Trigger the change event
                const event = new Event('change');
                langSelect.dispatchEvent(event);
                
                // Special handling for Python files to ensure proper URI mapping
                if (fileExt === 'py' && pythonLSPConnector) {
                    // Give the LSP connector time to initialize
                    setTimeout(() => {
                        // Re-register the current document with the LSP server
                        // This ensures the correct URI mapping is established
                        const model = editor.getModel();
                        if (model && pythonLSPConnector.isConnected) {
                            pythonLSPConnector.registerDocument(model);
                            console.log(`Re-registered Python document: ${fileName}`);
                        }
                    }, 100);
                }
            }
        }
    });
}

// Load the initial Java file template
function loadInitialFile() {
    // Check if editor is initialized
    if (!editor || !editorInitialized) {
        console.error('Cannot load initial file: Editor not initialized');
        return;
    }
    
    try {
        // Load initial Java template from DOM if available
        const javaTemplate = document.getElementById('java-template');
        if (javaTemplate && javaTemplate.textContent.trim()) {
            editor.setValue(javaTemplate.textContent.trim());
            console.log('Loaded Java template from DOM');
        } else {
            // Use a default Java template if none found in DOM
            const defaultCode = `
public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello from VS Code's Java LSP!");
        
        // Try typing: import java.util.
        // to test package completion
    }
}
`;
            editor.setValue(defaultCode);
            console.log('Loaded default Java template');
        }
        
        // Ensure model language is set to Java
        const model = editor.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, 'java');
        }
        
        // Set the document version to 1
        documentVersion = 1;
        
        // Update status message
        setStatusMessage('Java file loaded');
    } catch (error) {
        console.error('Error loading initial file:', error);
        setStatusMessage('Error loading file: ' + error.message);
    }
}

// Setup completion providers for different languages
function setupCompletionProviders() {
    // Check if we should initialize Python LSP connector for initial Python language selection
    if (currentLanguage === 'python' && !pythonLSPConnector) {
        initializePythonLSP();
    }
    
    // Basic Java completion provider
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: function(model, position) {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const javaKeywords = [
                'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
                'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
                'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
                'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super',
                'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
            ];

            const javaClasses = [
                'String', 'System', 'Scanner', 'Math', 'Object', 'Class', 'Exception',
                'RuntimeException', 'Throwable', 'Integer', 'Boolean', 'Double', 'Float',
                'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'Set', 'HashSet',
                'Collection', 'Collections', 'Arrays', 'Thread', 'Runnable'
            ];

            const javaMethods = [
                'main', 'equals', 'toString', 'hashCode', 'compareTo', 'valueOf',
                'println', 'print', 'nextInt', 'nextLine', 'length', 'charAt',
                'substring', 'indexOf', 'lastIndexOf', 'replace', 'toUpperCase',
                'toLowerCase', 'trim', 'split', 'startsWith', 'endsWith'
            ];

            const suggestions = [];

            // Add keyword suggestions
            javaKeywords.forEach(keyword => {
                suggestions.push({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                    detail: 'Java keyword'
                });
            });

            // Add class suggestions
            javaClasses.forEach(className => {
                suggestions.push({
                    label: className,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: className,
                    detail: 'Java class'
                });
            });

            // Add method suggestions
            javaMethods.forEach(method => {
                let insertText = method;
                if (method !== 'main') {
                    insertText += '()';
                } else {
                    insertText = 'main(String[] args)';
                }
                
                suggestions.push({
                    label: method,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: insertText,
                    detail: 'Java method'
                });
            });

            // Special cases for common patterns
            // System.out
            if (textUntilPosition.endsWith('System.out.')) {
                return {
                    suggestions: [
                        {
                            label: 'println',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'println(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Print line to standard output'
                        },
                        {
                            label: 'print',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'print(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Print to standard output'
                        }
                    ]
                };
            }

            return {
                suggestions: suggestions
            };
        }
    });

    // Register JavaScript completion provider
    monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: function(model, position) {
            const jsKeywords = [
                'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
                'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
                'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
                'var', 'void', 'while', 'with', 'yield', 'let', 'async', 'await'
            ];

            const jsMethods = [
                'log', 'error', 'warn', 'info', 'debug', 'table', 'time', 'timeEnd', 'group',
                'groupEnd', 'filter', 'map', 'reduce', 'forEach', 'find', 'findIndex', 'push',
                'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'split'
            ];

            const suggestions = [];

            // Add keyword suggestions
            jsKeywords.forEach(keyword => {
                suggestions.push({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                    detail: 'JavaScript keyword'
                });
            });

            // Add method suggestions
            jsMethods.forEach(method => {
                suggestions.push({
                    label: method,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: method + '()',
                    detail: 'JavaScript method'
                });
            });

            // Special case for console
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            if (textUntilPosition.endsWith('console.')) {
                return {
                    suggestions: [
                        {
                            label: 'log',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'log(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Log to console'
                        },
                        {
                            label: 'error',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'error(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Log error to console'
                        }
                    ]
                };
            }

            return {
                suggestions: suggestions
            };
        }
    });

    // Python completion provider
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: function(model, position) {
            // If we have a working LSP connector, let it handle completions
            if (pythonLSPConnector && pythonLSPConnector.isConnected) {
                return;
            }
            
            // Basic Python completion provider as fallback when LSP is not connected
            const pythonKeywords = [
                'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
                'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for',
                'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
                'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
                'while', 'with', 'yield'
            ];
            
            const pythonBuiltins = [
                'abs', 'all', 'any', 'bin', 'bool', 'bytes', 'chr', 'dict', 'dir',
                'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset',
                'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input',
                'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map',
                'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
                'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
                'sorted', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
            ];
            
            const pythonModules = [
                'datetime', 'json', 'math', 'os', 'pathlib', 're', 'random',
                'sys', 'time', 'collections', 'itertools', 'functools', 'logging'
            ];
            
            const suggestions = [];
            
            // Add keyword suggestions
            pythonKeywords.forEach(keyword => {
                suggestions.push({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                    detail: 'Python keyword'
                });
            });
            
            // Add builtin function suggestions
            pythonBuiltins.forEach(builtin => {
                suggestions.push({
                    label: builtin,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: builtin + '(${1})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: 'Python builtin function'
                });
            });
            
            // Add module suggestions
            pythonModules.forEach(module => {
                suggestions.push({
                    label: module,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: module,
                    detail: 'Python module'
                });
            });
            
            // Special case for import completion
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            if (textUntilPosition.endsWith('import ')) {
                // Provide module suggestions for import statements
                return {
                    suggestions: pythonModules.map(module => ({
                        label: module,
                        kind: monaco.languages.CompletionItemKind.Module,
                        insertText: module,
                        detail: 'Python module'
                    }))
                };
            }
            
            return {
                suggestions: suggestions
            };
        }
    });
}

// Set up Java Language Server Protocol integration
async function setupJavaLanguageFeatures() {
    try {
        // Update status bar to show connecting status
        setStatusMessage('Initializing Java language features...');
        
        // Check if we're in Java mode
        if (currentLanguage !== 'java') {
            return;
        }
        
        // Clean up existing connections if any
        if (javaLSPConnector !== null) {
            javaLSPConnector.dispose();
            javaLSPConnector = null;
        }
        
        if (javaLSPAdapter !== null) {
            javaLSPAdapter.dispose();
            javaLSPAdapter = null;
        }
        
        // Create a document URI for the current model
        const model = editor.getModel();
        if (!model) {
            console.warn('No model available for LSP initialization');
            return;
        }
        
        // Set the file URI for this document
        fileUri = model.uri.toString();
        
        // First try to use the VS Code's JDT.LS connector (FixedJavaLSPConnector)
        if (typeof FixedJavaLSPConnector !== 'undefined') {
            console.log('Attempting to connect to VS Code\'s JDT.LS with FixedJavaLSPConnector...');
            
            const workspaceFolders = [
                {
                    uri: 'file:///workspace',
                    name: 'Java Project'
                }
            ];
            
            // Create the fixed connector for VS Code's JDT.LS with LSP disabled by default
            javaLSPConnector = new FixedJavaLSPConnector({
                serverUrl: 'ws://localhost:8090',
                workspaceFolders: workspaceFolders,
                useLSP: false // Disable LSP connection to prevent WebSocket errors
            });
            
            try {
                // Initialize the fixed connector
                await javaLSPConnector.initialize(monaco, editor);
                
                setStatusMessage('Connected to VS Code\'s Java LSP Server');
                lspConnected = true;
                console.log('Successfully connected to VS Code\'s JDT.LS');
                return; // Success! No need to try fallback options
            } catch (error) {
                console.warn('Failed to connect to VS Code\'s JDT.LS server:', error);
                // Fall through to other options
            }
        }
        
        // Next try SimpleLSPConnector
        if (typeof SimpleLSPConnector !== 'undefined') {
            console.log('Attempting to connect with SimpleLSPConnector...');
            
            const workspaceFolders = [
                {
                    uri: 'file:///workspace',
                    name: 'Java Project'
                }
            ];
            
            // Create the simple connector for testing
            javaLSPConnector = new SimpleLSPConnector({
                serverUrl: 'ws://localhost:8090'
            });
            
            try {
                // Initialize the simple connector
                await javaLSPConnector.initialize(monaco, editor);
                
                setStatusMessage('Connected to Simple Java LSP Server');
                lspConnected = true;
                return; // Success! No need to try fallback options
            } catch (error) {
                console.warn('Failed to connect to Simple Java LSP server:', error);
                // Fall through to other options
            }
        }
        
        // Next try to use the real-time Java LSP connector
        if (typeof JavaLSPConnector !== 'undefined') {
            const workspaceFolders = [
                {
                    uri: 'file:///workspace',
                    name: 'Java Project'
                }
            ];
            
            // Create the connector with the real-time Java LSP server
            javaLSPConnector = new JavaLSPConnector({
                serverUrl: 'ws://localhost:8090/jdt.ls',
                workspaceFolders: workspaceFolders
            });
            
            // Configure diagnostic handling to show in editor
            if (typeof javaLSPConnector.handleDiagnostics === 'function') {
                const originalHandleDiagnostics = javaLSPConnector.handleDiagnostics;
                javaLSPConnector.handleDiagnostics = function(params) {
                    originalHandleDiagnostics.call(javaLSPConnector, params);
                    setStatusMessage(`Java diagnostics: ${params.diagnostics.length} issues found`);
                };
            }
            
            try {
                // Initialize the real-time connector
                await javaLSPConnector.initialize(monaco, editor);
                
                setStatusMessage('Connected to real-time Java LSP server');
                lspConnected = true;
                return; // Success! No need to try fallback options
            } catch (error) {
                console.warn('Failed to connect to real-time Java LSP server:', error);
                // Fall through to fallback options
            }
        }
        
        // Fallback to built-in Java LSP adapter 
        if (typeof JavaLSPAdapter !== 'undefined') {
            const workspaceFolders = [
                {
                    uri: 'file:///workspace',
                    name: 'Java Project'
                }
            ];
            
            // Create the adapter with our Monaco instance and editor
            javaLSPAdapter = new JavaLSPAdapter(monaco, editor, {
                serverUrl: 'ws://localhost:8090/jdt.ls', 
                workspaceFolders: workspaceFolders
            });
            
            try {
                // Try to initialize the adapter
                await javaLSPAdapter.initialize();
                
                setStatusMessage('Java LSP connected (fallback mode)');
                lspConnected = true;
            } catch (error) {
                console.warn('Failed to connect to Java LSP server:', error);
                setStatusMessage('Using built-in Java features (LSP server not available)');
                
                // Even if the LSP connection fails, we still have our built-in features
                setupBasicJavaCompletions();
            }
        } else {
            // Fallback to basic completions if the adapter isn't available
            setupBasicJavaCompletions();
            setStatusMessage('Using built-in Java features');
        }
    } catch (e) {
        console.warn('Java LSP setup error:', e);
        setStatusMessage('Java LSP not available: ' + e.message);
        
        // Fallback to basic completions
        setupBasicJavaCompletions();
    }
}

/**
 * Load a script dynamically
 * @param {string} src - Path to the script
 * @returns {Promise} Resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Set up language change handler
 */
function setupLanguageChangeHandler() {
    const languageSelect = document.getElementById('language-select');
    if (!languageSelect) return;
    
    languageSelect.addEventListener('change', async (e) => {
        const newLanguage = e.target.value;
        const oldLanguage = currentLanguage;
        currentLanguage = newLanguage;
        
        // Update UI
        const languageDisplay = document.getElementById('current-language');
        if (languageDisplay) {
            languageDisplay.textContent = newLanguage;
        }
        
        // Update model language
        const model = editor.getModel();
        if (model) {
            window.monaco.editor.setModelLanguage(model, newLanguage);
            
            // Update URI based on new language
            const filename = model.uri.path.split('/').pop();
            currentFileUri = generateFileUri(filename, newLanguage);
            
            // Handle LSP-specific logic
            if (oldLanguage === 'python' || newLanguage === 'python') {
                try {
                    await initializePythonLSP();
                } catch (error) {
                    console.error('Failed to update LSP for language change:', error);
                    setStatusMessage(`Language server error: ${error.message}`, 'error');
                }
            }
        }
    });
}

// Set up code folding
function setupCodeFolding() {
    // Register folding provider
    monaco.languages.registerFoldingRangeProvider('java', {
        provideFoldingRanges: function(model, context, token) {
            // Basic folding for Java based on indentation and brackets
            const ranges = [];
            const text = model.getValue();
            const lines = text.split('\n');
            
            // Stack to track opening braces
            const stack = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check for class/method/interface declarations with opening brace
                if (line.match(/\b(class|interface|enum|[\w<>\[\]]+\s+[\w<>\[\]]+\s*\([^\)]*\)).*\{\s*$/)) {
                    stack.push({ start: i, type: 'code' });
                }
                // Check for opening braces on their own line or at the end of a line
                else if (line.match(/\{\s*$/)) {
                    stack.push({ start: i, type: 'code' });
                }
                // Check for closing braces
                else if (line.match(/^\s*\}/) && stack.length > 0) {
                    const opening = stack.pop();
                    // Only create folding range if it spans multiple lines
                    if (i > opening.start + 1) {
                        ranges.push({
                            start: opening.start + 1,
                            end: i,
                            kind: opening.type === 'comment' ? 
                                monaco.languages.FoldingRangeKind.Comment : 
                                monaco.languages.FoldingRangeKind.Region
                        });
                    }
                }
                // Check for JavaDoc or multi-line comments
                else if (line.match(/^\/\*\*/)) {
                    let commentStart = i;
                    // Look ahead for the end of the comment
                    for (let j = i + 1; j < lines.length; j++) {
                        if (lines[j].match(/\*\//)) {
                            // Add as a comment folding range if it spans multiple lines
                            if (j > commentStart + 1) {
                                ranges.push({
                                    start: commentStart,
                                    end: j,
                                    kind: monaco.languages.FoldingRangeKind.Comment
                                });
                            }
                            i = j; // Skip ahead
                            break;
                        }
                    }
                }
                // Check for imports block
                else if (line.match(/^\s*import\s+/)) {
                    let importStart = i;
                    let foundNonImport = false;
                    // Look ahead for the end of imports block
                    for (let j = i + 1; j < lines.length; j++) {
                        if (!lines[j].match(/^\s*import\s+/) && 
                            !lines[j].match(/^\s*$/) && 
                            !lines[j].match(/^\/\//) && 
                            !lines[j].match(/^\/\*/)) {
                            foundNonImport = true;
                            // Add as imports folding range if it spans multiple lines
                            if (j > importStart + 1) {
                                ranges.push({
                                    start: importStart,
                                    end: j - 1,
                                    kind: monaco.languages.FoldingRangeKind.Imports
                                });
                            }
                            i = j - 1; // Skip ahead, but don't miss the next line
                            break;
                        }
                    }
                    if (!foundNonImport) {
                        break; // End of file
                    }
                }
            }
            
            return ranges;
        }
    });
}

// Set up basic Java completion provider 
function setupBasicJavaCompletions() {
    // Basic Java completion provider (already implemented in our previous code)
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: function(model, position) {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const javaKeywords = [
                'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
                'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
                'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
                'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super',
                'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
            ];

            const javaClasses = [
                'String', 'System', 'Scanner', 'Math', 'Object', 'Class', 'Exception',
                'RuntimeException', 'Throwable', 'Integer', 'Boolean', 'Double', 'Float',
                'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'Set', 'HashSet',
                'Collection', 'Collections', 'Arrays', 'Thread', 'Runnable'
            ];

            const javaMethods = [
                'main', 'equals', 'toString', 'hashCode', 'compareTo', 'valueOf',
                'println', 'print', 'nextInt', 'nextLine', 'length', 'charAt',
                'substring', 'indexOf', 'lastIndexOf', 'replace', 'toUpperCase',
                'toLowerCase', 'trim', 'split', 'startsWith', 'endsWith'
            ];

            const suggestions = [];

            // Add keyword suggestions
            javaKeywords.forEach(keyword => {
                suggestions.push({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                    detail: 'Java keyword'
                });
            });

            // Add class suggestions
            javaClasses.forEach(className => {
                suggestions.push({
                    label: className,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: className,
                    detail: 'Java class'
                });
            });

            // Add method suggestions
            javaMethods.forEach(method => {
                let insertText = method;
                if (method !== 'main') {
                    insertText += '()';
                } else {
                    insertText = 'main(String[] args)';
                }
                
                suggestions.push({
                    label: method,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: insertText,
                    detail: 'Java method'
                });
            });

            // Special cases for common patterns
            // System.out
            if (textUntilPosition.endsWith('System.out.')) {
                return {
                    suggestions: [
                        {
                            label: 'println',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'println(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Print line to standard output'
                        },
                        {
                            label: 'print',
                            kind: monaco.languages.CompletionItemKind.Method,
                            insertText: 'print(${1:message});',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: 'Print to standard output'
                        }
                    ]
                };
            }

            return {
                suggestions: suggestions
            };
        }
    });
}

// Update status bar message
function setStatusMessage(message, type = 'info') {
    const statusItem = document.querySelector('.status-bar .status-item:first-child');
    if (statusItem) {
        // Clear previous classes
        statusItem.classList.remove('status-info', 'status-error', 'status-warning');
        
        // Add appropriate class based on message type
        switch (type) {
            case 'error':
                statusItem.classList.add('status-error');
                break;
            case 'warning':
                statusItem.classList.add('status-warning');
                break;
            case 'info':
            default:
                statusItem.classList.add('status-info');
                break;
        }
        
        statusItem.textContent = message;
        
        // Log to console based on type
        switch (type) {
            case 'error':
                console.error(message);
                break;
            case 'warning':
                console.warn(message);
                break;
            default:
                console.log(message);
                break;
        }
    }
}
