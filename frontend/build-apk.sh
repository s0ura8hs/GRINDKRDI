#!/bin/bash
# ============================================
# GRIND — Build Standalone APK (No Metro Needed)
# Run this script from the frontend/ directory
# ============================================

set -e

echo "================================================"
echo "  GRIND — Building Standalone APK"
echo "================================================"
echo ""

# Step 1: Generate native Android project (if not already done)
if [ ! -d "android" ]; then
  echo "[1/4] Generating native Android project..."
  npx expo prebuild --platform android --clean
else
  echo "[1/4] Android project already exists. Skipping prebuild."
fi

# Step 2: Create assets directory
echo "[2/4] Creating assets directory..."
mkdir -p android/app/src/main/assets

# Step 3: Bundle JavaScript into the APK
echo "[3/4] Bundling JavaScript (this takes ~30 seconds)..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

echo "    ✓ JS bundle created at android/app/src/main/assets/index.android.bundle"

# Step 4: Build the APK
echo "[4/4] Building APK..."
cd android
./gradlew assembleRelease 2>/dev/null || ./gradlew assembleDebug
cd ..

echo ""
echo "================================================"
echo "  ✅ BUILD COMPLETE!"
echo "================================================"
echo ""
echo "Your APK is at one of these locations:"
echo "  Release: android/app/build/outputs/apk/release/app-release.apk"
echo "  Debug:   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Transfer it to your phone and install. No Metro/computer needed!"
echo ""
