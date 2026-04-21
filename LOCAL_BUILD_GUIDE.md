# Building GRIND APK — STANDALONE (No Metro, No Expo Go)

## Why "Unable to load script" Happens

Debug APKs are **hardcoded to connect to Metro bundler** on your computer.
Even if you manually put the JS bundle file in the assets folder, the debug
build config **ignores it** and tries to connect to Metro anyway.

**The fix:** Tell Gradle to embed the JS bundle in debug builds by adding
`bundleInDebug = true` to `android/app/build.gradle`.

---

## Windows — Quick Build (Use This)

### Option A: Automated Script
```cmd
cd frontend
build-apk.bat
```
This handles everything including the Gradle patch.

### Option B: Manual Steps

```cmd
cd frontend

REM 1. Install dependencies
npm install

REM 2. Generate Android project
npx expo prebuild --platform android --clean

REM 3. CRITICAL: Patch build.gradle
REM    Open android\app\build.gradle in a text editor
REM    Find the "react {" block and add this line inside it:
REM
REM    react {
REM        bundleInDebug = true       ← ADD THIS LINE
REM        hermesEnabled = true
REM        ... rest of config ...
REM    }

REM 4. Create assets folder and bundle JS
mkdir android\app\src\main\assets

npx react-native bundle --platform android --dev false --entry-file node_modules/expo-router/entry.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res\

REM 5. Build
cd android
gradlew.bat assembleDebug
cd ..
```

APK at: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## macOS/Linux — Quick Build

```bash
cd frontend
npm install
npx expo prebuild --platform android --clean

# Patch build.gradle — add bundleInDebug = true inside the react { } block
sed -i '' 's/react {/react {\n    bundleInDebug = true/' android/app/build.gradle 2>/dev/null || \
sed -i 's/react {/react {\n    bundleInDebug = true/' android/app/build.gradle

# Bundle JS
mkdir -p android/app/src/main/assets
npx react-native bundle --platform android --dev false \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# Build
cd android && ./gradlew assembleDebug && cd ..
```

---

## Via Android Studio

1. Run steps 1-4 from the manual steps above (up to and including the bundle command)
2. Open Android Studio → File → Open → select `frontend/android`
3. **IMPORTANT:** Before building, open `app/build.gradle` and verify `bundleInDebug = true` is inside the `react { }` block
4. Build → Build Bundle(s) / APK(s) → Build APK(s)

---

## Verifying the Fix

After building, check that the bundle file is inside the APK:
```cmd
REM Windows
"C:\Users\YOUR_NAME\AppData\Local\Android\Sdk\build-tools\35.0.0\aapt" dump --no-values resources android\app\build\outputs\apk\debug\app-debug.apk | findstr "index.android"
```

You should see `index.android.bundle` listed. If not, the bundle wasn't included.

---

## Troubleshooting

### Still seeing "Unable to load script"
1. Verify `bundleInDebug = true` is in `android/app/build.gradle` inside the `react { }` block
2. Verify `android/app/src/main/assets/index.android.bundle` exists and is > 1MB
3. Rebuild from scratch: delete `android` folder and start over

### "Execution failed for task ':app:mergeDebugResources'" (duplicate resources)
```cmd
REM Delete duplicate drawable folders that the bundle command created
for /d %G in (android\app\src\main\res\drawable-*) do rmdir /s /q "%G"
rmdir /s /q android\app\src\main\res\raw 2>nul
REM Then rebuild
cd android && gradlew.bat assembleDebug && cd ..
```

### "SDK location not found"
Create `android/local.properties` with:
```
sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### JDK 21 issues
Expo SDK 54 / React Native 0.81 works best with **JDK 17**. If you have JDK 21, it should work too, but if you see errors, try JDK 17.
