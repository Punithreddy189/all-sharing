@echo off
title EcoShare Mobile - Install & Run Native App
echo ======================================================
echo    EcoShare Android Native Launcher
echo ======================================================

set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

if not exist %ADB% (
    echo ADB not found at %ADB%, using system adb...
    set ADB=adb
)

echo [1/3] Setting ADB Reverse port 8081 for Metro bundler...
%ADB% reverse tcp:8081 tcp:8081

echo [2/3] Installing debug APK to connected device...
%ADB% install -r "%~dp0mobile-app\android\app\build\outputs\apk\debug\app-debug.apk"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/3] Launching EcoShare MainActivity...
    %ADB% shell am start -n com.ecoshare.app/.MainActivity
    echo.
    echo ======================================================
    echo    SUCCESS! EcoShare launched on device!
    echo ======================================================
) else (
    echo.
    echo [ERROR] Installation failed. Ensure your Android device/emulator is connected with USB Debugging enabled.
)
pause
