# Security

## Overview

Port AI stores data locally and does not send it to third parties. This doc covers risks and mitigations.

---

## Data flow

| Data | Where it lives | Leaves device? |
|------|----------------|----------------|
| Personas, projects, pulled context | `chrome.storage.local` | No |
| Conversation text (Ollama) | Sent to user-configured Ollama URL | Only if user configures Ollama; then to localhost only |

---

## Risks & mitigations

### Ollama URL (fixed in 0.2.0)

**Risk:** User enters a malicious URL; conversation could be sent there.

**Mitigation:** Ollama URL is validated against `localhost` and `127.0.0.1` only. Non-localhost URLs are ignored for summarization.

### XSS

**Risk:** User content (persona, project names) rendered in popup could inject script.

**Mitigation:** All user content is escaped via `esc()` before being set in `innerHTML`. No raw user input is inserted into DOM.

### Content scripts

**Risk:** Malicious page could influence extension behavior.

**Mitigation:** Content scripts run in an isolated world. They only read DOM and inject text; they do not execute remote code or load external scripts.

### Message passing

**Risk:** Malicious page could send spoofed messages to background.

**Mitigation:** `chrome.runtime.sendMessage` from a content script is scoped to that extension. Pages cannot send messages to the extension's background. Message handling is minimal (store + open tab).

### Permissions

- `storage` – Local only; no sync.
- `activeTab`, `scripting`, `tabs` – Required for injection and tab switching.
- `host_permissions: localhost` – Ollama only; no other hosts.

---

## Recommendations

- Enable Discussions in the repo so "Yes" feedback works.
- Do not add telemetry without explicit disclosure.
- If adding new APIs, keep host_permissions minimal.
