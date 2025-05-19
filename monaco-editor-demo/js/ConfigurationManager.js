/**
 * ConfigurationManager.js
 * 
 * Manages the JDT.LS configuration for Monaco Editor
 */

// Store configuration in localStorage
function storeJDTLSConfig() {
    // Read from the jdtls-config.json
    fetch('jdtls-config.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch jdtls-config.json: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(config => {
            // Store in localStorage
            localStorage.setItem('jdtlsConfig', JSON.stringify(config));
            console.log('JDT.LS configuration stored in localStorage', config);
            
            // Display success message
            const message = document.createElement('div');
            message.style.position = 'fixed';
            message.style.bottom = '20px';
            message.style.left = '20px';
            message.style.backgroundColor = '#4CAF50';
            message.style.color = 'white';
            message.style.padding = '10px';
            message.style.borderRadius = '5px';
            message.style.zIndex = '1000';
            message.textContent = 'JDT.LS configuration loaded successfully!';
            document.body.appendChild(message);
            
            // Remove after 5 seconds
            setTimeout(() => {
                message.remove();
            }, 5000);
            
            return config;
        })
        .catch(error => {
            console.error('Error storing JDT.LS configuration:', error);
            
            // Create a default configuration
            const defaultConfig = {
                "jdtls": {
                    "path": "C:\\Users\\whooa\\.vscode\\extensions\\redhat.java-1.41.1-win32-x64\\server",
                    "launcher": "C:\\Users\\whooa\\.vscode\\extensions\\redhat.java-1.41.1-win32-x64\\server\\plugins\\org.eclipse.equinox.launcher_1.7.0.v20250331-1702.jar",
                    "config": "C:\\Users\\whooa\\.vscode\\extensions\\redhat.java-1.41.1-win32-x64\\server\\config_win"
                }
            };
            
            // Store default configuration in localStorage
            localStorage.setItem('jdtlsConfig', JSON.stringify(defaultConfig));
            console.log('Default JDT.LS configuration stored in localStorage', defaultConfig);
            
            // Display warning message
            const message = document.createElement('div');
            message.style.position = 'fixed';
            message.style.bottom = '20px';
            message.style.left = '20px';
            message.style.backgroundColor = '#FF9800';
            message.style.color = 'white';
            message.style.padding = '10px';
            message.style.borderRadius = '5px';
            message.style.zIndex = '1000';
            message.textContent = 'Using default JDT.LS configuration. Some features may not work correctly.';
            document.body.appendChild(message);
            
            // Remove after 5 seconds
            setTimeout(() => {
                message.remove();
            }, 5000);
            
            return defaultConfig;
        });
}

// Initialize the configuration when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for everything to initialize
    setTimeout(() => {
        storeJDTLSConfig();
    }, 1000);
});
