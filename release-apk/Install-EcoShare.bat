@echo off
title EcoShare - 1-Click APK Installer
echo =========================================================
echo       EcoShare Native Android App Installer
echo =========================================================
echo.

set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

if not exist %ADB% (
    echo [INFO] Looking for system ADB...
    set ADB=adb
)

echo [1/3] Checking connected Android devices/emulators...
%ADB% devices

echo.
echo [2/3] Setting reverse port bridges for AI Server & Bundler...
%ADB% reverse tcp:8081 tcp:8081
%ADB% reverse tcp:8000 tcp:8000

echo.
echo [3/3] Installing EcoShare-v1.0.0-Release.apk to device...
%ADB% install -r "%~dp0EcoShare-v1.0.0-Release.apk"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================
    echo   SUCCESS! EcoShare is installed!
    echo   Launching application on device...
    echo =========================================================
    %ADB% shell am start -n com.ecoshare.app/.MainActivity
) else (
    echo.
    echo [ERROR] Installation failed. Make sure your Android device is connected with USB Debugging enabled.
)

echo.
pause
