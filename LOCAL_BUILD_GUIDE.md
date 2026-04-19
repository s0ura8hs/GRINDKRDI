# Building GRIND APK Locally (No Expo Go, No Cloud, No Metro)

## Prerequisites
- Android Studio (with Android SDK)
- Node.js 18+
- Java JDK 17 (comes with Android Studio)

---

## QUICK BUILD (Recommended — One Script)

```bash
cd frontend
npm install
npx expo prebuild --platform android --clean
bash build-apk.sh
```

Your standalone APK will be ready. Transfer to phone → Install → Works offline.

---

## MANUAL BUILD (Step by Step)

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Generate Native Android Project
```bash
npx expo prebuild --platform android --clean
```

### Step 3: Create JS Bundle (⚠️ THIS IS THE CRITICAL STEP)

> **This is what makes the APK work standalone without Metro/computer.**
> Without this step, the app will show "Unable to load script" error.

```bash
# Create the assets folder
mkdir -p android/app/src/main/assets

# Bundle all JavaScript into the APK
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/
```

**Windows PowerShell version:**
```powershell
mkdir -Force android\app\src\main\assets

npx react-native bundle `
  --platform android `
  --dev false `
  --entry-file node_modules/expo-router/entry.js `
  --bundle-output android\app\src\main\assets\index.android.bundle `
  --assets-dest android\app\src\main\res\
```

### Step 4: Build the APK

**Option A — Debug APK (No signing needed):**
```bash
cd android
./gradlew assembleDebug
```
APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B — Release APK (Signed, recommended):**

First generate a keystore (one time only):
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore android/app/grind-release.keystore \
  -alias grind \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Add to `android/gradle.properties`:
```properties
GRIND_UPLOAD_STORE_FILE=grind-release.keystore
GRIND_UPLOAD_KEY_ALIAS=grind
GRIND_UPLOAD_STORE_PASSWORD=your_password
GRIND_UPLOAD_KEY_PASSWORD=your_password
```

Edit `android/app/build.gradle` — inside the `android {` block add:
```gradle
signingConfigs {
    release {
        storeFile file(GRIND_UPLOAD_STORE_FILE)
        storePassword GRIND_UPLOAD_STORE_PASSWORD
        keyAlias GRIND_UPLOAD_KEY_ALIAS
        keyPassword GRIND_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

Then build:
```bash
cd android
./gradlew assembleRelease
```
APK at: `android/app/build/outputs/apk/release/app-release.apk`

---

## Via Android Studio (Visual Method)

1. Run these commands first:
```bash
cd frontend
npm install
npx expo prebuild --platform android --clean
mkdir -p android/app/src/main/assets
npx react-native bundle --platform android --dev false --entry-file node_modules/expo-router/entry.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
```

2. Open Android Studio → **File → Open** → select `frontend/android`
3. Wait for Gradle sync to complete
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. Click the notification link to find your APK

---

## Installing on Your Phone

1. Transfer `.apk` to your phone (USB / email / Google Drive)
2. Settings → Security → "Install from Unknown Sources" → Enable
3. Tap the `.apk` → Install
4. Open GRIND — **fully standalone, no computer connection needed**

---

## Common Errors

### "Unable to load script" (Red Screen)
**Cause:** The JS bundle is not embedded in the APK.
**Fix:** Run Step 3 above (the `npx react-native bundle` command) before building.

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk         # macOS
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk  # Windows
```

### "Execution failed for task ':app:mergeReleaseResources'"
Duplicate resources from the bundle command. Fix:
```bash
# Delete duplicate drawable folders
rm -rf android/app/src/main/res/drawable-*
rm -rf android/app/src/main/res/raw

# Re-run the bundle command from Step 3
# Then rebuild
```

### Java version error
Ensure JAVA_HOME points to JDK 17 (bundled with Android Studio).
