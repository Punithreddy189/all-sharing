@echo off
title EcoShare Mobile - Metro Bundler
echo ======================================================
echo    Starting EcoShare React Native Metro Bundler
echo ======================================================
cd /d "%~dp0mobile-app"
echo Current directory: %cd%
echo.
echo Starting Expo Metro Bundler...
npx expo start
pause
