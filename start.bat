@echo off
title Editor de Itens - Servidor

:: Muda o diretório de execução para a pasta onde o .bat está
cd /d "%~dp0"

echo Iniciando o servidor do Editor de Itens...
echo.
echo O console do servidor vai permanecer aberto.
echo Quando ele mostrar a mensagem:
echo "Acesse em seu navegador: http://localhost:3000"
echo ...o editor estara pronto.
echo.
echo Para PARAR o servidor, feche esta janela ou pressione CTRL+C.
echo.

:: Roda o comando de desenvolvimento do npm
npm run dev

:: O comando abaixo só será executado se o npm falhar ou for fechado
echo.
echo Servidor foi parado ou ocorreu um erro.
pause