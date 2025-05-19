@echo off
echo Setting up VS Code's JDT.LS integration for Monaco Editor...

echo Step 1: Checking if VS Code is installed with Java Extension Pack...
powershell -ExecutionPolicy Bypass -File find-jdtls.ps1

echo Step 2: Installing required Node.js modules...
call npm install ws

echo Setup complete!
echo.
echo To start the JDT.LS server and browser, run: start-monaco-with-jdtls.bat
echo.
