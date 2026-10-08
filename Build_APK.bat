@echo off
title EcoShare Mobile - Build Android APK
echo ======================================================
echo    Building EcoShare Android APK (Debug Build)
echo ======================================================
cd /d "%~dp0mobile-app\android"
echo Current directory: %cd%
echo.
echo Compiling Android APK with Gradle...
call gradlew.bat assembleDebug --project-cache-dir "%USERPROFILE%\.gradle-project-cache\ecoshare"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo    SUCCESS! APK Built Successfully!
    echo ======================================================
    echo Opening folder containing app-debug.apk...
    explorer "%~dp0mobile-app\android\app\build\outputs\apk\debug"
) else (
    echo.
    echo ======================================================
    echo    Build encountered an issue. Check the logs above.
    echo ======================================================
)
pause
