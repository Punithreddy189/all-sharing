# 📦 EcoShare Android Release Package (v1.0.0)

This folder contains the self-contained standalone Android APK for the **EcoShare** resource-sharing mobile application.

---

### 📂 Contents
- **`EcoShare-v1.0.0-Release.apk`** (129 MB): Standalone signed native APK containing all bundled assets, fonts, icons, Firebase Authentication, Cloud Firestore, Cloud Storage, Push Notifications, and Live Chat.
- **`Install-EcoShare.bat`**: 1-Click ADB installer script for physical phones and Android Studio emulators.

---

### 📲 How to Install

#### Option 1: 1-Click Batch Installer (Recommended)
1. Connect your Android phone via USB (with **USB Debugging** enabled) or launch an Android Studio emulator.
2. Double-click **`Install-EcoShare.bat`**.
3. The script will automatically configure port bridges, install the APK, and launch EcoShare.

#### Option 2: Direct ADB Command
```bash
adb install -r EcoShare-v1.0.0-Release.apk
adb shell am start -n com.ecoshare.app/.MainActivity
```

#### Option 3: Sideload via Phone
1. Transfer `EcoShare-v1.0.0-Release.apk` directly to your phone (via USB, Google Drive, or WhatsApp).
2. Tap the file on your device and select **Install** (allow unknown sources if prompted).

---

### 🌟 Included Production Features
- 🔑 **Authentication**: 1-Click Demo Account (`Alex Rivera`) + Strict Firebase Email/Password login.
- 🤖 **AI Vision Auto-Fill**: FastAPI backend scan detection for Books/Comics, Tools, Electronics, Furniture, and Clothing.
- ☁️ **Cloud Storage**: Automatic photo upload to Firebase Cloud Storage.
- 💬 **Live In-App Chat**: Direct messaging between item owners and borrowers.
- 🔔 **Push Notifications**: Native Android notification channels, background alerts, and anti-spam deduplication.
- 🌿 **EcoPoints Rewards**: +100 pts per item shared and real-time environmental impact counters (CO₂ prevented, waste saved).
