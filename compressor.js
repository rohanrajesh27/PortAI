(function () {
  "use strict";

  /* --- FILLER (80% of noise) --- */
  var FILLER_END = /\b(sure|thanks|thank you|got it|sounds good|sounds great|perfect|let me think|one sec|hold on|brb|be right back|great question|good point|exactly|i see|gotcha|understood|makes sense|fair enough|nice|cool|awesome|right|agreed|yep|yup|yes|no problem|of course|absolutely|definitely|will do|can do)\s*[.!]?\s*$/gi;
  var FILLER_START = /^(sure[,\s]*|thanks[,\s]*|thank you[,\s]*|ok[,\s]*|okay[,\s]*|got it[,\s]*|let me think[,\s]*|great question[,\s]*|good point[,\s]*|here'?s (what i think|my take|the plan)[:\s]*|in (short|summary|brief)[:\s]*|to summarize[:\s]*|as discussed[,\s]*|as we (discussed|agreed)[,\s]*)/i;
  var META_PHRASES = /\b(in summary|to summarize|to sum up|in short|in brief|as discussed|as we discussed|as mentioned|as i said|like i said|to reiterate)[:,\s]+/gi;

  var MAX_TURNS = 20;
  var RECENT_FULL = 6;
  var MAX_CHARS_OLD_TURN = 400;
  var MAX_TOTAL_CONVO_CHARS = 5500;
  var MAX_EXTRACTED = 6;

  function stripInjectedContext(text) {
    if (!text || typeof text !== "string") return "";
    var s = text.trim();
    var idx = s.indexOf("PulledConvo from ");
    if (idx >= 0) {
      var before = s.slice(0, idx).trim();
      if (before.indexOf("Context:") >= 0 || before.indexOf("--- Continuation ---") >= 0 || before.indexOf("User{") >= 0) {
        return s.slice(idx);
      }
    }
    if (/^Context:\s*\n/.test(s) || /^User\{/.test(s) || /^--- Continuation ---/.test(s)) {
      var m = s.match(/PulledConvo from [^:]+:\s*(.+)/s);
      return m ? "PulledConvo from " + m[1] : s.replace(/^[\s\S]*?PulledConvo from /, "PulledConvo from ");
    }
    return s;
  }

  function squeeze(text) {
    if (!text || typeof text !== "string") return "";
    return text.trim().replace(/\s+/g, " ");
  }

  function stripFiller(text) {
    if (!text || typeof text !== "string") return "";
    var s = text.trim();
    s = s.replace(FILLER_END, "").trim();
    s = s.replace(FILLER_START, "").trim();
    s = s.replace(META_PHRASES, "").trim();
    return s;
  }

  function dedupeSentences(text) {
    if (!text || text.length < 200) return text;
    var sents = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    var seen = {};
    var out = [];
    for (var i = 0; i < sents.length; i++) {
      var s = sents[i].trim();
      var key = s.toLowerCase().replace(/\s+/g, " ");
      if (seen[key]) continue;
      seen[key] = true;
      out.push(s);
    }
    return out.join(" ");
  }

  function optimizeForLLM(text) {
    if (!text || typeof text !== "string") return "";
    var s = squeeze(stripFiller(text));
    s = dedupeSentences(s);
    return s;
  }

  function truncateTail(str, max) {
    if (!str || str.length <= max) return str;
    return "…" + str.slice(-max);
  }

  function addUnique(arr, str, maxLen, minLen) {
    if (!str || str.length < (minLen || 5) || str.length > (maxLen || 150)) return;
    var key = str.toLowerCase().trim();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].toLowerCase() === key) return;
    }
    if (arr.length < MAX_EXTRACTED) arr.push(str.trim());
  }

  function extractDecisions(text) {
    var out = [];
    var patterns = [
      /(?:we |i |let'?s |let us )(?:decided|decide|chose|chosen|will go with|agreed|settled on|opted for)[:\s]+([^.!?\n]+)/gi,
      /(?:decision|outcome|conclusion|choice|approach)[:\s]+([^.!?\n]+)/gi,
      /(?:so we'll|i'll|we'll|we will|going to) ([^.!?\n]+?)(?:\.|,|$)/gi,
      /(?:going with|using|building|implementing) ([^.!?\n]+?)(?:\.|,|$)/gi,
      /(?:will use|using|chose) ([^.!?\n]+?)(?:\s+for\s|\.|,|$)/gi,
      /(?:the plan is|plan is) ([^.!?\n]+)/gi,
      /(?:that'?s (?:the |our )?)(?:approach|decision|plan)[:\s]+([^.!?\n]+)/gi,
      /(?:final|confirmed) ([^.!?\n]{8,100})(?:\.|$)/gi,
      /(?:we'?re |i'?m )([^.!?\n]*(?:ing)\s+[^.!?\n]{5,80})(?:\.|$)/gi
    ];
    patterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) addUnique(out, m[1], 140);
    });
    return out.slice(0, MAX_EXTRACTED);
  }

  function extractQuestions(text) {
    var out = [];
    var patterns = [
      /(?:open question|still need to|unsolved|undecided|pending|to decide|unresolved|left to)[:\s]+([^.!?\n]+)/gi,
      /(?:what about|how (?:do we|should we|to|can we)|why|when|where|which)\s+([^.!?\n]{8,100})\??/gi,
      /(?:need to figure out|figure out|determine|decide) ([^.!?\n]+)/gi,
      /([^.!?\n]{12,120})\s*\?\s*$/gm,
      /(?:next step|next question|remaining)[:\s]+([^.!?\n]+)/gi,
      /(?:wondering|curious (?:about|if)|not sure (?:about|if)) ([^.!?\n]+)/gi
    ];
    patterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) addUnique(out, m[1], 140);
    });
    return out.slice(0, MAX_EXTRACTED);
  }

  function extractConstraints(text) {
    var out = [];
    var patterns = [
      /(?:no |don'?t |must not |shouldn'?t |avoid |without )([^.!?\n]{5,80})(?:\.|,|$)/gi,
      /(?:must |has to |need to |should |requires? )([^.!?\n]{5,80})(?:\.|,|$)/gi,
      /(?:constraint|requirement|rule)[:\s]+([^.!?\n]+)/gi,
      /(?:only |just |strictly )([^.!?\n]{5,80})(?:\.|,|$)/gi,
      /(?:local ?only|no backend|no (?:cloud|server|api|external))/gi,
      /(?:chrome ?only|extension ?only|browser ?only)/gi,
      /(?:no (?:third[- ]?party|external) (?:servers?|apis?))/gi
    ];
    patterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        var s = (m[1] || m[0] || "").trim();
        if (s) addUnique(out, s, 100);
      }
    });
    return out.slice(0, 4);
  }

  function extractStatus(text) {
    var out = [];
    var patterns = [
      /(?:currently |right now |we'?re |i'?m )([^.!?\n]*(?:working on|debugging|fixing|implementing|building|testing|refactoring|updating)[^.!?\n]{0,80})(?:\.|,|$)/gi,
      /(?:we'?re |i'?m )([a-z]+ing [^.!?\n]{5,80})(?:\.|,|$)/gi,
      /(?:next step|next|to do|need to|remaining)[:\s]+([^.!?\n]+)/gi,
      /(?:status|where we (?:are|left off))[:\s]+([^.!?\n]+)/gi,
      /(?:stuck on|blocked by|issue with) ([^.!?\n]+)/gi,
      /(?:last thing|most recent) ([^.!?\n]+)/gi,
      /(?:about to|ready to) ([^.!?\n]+)/gi
    ];
    patterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) addUnique(out, m[1], 100);
    });
    return out.slice(0, 4);
  }

  function extractAll(text) {
    return {
      decisions: extractDecisions(text),
      questions: extractQuestions(text),
      constraints: extractConstraints(text),
      status: extractStatus(text)
    };
  }

  function compressMessages(messages) {
    if (!messages || messages.length === 0) return "";
    var recent = messages.slice(-MAX_TURNS);
    var dropped = messages.length - recent.length;
    var parts = [];
    var totalChars = 0;
    var cutoff = recent.length - RECENT_FULL;

    for (var i = 0; i < recent.length; i++) {
      var m = recent[i];
      var role = (m.role || "unknown").toLowerCase();
      var label = role === "user" ? "U" : "A";
      var raw = stripInjectedContext(m.content || "");
      var text = optimizeForLLM(raw);
      if (!text) continue;

      var isOld = i < cutoff;
      if (isOld && text.length > MAX_CHARS_OLD_TURN) {
        text = truncateTail(text, MAX_CHARS_OLD_TURN);
      }
      text = text.replace(/\n/g, " ");
      var line = label + ":" + text;

      if (totalChars + line.length > MAX_TOTAL_CONVO_CHARS) {
        if (parts.length === 0) parts.push(line.slice(0, MAX_TOTAL_CONVO_CHARS));
        break;
      }
      parts.push(line);
      totalChars += line.length;
    }

    var out = parts.length > 0 ? "Convo{" + parts.join("|") + "}" : "";
    if (dropped > 0 && out) {
      out = "History: prior discussion summarized above. " + out;
    }
    return out;
  }

  function compressIntelligent(messages) {
    if (!messages || messages.length === 0) return "";
    var fullText = messages.map(function (m) { return (m.content || "").trim(); }).join("\n");
    var ex = extractAll(fullText);
    var parts = [];

    if (ex.decisions.length > 0) parts.push("D:" + ex.decisions.join(";"));
    if (ex.questions.length > 0) parts.push("Q:" + ex.questions.join(";"));
    if (ex.constraints.length > 0) parts.push("C:" + ex.constraints.join(";"));
    if (ex.status.length > 0) parts.push("S:" + ex.status.join(";"));

    var raw = compressMessages(messages);
    if (raw) parts.push(raw);

    return parts.join(" ");
  }

  window.PortableAICompressor = {
    compressMessages: compressMessages,
    compressIntelligent: compressIntelligent,
    extractAll: extractAll
  };
})();
