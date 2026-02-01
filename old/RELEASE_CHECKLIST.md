# Release Checklist

Use this when preparing a new GitHub release.

## Before creating the zip

- [ ] Update version in `manifest.json`
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Test on ChatGPT, Claude, Grok

## Create the zip

```bash
# From the project root (parent of portable-ai-context)
cd portable-ai-context
zip -r ../PortAI-v0.2.0.zip . -x "*.DS_Store" -x "*.git*"
```

Or manually:
1. Open the `portable-ai-context` folder
2. Select all files and folders **inside** it (not the folder itself)
3. Right-click → Compress
4. Rename to `PortAI-vX.X.X.zip`

## Files that must be in the zip

- manifest.json
- popup.html, popup.js, popup.css
- background.js
- storage.js, injector.js, compressor.js, platforms.js, utils.js, inline.js
- content/chatgpt.js, content/claude.js, content/universal.js
- icon16.png, icon48.png, icon128.png
- PRIVACY_POLICY.html

## GitHub Release

1. Go to repo → Releases → Create a new release
2. Tag: `v0.2.0` (match manifest version)
3. Title: `v0.2.0` or a short description
4. Description: paste from CHANGELOG for this version
5. Attach `PortAI-v0.2.0.zip`
6. Publish

## Replace YOUR_USERNAME

Before publishing, replace `YOUR_USERNAME` in README.md and INSTALL.md with your actual GitHub username.
