# Boop — Android App

**Launch Mac apps from your Android phone.**

Boop turns your Android phone into a remote app launcher for your Mac. Discover your Mac on the same WiFi, pair with a 6-digit code, and launch any Mac app with a single tap.

## How It Works

1. **Same WiFi** — both devices must be on the same network
2. **Pair once** — enter the 6-digit code from the Mac menu bar
3. **Add apps** — browse your Mac's installed apps and add them to your dock
4. **Tap to launch** — tap any icon to launch it on your Mac

## Setup

### Prerequisites
- Node.js 18+
- Android Studio with SDK
- An Android phone with USB debugging enabled

### Install & Run

\`\`\`bash
git clone https://github.com/Ankit-2563/boop-android.git
cd boop-android
npm install
npx react-native run-android
\`\`\`

### Required Android Permissions
See [ANDROID_PERMISSIONS.md](ANDROID_PERMISSIONS.md) for the required manifest entries.

## Dependencies

| Package | Purpose |
|---------|---------|
| react-native-zeroconf | Bonjour/mDNS discovery |
| @react-native-async-storage/async-storage | Persist pairing & dock |
| @react-navigation/native | Screen navigation |

## Companion App
This app requires [Boop for Mac](https://github.com/Ankit-2563/boop-mac) running on your MacBook.

## License
MIT
