# RoomScanProto

A React Native app built with Expo that enables 3D room scanning for iOS using the RoomPlan API. Scan rooms with your device's camera and save them as USDZ files for viewing and sharing.

## What it does

- **Scan rooms in 3D**: Use your device's camera to create 3D models of rooms
- **Save scans**: Store room scans as USDZ files on your device
- **View & manage**: Browse your saved scans and preview them
- **Native integration**: Uses custom Expo module wrapping the iOS RoomPlan API

## How to run

This project requires a development build (native modules are not supported in Expo Go).

### Prerequisites

- [Bun](https://bun.sh) installed
- Xcode and iOS simulator (or physical device)

### Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Generate native iOS project**

   ```bash
   bunx expo prebuild --platform ios
   ```

3. **Start the development server**

   ```bash
   bunx expo start --dev-client
   ```

4. **Run the app from Xcode**

   - Open `ios/` directory in Xcode
   - Select your target device (simulator or physical device) from the device menu
   - Click the Run button (▶️) or press `Cmd + R`

## Project structure

- `app/` - Main application code (React Native components)
- `modules/ExpoRoomPlan/` - Custom native module for room scanning
  - iOS implementation in `ios/`

## Notes

- Room scanning requires a physical iOS device with LiDAR support
- Simulators may not support all AR features
