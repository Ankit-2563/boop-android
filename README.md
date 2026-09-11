# Boop — Android App

[![Release](https://img.shields.io/github/v/release/Ankit-2563/boop-android?color=green&label=Android%20APK)](https://github.com/Ankit-2563/boop-android/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Launch Mac apps directly from your Android phone.**

Boop turns your Android phone into a remote dock for your Mac. Discover your Mac on the same WiFi, pair with a 6-digit code, and launch any Mac app with a single tap.

---

## 📱 Quick Download & Install (No PC needed!)

1. On your Android phone, download the latest **[Boop-v0.1.0.apk](https://github.com/Ankit-2563/boop-android/releases/latest/download/Boop-v0.1.0.apk)**.
2. Tap the downloaded file to install (if prompted, allow "Install unknown apps" from your browser).
3. Ensure your phone and Mac are connected to the same WiFi.
4. Launch **Boop** on your phone.
5. Enter the 6-digit pairing code displayed in the Mac companion's menu bar icon.
6. Done! Tap any app to launch it on your Mac.

---

## Companion Mac App

You need the companion app running on your Mac:
- **Download for Mac**: [Boop for macOS](https://github.com/Ankit-2563/boop-mac/releases/latest)

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
