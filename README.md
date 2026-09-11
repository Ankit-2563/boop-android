# Boop — Android App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Launch Mac apps directly from your Android phone.**

Boop turns your Android phone into a remote dock for your Mac. Discover your Mac on the same WiFi, pair with a 6-digit code, and launch any Mac app with a single tap.

---

## 📱 Getting Started

Downloadable APK builds will be available directly on the official Boop website (coming soon). You can also build and run from source using the steps below.

---

## Companion Mac App

You need the companion app running on your Mac:
- **Mac Companion Repository**: [Boop for macOS](https://github.com/Ankit-2563/boop-mac)

---

## Features

- **Zero Configuration**: Automatically scans and detects your Mac over Bonjour/mDNS on local WiFi.
- **Secure Pairing**: Protected by a 6-digit rotating token.
- **Custom App Dock**: Choose which Mac applications appear on your phone's home dock.
- **Live App Icons**: Displays high-resolution application icons streamed directly from your Mac.

---

## Building from Source

Prerequisites: Node.js 18+, JDK 17, Android SDK

```bash
git clone https://github.com/Ankit-2563/boop-android.git
cd boop-android
npm install

# Connect your phone via USB with USB Debugging enabled:
npx react-native run-android

# Or build the APK locally:
cd android
./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## License

MIT © [Ankit-2563](https://github.com/Ankit-2563)
