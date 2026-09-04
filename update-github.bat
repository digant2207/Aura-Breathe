@echo off
title Aura Breathe - Automatic GitHub Updater
color 0B
echo ========================================================
echo         AURA BREATHE - 1-CLICK GITHUB UPDATER
echo ========================================================
echo.
echo [1/4] Saving all code changes...
git add .
git commit -m "Update Aura Breathe files" 2>nul || echo No new file changes to commit.

echo [2/4] Uploading all code to GitHub (main branch)...
git push origin main

echo [3/4] Building production app with offline support...
call npm run build

echo [4/4] Publishing live update to GitHub Pages...
call npx gh-pages -d dist

echo.
echo ========================================================
echo   SUCCESS! Everything is updated on GitHub!
echo   Your live site: https://digant2207.github.io/Aura-Breathe/
echo ========================================================
echo.
pause
