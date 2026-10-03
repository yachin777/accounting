@echo off
chcp 65001 >nul
cd /d "%~dp0"
where git >nul 2>&1 || (echo [錯誤] 這台電腦還沒安裝 Git，請先到 https://git-scm.com/download/win 安裝。& pause & exit /b 1)
if not exist .git (
  echo 第一次使用，正在連結 GitHub...
  git init
  git remote add origin https://github.com/yachin777/accounting.git
  git fetch origin
  git reset origin/main
  git branch -M main
  git branch -u origin/main
  for /f "delims=" %%f in ('git ls-files -d') do git checkout -- "%%f"
)
git config user.name >nul 2>&1 || git config user.name "ya7"
git config user.email >nul 2>&1 || git config user.email "ap890713@gmail.com"
echo 正在上傳到 GitHub...
git pull --no-edit
git add -A
git commit -m "update %date% %time%"
git push
echo.
echo 完成，按任意鍵關閉。
pause >nul
