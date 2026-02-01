# Compression & collapse schema

## Constants (compressor.js)

| Constant | Value | Purpose |
|----------|-------|---------|
| MAX_TURNS | 20 | Hard cap on messages included |
| RECENT_FULL | 6 | Last 6 messages: no truncation |
| MAX_CHARS_OLD_TURN | 400 | Messages 7–20: truncate to 400 chars (tail-biased) |
| MAX_TOTAL_CONVO_CHARS | 5500 | Hard cap on Convo block |

## Output structure

- **D:/Q:** Extracted from full convo. Decisions and questions survive even when source messages are collapsed.
- **History: prior discussion summarized above.** Prefix when messages were dropped.
- **Convo{…}** Last 20 turns; recent 6 full, prior 14 truncated.

## What survives vs. dies

**Survives:** Persona, project, D:/Q:, last 6 messages (full), last 20 (compressed).

**Dies:** Messages beyond 20, per-message detail beyond 400 chars for turns 7–20, filler (stripFiller, dedupeSentences).
