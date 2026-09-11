#!/usr/bin/env bash
set -euo pipefail

# Build and package release APK for Boop Android
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="${APP_DIR}/android"
OUTPUT_DIR="${ANDROID_DIR}/app/build/outputs/apk/release"

echo "==> Building release APK with ABI splits..."
cd "${ANDROID_DIR}"
./gradlew assembleRelease

echo "==> Release APKs ready:"
ls -lh "${OUTPUT_DIR}"/*.apk
