# Port AI

Continue work on another AI in one click.

---

## What it is

Port AI is a Chrome extension that lets you move a conversation from one AI chatbot to another—ChatGPT, Claude, or Grok—without re-explaining yourself. Copy-paste sends everything and bloats the new chat. Port AI compresses what matters (decisions, open questions, constraints) and injects it so the next AI picks up where you left off.

---

## How it works

1. You’re in a chat on ChatGPT (or Claude, or Grok).
2. You click the Port AI icon or the floating **Port** button.
3. You choose where to port (e.g. “Port to Claude”).
4. A new tab opens on the other AI with your conversation compressed and ready. You keep going.

The extension pulls your chat from the page, compresses it (keeps decisions, questions, constraints, recent turns), and injects that into a new chat. No backend. Everything stays on your device.

---

## Purpose

Switch between AIs when you need different strengths—e.g. start in ChatGPT, move to Claude for coding, or Grok for real-time info—without losing context or restarting the conversation.

---

## Installation

**You need:** Google Chrome (Windows or Mac)

### Step 1: Download

1. Go to [Releases](https://github.com/rohanrajesh27/PortAI/releases)
2. Click the latest version (e.g. **v0.2.0**)
3. Download the `.zip` file

The file usually ends up in your **Downloads** folder.

### Step 2: Extract the zip

**Windows:**

- Right‑click the zip file → **Extract All**
- Choose a folder (or use the default) → **Extract**
- Remember where the extracted folder is

**Mac:**

- Double‑click the zip file
- A new folder appears (e.g. `PortAI-v0.2.0`)

### Step 3: Open Chrome Extensions

1. Open **Google Chrome**
2. In the address bar, type: `chrome://extensions`
3. Press Enter

### Step 4: Turn on Developer mode

1. Find **Developer mode** in the top‑right of the Extensions page
2. Turn the switch **ON** (it turns blue)

### Step 5: Load the extension

1. Click **Load unpacked**
2. In the window that opens, go to the folder you extracted (Step 2)
3. Select that folder (it should contain a file called `manifest.json`)
4. Click **Select Folder** (Windows) or **Select** (Mac)

### Step 6: Confirm

The Port AI icon should appear in your Chrome toolbar. If you don’t see it, click the **puzzle piece** icon and click **Pin** next to Port AI.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Load unpacked” is missing | Turn **Developer mode** ON (Step 4) |
| “Manifest file is missing or unreadable” | Select the folder that contains `manifest.json`, not a file inside it |
| Icon doesn’t appear | Click the puzzle piece in the toolbar → Pin Port AI |

---

## Optional

- **Persona & project:** Add who you are and what you’re working on in the popup. This gets injected with every port.
- **Ollama:** If you run [Ollama](https://ollama.com) locally, you can add its URL for richer summaries.

---

## Privacy

Data stays on your device. No servers. No analytics. [Privacy policy](PRIVACY_POLICY.html)

---

## Updates

When a new version is released:

1. Open `chrome://extensions`
2. Remove the old Port AI extension
3. Download the new zip from [Releases](https://github.com/rohanrajesh27/PortAI/releases)
4. Repeat the installation steps above
