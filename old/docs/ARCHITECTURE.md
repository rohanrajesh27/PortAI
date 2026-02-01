# Compression & collapse schema

## Constants (compressor.js)

| Constant | Value | Purpose |
|----------|-------|---------|
| MAX_TURNS | 20 | Hard cap on messages included |
| RECENT_FULL | 6 | Last 6 messages: no truncation |
| MAX_CHARS_OLD_TURN | 400 | Messages 7–20: truncate to 400 chars (tail-biased) |
| MAX_TOTAL_CONVO_CHARS | 5500 | Hard cap on Convo block |
| MAX_EXTRACTED | 6 | Max items per D:/Q:/C:/S: block |

## Output structure (80/20)

**D:** Decisions – what was agreed, chosen, settled  
**Q:** Open questions – what's pending, unresolved  
**C:** Constraints – must/must-not, requirements, no-X rules  
**S:** Status – current task, next step, where we left off  
**Convo{…}** Last 20 turns; recent 6 full, prior 14 truncated.

Order: D: Q: C: S: Convo (high-signal first).

## Regex extraction (rule-based)

- **D:** `decided|agreed|chose|going with|the plan is|we'll` + variants
- **Q:** `open question|still need to|what about|how to|figure out` + question marks
- **C:** `no |don't |must |constraint|only |local only|no backend` + variants
- **S:** `currently|next step|working on|stuck on|about to` + variants

## Filler stripping

Removed: filler starts (sure, thanks, ok…), filler ends (got it, makes sense…), meta-phrases (in summary, as discussed…).

## What survives vs. dies

**Survives:** D:/Q:/C:/S:, persona, project, last 6 messages (full), last 20 (compressed).

**Dies:** Messages beyond 20, per-message detail beyond 400 chars for turns 7–20, filler, meta-phrases, duplicate sentences.
