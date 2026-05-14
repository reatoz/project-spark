@echo off
chcp 65001 >nul
setlocal
set /p msg=请输入本次修改描述:
if "%msg%"=="" set msg=更新网站
git add .
git commit -m "%msg%"
git push
echo 部署完成，等待 Cloudflare Pages 自动更新。
pause