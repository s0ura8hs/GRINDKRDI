// ============================================
// GRIND — Post-prebuild Gradle patch
// Add this to the bottom of android/app/build.gradle
// after running: npx expo prebuild --platform android
// ============================================
// This forces the JS bundle to be embedded in debug builds
// so the APK works standalone without Metro bundler

// If your build.gradle already has a react { } block, 
// just add this line inside it:
//
//   bundleInDebug = true
//
// Example:
//
// react {
//     bundleInDebug = true    // <-- ADD THIS LINE
//     hermesEnabled = true
//     ... existing config ...
// }
