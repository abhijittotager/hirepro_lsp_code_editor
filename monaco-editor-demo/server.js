const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create an HTTP server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Handle request for the root URL
    let filePath = req.url === '/' 
        ? path.join(__dirname, 'index.html') 
        : path.join(__dirname, req.url);

    // Get file extension
    const extname = path.extname(filePath);
    
    // Set content type based on file extension
    const contentType = MIME_TYPES[extname] || 'text/plain';

    // Read file and send response
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Monaco editor should be accessible at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
});
