@echo off
title Sistema Bela Cereais
color 0A

echo ==========================================
echo    LIGANDO O SISTEMA BELA CEREAIS...
echo ==========================================
echo.
echo O servidor esta sendo iniciado. 
echo O seu navegador vai abrir sozinho em alguns segundos...
echo.

:: Espera 3 segundos para dar tempo do Next.js pensar
timeout /t 3 /nobreak > nul

:: Abre o navegador no localhost
start http://localhost:3000

:: Inicia o servidor do Next.js
npm run dev