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

- **Instant QR Code Pairing**: Scan the QR code displayed on your Mac's screen for zero-configuration, one-second pairing.
- **Manual Wi-Fi Fallback**: Connect by typing the local IP and 6-digit PIN if camera scanning is not preferred.
- **Optimized & Lightweight**: Built with ABI splits (`arm64-v8a` and `armeabi-v7a`), reducing APK size from 77MB to ~25MB.
- **Secure Local Auth**: Authenticates all requests via an `X-Dock-Token` header. No third-party servers, internet access, or external telemetry.
- **Custom App Dock**: Choose which Mac applications appear on your phone's home dock.
- **Live App Icons**: Displays high-resolution application icons streamed directly from your Mac.

---

## Building from Source

Prerequisites: Node.js 18+, JDK 17, Android SDK

```bash
git clone https://github.com/Ankit-2563/boop-android.git
cd boop-android
npm install

# Run on connected device or emulator:
npx react-native run-android

# Build optimized release APK:
./scripts/build-apk.sh
# Output: android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

---

## License

MIT © [Ankit-2563](https://github.com/Ankit-2563)
