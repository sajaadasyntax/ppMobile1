# Local Build Guide

This guide explains how to build your Expo app locally to avoid consuming Expo's concurrency limits.

## Prerequisites

1. **For Android:**
   - Android Studio installed
   - Android SDK configured
   - Java Development Kit (JDK) installed
   - Environment variables set (ANDROID_HOME, JAVA_HOME)

2. **For iOS (macOS only):**
   - Xcode installed
   - CocoaPods installed (`sudo gem install cocoapods`)
   - Apple Developer account (for device builds)

3. **EAS CLI (for EAS local builds):**
   ```bash
   npm install -g eas-cli
   eas login
   ```

## Option 1: Prebuild + Native Build (Recommended)

### Step 1: Generate Native Folders

```bash
# Generate both Android and iOS native folders
npm run prebuild

# Or generate only Android
npm run prebuild:android

# Or generate only iOS
npm run prebuild:ios

# Clean prebuild (removes existing native folders first)
npm run prebuild:clean
```

This creates `android/` and `ios/` folders in your project.

### Step 2: Build Locally

#### Android (APK for testing):
```bash
# Option A: Using Expo CLI
npm run android

# Option B: Using Gradle directly
npm run build:android:apk
# Output: android/app/build/outputs/apk/release/app-release.apk

# Option C: Using EAS Build locally
npm run build:android:local
```

#### Android (AAB for Play Store):
```bash
# Option A: Using Gradle
npm run build:android:aab
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Option B: Using EAS Build locally
eas build --platform android --local --profile production
```

#### iOS (Simulator):
```bash
# Using Expo CLI
npm run ios

# Or using EAS Build locally
npm run build:ios:local
```

#### iOS (Device):
```bash
# Open Xcode and build from there
open ios/ppapp.xcworkspace

# Or using EAS Build locally
eas build --platform ios --local --profile production
```

## Option 2: EAS Build with Local Option

This uses EAS Build but runs it on your machine (doesn't consume concurrency):

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli
eas login

# Build Android locally
eas build --platform android --local

# Build iOS locally
eas build --platform ios --local

# Build both platforms locally
eas build --platform all --local
```

## Option 3: Direct Native Development

After prebuild, you can work directly with native code:

### Android:
```bash
cd android
./gradlew assembleDebug  # Debug APK
./gradlew assembleRelease # Release APK
./gradlew bundleRelease   # Release AAB
```

### iOS:
```bash
cd ios
pod install
# Then open in Xcode
open ppapp.xcworkspace
```

## Building for Production

### Android Production Build:

1. **Generate native folders:**
   ```bash
   npm run prebuild:android
   ```

2. **Build AAB (for Play Store):**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

3. **Or use EAS Build locally:**
   ```bash
   eas build --platform android --local --profile production
   ```

### iOS Production Build:

1. **Generate native folders:**
   ```bash
   npm run prebuild:ios
   ```

2. **Open in Xcode:**
   ```bash
   cd ios
   pod install
   open ppapp.xcworkspace
   ```

3. **In Xcode:**
   - Select "Any iOS Device" or your device
   - Product → Archive
   - Distribute App

4. **Or use EAS Build locally:**
   ```bash
   eas build --platform ios --local --profile production
   ```

## Troubleshooting

### Prebuild Issues:

- **"Module not found" errors:** Run `npm install` first
- **Native folder conflicts:** Use `npm run prebuild:clean`
- **Plugin errors:** Check `app.json` plugins configuration

### Android Build Issues:

- **Gradle errors:** Check `android/gradle.properties` and `android/build.gradle`
- **SDK not found:** Verify `ANDROID_HOME` environment variable
- **Java version:** Ensure Java 17+ is installed

### iOS Build Issues:

- **Pod install errors:** Run `cd ios && pod deintegrate && pod install`
- **Signing errors:** Configure signing in Xcode
- **CocoaPods:** Ensure CocoaPods is up to date

## Notes

- The `android/` and `ios/` folders are generated and should be in `.gitignore`
- After prebuild, you can modify native code if needed
- Always run `npm run prebuild` after updating `app.json` or adding new native modules
- Local builds are faster and don't consume Expo's build concurrency
- For CI/CD, you can still use EAS Build cloud builds when needed

## Quick Reference

```bash
# Generate native folders
npm run prebuild

# Build Android APK locally
npm run build:android:apk

# Build Android AAB locally
npm run build:android:aab

# Build iOS locally (requires macOS)
npm run ios

# EAS Build locally (both platforms)
eas build --platform all --local
```

