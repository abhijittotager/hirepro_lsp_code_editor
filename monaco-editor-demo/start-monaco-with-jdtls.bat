@echo off
echo Starting Monaco Editor with VS Code JDT.LS integration...

echo Step 1: Starting web server for Monaco Editor...
start cmd /k "node server.js"

echo Step 2: Starting JDT.LS bridge server...
start cmd /k "node vscode-jdtls-bridge.js"

echo Both servers are now running!
echo.
echo Monaco Editor: http://localhost:3030
echo JDT.LS WebSocket: ws://localhost:8090
echo.
echo Press any key to open the Monaco Editor in your browser...
pause > nul

start http://localhost:3030
