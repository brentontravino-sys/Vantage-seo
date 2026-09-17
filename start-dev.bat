@echo off
color 0A
echo Starting Vantage SEO Development Environment...
echo ==============================================
echo.

:: Start mock server in background
start "Mock Server" cmd /k "node mock-server.cjs"

:: Wait a bit for server to start
timeout /t 3 /nobreak >nul

:: Start Vite dev server
start "Vite Dev" cmd /k "npm run dev"

echo.
echo ==============================================
echo Both servers should be running now:
echo - Mock Backend: http://localhost:3001
echo - Frontend: http://localhost:5173
echo ==============================================
echo.
echo To access:
echo - Open http://localhost:5173 in your browser
echo - Use any email/password to register
echo - For OTP, enter any 6-digit code (e.g., 123456)
echo ==============================================
echo.
