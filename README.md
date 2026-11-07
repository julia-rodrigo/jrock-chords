# J-Rock Progression Maker (Android)

A Capacitor-wrapped version of the J-Rock progression maker, with:
- a warm dark "ember" theme (charcoal + amber/orange) instead of purple
- real, playable bar-chord diagrams for every chord/voicing, generated from
  genuine movable CAGED guitar shapes (see "How the chord diagrams work" below)

## Project layout
- `www/index.html` — the whole web app (HTML/CSS/JS, no build step), same philosophy as the original single-file app.
- `android/` — the generated native Android (Gradle) project. This is what you open in Android Studio to build/run the app.
- `capacitor.config.json` — app id `com.julia.jrockprogressionmaker`, app name "J-Rock Progression Maker", web assets served from `www/`.

## Building the APK
This machine doesn't have the Android SDK / JDK installed, so the native build has to happen on a machine that does (your own computer, with Android Studio):

1. Install [Android Studio](https://developer.android.com/studio) (it bundles the JDK and SDK).
2. Open the `android/` folder in Android Studio ("Open" → select the `android` folder, not the project root).
3. Let Gradle sync, then press Run (▶) to install on an emulator or a USB-connected phone — or Build → Generate Signed Bundle/APK for a installable APK.

If you edit `www/index.html` later, re-sync the native project before rebuilding:
```bash
npx cap sync android
```
(run from the project root, needs Node.js + `npm install` once).

## How the chord diagrams work
Every chord in the app (all 7 degrees × all keys × all voicings — maj7, add9, sus2, m9, m7♭5, etc.) gets a real, playable **movable bar-chord diagram**, not a stock image. They're generated from the same CAGED-system shapes guitarists actually learn (E-shape major/minor/7/maj7, plus well-known simplified/partial-barre fragments for the jazzier extensions like add9, m9, m7(11)), anchored with the root always on the low-E string and barred up the neck to match the chord's root note in the current key. That's why, for example, IV in the key of G (C major) shows up as an 8th-fret barre, while VIm (E minor) shows as the familiar open-position shape at the nut — both are the same real shape, just at different frets.

I built these myself from interval math rather than scanning in your original cheat-sheet PDF (that one's a paid Ko-fi product, so reproducing its exact artwork wouldn't be right) — but every shape here is a standard, verifiable, real-world fingering.

## Not done yet
- App icon / splash screen still use Capacitor's defaults — swap `android/app/src/main/res/mipmap-*` or run `npx capacitor-assets generate` with your own artwork if you want a custom icon.
- No code signing set up (needed only for a Play Store release, not for local testing).
