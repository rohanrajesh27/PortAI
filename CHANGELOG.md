# Changelog

## [Unreleased]

### Added
- Feedback section in popup: "Is Port AI useful? Yes / Not yet" (links to Discussions / Issues)
- Report issue link
### Fixed
- Ollama URL restricted to localhost/127.0.0.1 only (prevents data exfil to arbitrary URLs)

## [0.2.0] - 2025-02-01

### Added
- Inline floating Port button (ChatGPT, Claude, Grok)
- Fallback mode when scraping fails (persona + project only)
- Optional Ollama summarization
- Persona and project management (add, remove, switch)

### Fixed
- Extension context invalidated errors
- Storage access when context invalid
