# Building GRIND APK Locally (No Expo Go, No Cloud)

## Prerequisites (You Already Have These)
- Android Studio (with Android SDK)
- Node.js 18+
- Java JDK 17 (comes with Android Studio)

## Step-by-Step Guide

### Step 1: Download the Code
Download/clone this entire project to your local machine.

### Step 2: Install Dependencies
```bash
cd frontend
npm install
```

### Step 3: Generate the Native Android Project
```bash
npx expo prebuild --platform android --clean
```
This creates a full native `android/` folder — a standard Android Studio project.
**Expo is only used as a scaffolding tool here. The output is pure native Android code.**

### Step 4: Build the Debug APK (Simplest — Works Standalone)
```bash
cd android
./gradlew assembleDebug
```
> **Windows users:** Use `gradlew.bat assembleDebug` instead.

Your APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**This APK installs and runs standalone — no Expo Go needed.**

---

## Building a Release APK (Signed — For Sharing/Submission)

### Step 5: Generate a Signing Keystore
```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore grind-release.keystore \
  -alias grind \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
It will ask for a password — remember it. Move the file into `android/app/`:
```bash
mv grind-release.keystore android/app/
```

### Step 6: Configure Signing
Create a file `android/gradle.properties` (or add to existing) with:
```properties
GRIND_UPLOAD_STORE_FILE=grind-release.keystore
GRIND_UPLOAD_KEY_ALIAS=grind
GRIND_UPLOAD_STORE_PASSWORD=your_password_here
GRIND_UPLOAD_KEY_PASSWORD=your_password_here
```

Then edit `android/app/build.gradle` — find the `android {` block and add:
```gradle
android {
    ...
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
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### Step 7: Build the Release APK
```bash
cd android
./gradlew assembleRelease
```

Your signed APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Opening in Android Studio (Alternative)

1. Run `npx expo prebuild --platform android --clean` first
2. Open Android Studio
3. File → Open → Select the `frontend/android` folder
4. Wait for Gradle sync to complete
5. Build → Build Bundle(s) / APK(s) → Build APK(s)
6. Android Studio shows a notification with the APK location

---

## Installing the APK on Your Phone

1. Transfer the `.apk` file to your Android phone (USB / email / Google Drive)
2. On your phone: Settings → Security → "Install from Unknown Sources" → Enable
3. Tap the `.apk` file → Install
4. Open GRIND from your app drawer — **fully standalone, no Expo Go**

---

## Troubleshooting

### "SDK location not found"
Create `android/local.properties` with:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk   # macOS
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk   # Windows
```

### "Java version error"
Make sure JAVA_HOME points to JDK 17:
```bash
export JAVA_HOME=/path/to/jdk-17   # macOS/Linux
# Or set in Android Studio: File → Project Structure → SDK Location
```

### "Could not find tools.jar"
Use JDK 17, not JRE. Android Studio bundles JDK — use that one.

---

## What's in the APK?

The APK is a **native Android application** containing:
- React Native runtime (JavaScript engine)
- All your app screens compiled and bundled
- All assets (icons, fonts)
- No dependency on Expo Go at all

The app name will show as "GRIND" on the home screen with the configured icon.
