# Conversation collapse schema (v1)

Explicit boundaries so conversational history is bounded, not unbounded.

## Rules

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_TURNS` | 20 | Hard cap on messages included. Older messages are dropped. |
| `RECENT_FULL` | 6 | Last 6 messages get full text (no per-message truncation). |
| `MAX_CHARS_OLD_TURN` | 400 | Messages 7–20 from tail: truncated to 400 chars (tail-biased). |
| `MAX_TOTAL_CONVO_CHARS` | 5500 | Hard cap on Convo block. Oldest non-recent truncated first. |

## Structure

- **D:/Q:** Extracted from *full* conversation (before turn limits). Decisions and open questions survive even when their source messages are collapsed.
- **History: prior discussion summarized above.** Prefix when messages were dropped. D:/Q: captures key points from full convo.
- **Convo{…}** Last 20 turns, with recent 6 full and prior 14 truncated.

## What is allowed to die

- Messages beyond the last 20.
- Per-message detail beyond 400 chars for turns 7–20.
- Redundant filler (via stripFiller, dedupeSentences).

## What survives

- Persona (always; injector layer).
- Project (always; injector layer).
- D:/Q: (from full convo).
- Last 6 messages (full).
- Last 20 messages (compressed for 7–20).
