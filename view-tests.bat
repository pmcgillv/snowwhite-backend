@echo off
title SnowWhite Test Watcher
color 0A
cls
echo.
echo ========================================
echo   SnowWhite Auto Test Watcher
echo ========================================
echo.
echo Tests will auto-run when you change any file.
echo Keep this window open while coding.
echo.
echo Press CTRL+C to stop watching.
echo.
echo ========================================
echo.
docker logs -f snowwhite-test-watcher