@echo off
title EcoShare - Push to GitHub
echo ======================================================
echo    Pushing EcoShare to GitHub (origin/main)
echo ======================================================
echo.
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================
    echo    SUCCESS! Code successfully uploaded to GitHub!
    echo ======================================================
) else (
    echo ======================================================
    echo    Push failed. Check GitHub credentials above.
    echo ======================================================
)
pause
