# Meta Pix

Web app (installable PWA) built from the Claude Design handoff
`project/MetaPix Studio v2.dc.html`. Import an image, optionally add SEO and
copyright metadata, resize for social platforms, pick JPEG / PNG / WebP, and
export at any point. The original file is never changed.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # metadata + sizing unit tests
npm run build    # type-check + production build in dist/
npm run icons    # re-render PNG app icons from public/icon.svg (needs Playwright)
```

### Android APK (Capacitor)

```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease   # needs the Android SDK
```

Releases are built by GitHub Actions when a `v*` tag is pushed
(`.github/workflows/release-apk.yml`). Signing uses the repository secrets
`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`; without
them the APK is signed with a throwaway debug key.

Icons are a subset font in `public/fonts/`. To use a new icon, add its name to
the `icon_names` list of the Material Symbols Rounded Google Fonts URL and
download the font file again.

## Layout

- `src/state.ts` — all app state and actions (editor session, settings, export)
- `src/screens/` — Home, Import, Editor (Metadata / Size / Format), Success, History, Settings
- `src/lib/image.ts` — decode, resize (crop to fill / fit with border), encode
- `src/lib/metadata.ts` — reads EXIF/IPTC/XMP from JPEGs, writes XMP into JPEG, PNG and WebP
- `src/lib/save.ts` — Downloads, custom folder (File System Access API), share sheet;
  in the APK it writes to `Documents/MetaPix` and shares through the native sheet
- `src/lib/storage.ts` — settings in localStorage; recents, history and folder in IndexedDB
- `src/lib/suggest.ts` — "Fill with AI" placeholder (suggests from the file name)

## Known limits

- "Fill with AI" is not AI yet: it builds suggestions from the file name.
  Replace `suggestMetadata` with a model call once there is a backend.
- Keep and Update behave the same: existing EXIF/IPTC is copied over and new
  fields are written as XMP, replacing the original XMP packet.
- Existing metadata is only read from JPEG sources.
- Choosing a custom save folder needs the File System Access API (Chrome on
  desktop/ChromeOS). Android Chrome saves to Downloads; the APK saves to
  Documents/MetaPix.
- The size in the export bar is an estimate; the real size shows after export.
