@echo off
echo Compiling and running Java LSP Server...

REM Create class directory if it doesn't exist
mkdir target\classes 2>nul

REM Set classpath for compilation and execution
set CLASSPATH=.

REM Download required dependencies if not available
if not exist "lib" mkdir lib
cd lib

REM For simplicity we'll use embedded Jetty server
echo Starting Java LSP Server...
cd ..

REM Run the Java LSP WebSocket Class
javac -d target/classes src/main/java/com/monacoide/lsp/JavaLSPWebSocket.java
java -cp target/classes com.monacoide.lsp.JavaLSPWebSocket
