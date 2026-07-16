@echo off
echo Cleaning up Git repository...

REM Force delete .git directory
rmdir /s /q .git 2>nul
if exist .git (
    echo Trying to unlock files...
    attrib -h -s -r .git /s /d
    rmdir /s /q .git
)

echo Initializing new Git repository...
git init
git branch -m main

echo Adding files...
git add .

echo Creating commit...
git commit -m "feat: initial commit - Baotuo-VibeForge MVP"

echo Adding remote...
git remote add origin https://github.com/baotuo88/Baotuo-VibeForge.git

echo Pushing to GitHub...
git push -u origin main --force

echo Done!
pause
