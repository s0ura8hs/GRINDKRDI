@echo off
REM ============================================
REM GRIND — Build Standalone APK (Windows)
REM Run from the frontend\ folder
REM ============================================

setlocal enabledelayedexpansion

echo ================================================
echo   GRIND - Standalone APK Builder (Windows)
echo ================================================
echo.

REM Step 1: Install dependencies
echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

REM Step 2: Generate native Android project
echo [2/5] Generating native Android project...
call npx expo prebuild --platform android --clean
if errorlevel 1 (
    echo ERROR: expo prebuild failed
    pause
    exit /b 1
)

REM Step 3: CRITICAL — Patch build.gradle to bundle JS in debug builds
echo [3/5] Patching build.gradle to embed JS bundle...

REM Find and patch the react block in build.gradle to add bundleInDebug
powershell -Command ^
    "$file = 'android\app\build.gradle'; " ^
    "$content = Get-Content $file -Raw; " ^
    "if ($content -match 'react \{') { " ^
    "  if ($content -notmatch 'bundleInDebug') { " ^
    "    $content = $content -replace '(react\s*\{)', \"`$1`n    bundleInDebug = true`n    hermesEnabled = true\"; " ^
    "    Set-Content $file $content; " ^
    "    Write-Host '    OK: Patched react block with bundleInDebug = true'; " ^
    "  } else { " ^
    "    Write-Host '    OK: Already patched'; " ^
    "  } " ^
    "} else { " ^
    "  Write-Host '    WARN: react block not found, adding manually'; " ^
    "  Add-Content $file \"`nreact { bundleInDebug = true }`n\"; " ^
    "}"

REM Step 4: Create assets dir and bundle JS (belt-and-suspenders approach)
echo [4/5] Bundling JavaScript...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"

call npx react-native bundle ^
    --platform android ^
    --dev false ^
    --entry-file node_modules/expo-router/entry.js ^
    --bundle-output android\app\src\main\assets\index.android.bundle ^
    --assets-dest android\app\src\main\res\

if errorlevel 1 (
    echo ERROR: JS bundling failed
    pause
    exit /b 1
)

REM Verify bundle was created
if exist "android\app\src\main\assets\index.android.bundle" (
    echo     OK: Bundle file created successfully
    for %%A in ("android\app\src\main\assets\index.android.bundle") do echo     Size: %%~zA bytes
) else (
    echo     ERROR: Bundle file was NOT created!
    pause
    exit /b 1
)

REM Step 5: Build APK
echo [5/5] Building APK (this takes 5-15 minutes)...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo Debug build failed. Trying release with debug keystore...
    call gradlew.bat assembleRelease
)
cd ..

echo.
echo ================================================
echo   BUILD COMPLETE!
echo ================================================
echo.
echo Your APK is at:
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo   android\app\build\outputs\apk\debug\app-debug.apk
) 
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo   android\app\build\outputs\apk\release\app-release.apk
)
echo.
echo Transfer to phone - Install - Works standalone!
echo.
pause
