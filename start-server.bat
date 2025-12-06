@echo off
title Xeno Shopify Insights - Development Server
color 0A
echo.
echo ============================================
echo   XENO SHOPIFY INSIGHTS - DEV SERVER
echo ============================================
echo.
echo  Server URL: http://localhost:3000
echo  Email: madhurtoshniwal03@gmail.com
echo  Store: madhur-xeno-dev.myshopify.com
echo  Products Synced: 17
echo.
echo ============================================
echo.
cd /d "d:\Xeno new\xeno-shopify-insights"
call npm run dev
pause
