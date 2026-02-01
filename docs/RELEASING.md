# Releasing Port AI

## Before release

- [ ] Update version in `manifest.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test on ChatGPT, Claude, Grok

## Create zip

```bash
cd portable-ai-context
zip -r ../PortAI-v0.2.0.zip . -x "*.DS_Store" -x "*.git*" -x "docs/*" -x "old/*"
```

**Manual:** Select all files *inside* the folder (not the folder itself), right-click → Compress, rename to `PortAI-vX.X.X.zip`.

**Include:** manifest.json, popup.*, background.js, storage.js, injector.js, compressor.js, platforms.js, utils.js, inline.js, content/, icon16.png, icon48.png, icon128.png, PRIVACY_POLICY.html

**Exclude:** docs/, old/, .DS_Store, .git

## GitHub Release

1. Repo → Releases → Create a new release
2. Tag: `v0.2.0` (match manifest)
3. Title: `v0.2.0`
4. Description: paste changelog for this version
5. Attach zip
6. Publish
