@echo off
title NetVision - Agente Local de Rede
color 0A
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        NetVision - Agente Local de Rede             ║
echo  ║  Executa comandos CMD reais (arp -a / ping)         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Iniciando agente na porta 7891...
echo  Abra o site no Vercel - ele vai puxar IPs reais!
echo.
echo  Pressione CTRL+C para parar.
echo.
node "%~dp0local-agent.mjs"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo  ERRO: Certifique-se de que o Node.js esta instalado.
  echo  Baixe em: https://nodejs.org
  pause
)
