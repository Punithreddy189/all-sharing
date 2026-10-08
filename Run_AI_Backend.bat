@echo off
title EcoShare AI Vision Backend
echo ========================================================
echo       EcoShare AI Vision Auto-Fill & Impact Engine
echo ========================================================
echo Starting FastAPI server at http://127.0.0.1:8000 ...
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
