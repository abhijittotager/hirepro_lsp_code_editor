@echo off
echo Starting Python LSP server with WebSocket bridge...

REM Kill any existing Python processes running our scripts
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| find "PID:"') do (
    for /f "tokens=*" %%b in ('wmic process where "ProcessId=%%a" get CommandLine /value ^| find "pylsp_server.py"') do (
        taskkill /F /PID %%a
    )
    for /f "tokens=*" %%b in ('wmic process where "ProcessId=%%a" get CommandLine /value ^| find "ws_tcp_bridge.py"') do (
        taskkill /F /PID %%a
    )
)

REM Install required packages if not already installed
python -m pip install --quiet websockets psutil

REM Start the WebSocket bridge
python ws_tcp_bridge.py

REM If we get here, the bridge has exited
echo Python LSP server stopped. 