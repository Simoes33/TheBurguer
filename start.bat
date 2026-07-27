@echo off
chcp 65001 > nul
title The Burguer — Iniciando...

echo.
echo  ==========================================
echo    THE BURGUER — Iniciando Servicos
echo  ==========================================
echo.

:: Garante que o Node.js está no PATH
where node >nul 2>&1
if %errorlevel% neq 0 (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

:: Libera as portas caso ja estejam em uso
echo  [0/2] Encerrando processos Node.js anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak > nul

:: Inicia o Backend
echo  [1/2] Iniciando Backend (porta 3000)...
start "TheBurguer-Backend" /D "%~dp0backend" cmd /k "title TheBurguer - Backend && set PATH=C:\Program Files\nodejs;%PATH% && npm run start:dev"

:: Aguarda o backend subir
echo  Aguardando backend iniciar (5s)...
timeout /t 5 /nobreak > nul

:: Inicia o Frontend
echo  [2/2] Iniciando Frontend (porta 5173)...
start "TheBurguer-Frontend" /D "%~dp0frontend" cmd /k "title TheBurguer - Frontend && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

echo.
echo  ==========================================
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173
echo  ==========================================
echo.
echo  Pressione qualquer tecla para fechar esta janela...
pause > nul
