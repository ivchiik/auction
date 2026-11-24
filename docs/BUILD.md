# Local preview builds

Auction 0.2.0 uses Expo SDK 58 / React Native 0.88.1. These are local hiring-pitch previews, not store releases.

Native builds keep the identifier `com.paddle.pitch` from the first preview, with Android `versionCode` 2 and iOS build 2, so the 0.1.0 preview updates in place and keeps its saved games. Players never see the identifier; final store identifiers are a release decision.

## Android

The standalone ARM64 APK contains its JavaScript, fonts and game catalog. It runs without Metro. Photos need connectivity; designed initials/art replace unavailable photos.

Built with Node 22.14.0, npm 10.9.2, JDK 21.0.7, Android compile SDK 37 / target 36, NDK 27.1.12297006. Gradle installs SDK components when needed and already licensed. Build command after `npm ci`:

```bash
npx expo prebuild --platform android --no-install
cd android
./gradlew generateCodegenArtifactsFromSchema --no-configure-on-demand --max-workers=2
./gradlew :app:assembleRelease --no-configure-on-demand --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

Set `JAVA_HOME` to a compatible JDK first. The first build's default 2GB heap / 512MB metaspace was sufficient but produced a memory-pressure warning; a larger supported local JVM allocation can improve rebuild time. The explicit codegen pass avoids missing generated native headers observed in the initial Expo CLI build.

Output: `android/app/build/outputs/apk/release/app-release.apk`. The local copy is `artifacts/builds/auction-0.2.0-android-arm64.apk`; that folder is git-ignored, so the repository does not carry binaries. Install on a matching emulator or an authorized Android device with `adb install -r <apk>`. ARM64 is intentional for this preview; other architectures can be built by changing/removing `reactNativeArchitectures`.

The generated Expo template uses its local debug signing certificate for this release-configuration preview. Company signing is required before store delivery. No signing credentials were created or copied from another project.

## iOS

Expo Go for SDK 58 is the tested local iPhone path:

```bash
npm ci
npm start
```

Open it in matching Expo Go. Native standalone builds require **Xcode 26.4 or newer**, as listed in the [Expo SDK compatibility table](https://docs.expo.dev/versions/latest/). This Mac has Xcode 26.2 / Swift 6.2.3. Prebuild and CocoaPods installation succeeded, but the standalone Release compile failed in ExpoModulesJSI (`JavaScriptObject.swift`: sending `slot` risks causing data races). No iOS standalone artifact is claimed.

After installing a supported Xcode, select it and run:

```bash
npx expo run:ios --configuration Release --device generic --output .work/ios-release --no-bundler
```

For this Mac, CocoaPods 1.16.2 is available with Ruby 3.4.2 at `~/.asdf/installs/ruby/3.4.2/bin`; put that directory on PATH before prebuild. A generic build produces a simulator app, not an iPhone IPA. TestFlight/device distribution still requires the company's Apple developer/signing setup.

## Generated files

`ios/` and `android/` are generated and ignored. Keep app configuration and dependencies in `app.json` / `package.json`; run prebuild again after native configuration changes. Do not rely on edits only inside generated native folders.
