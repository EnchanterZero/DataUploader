@echo off 
echo [InternetShortcut] >%2.url 
echo URL=%1 >>%2.url 
echo IconIndex=0 >>%2.url 
echo IconFile=%1>>%2.url