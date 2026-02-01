(function () {
  "use strict";

  var FILLER = /\b(sure|thanks|thank you|got it|sounds good|sounds great|perfect|let me think|one sec|hold on|brb|be right back|great question|good point|exactly|i see|gotcha|understood|makes sense|fair enough)\s*[.!]?\s*$/gi;
  var FILLER_START = /^(sure[,\s]*|thanks[,\s]*|thank you[,\s]*|ok[,\s]*|okay[,\s]*|got it[,\s]*|let me think[,\s]*|great question[,\s]*|good point[,\s]*|here'?s (what i think|my take)[:\s]*)/i;

  var MAX_TURNS = 20;
  var RECENT_FULL = 6;
  var MAX_CHARS_OLD_TURN = 400;
  var MAX_TOTAL_CONVO_CHARS = 5500;

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
    s = s.replace(FILLER, "").trim();
    s = s.replace(FILLER_START, "").trim();
    return s;
  }

  function dedupeSentences(text) {
    if (!text || text.length < 200) return text;
    var sents = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    var seen = {};
    var out = [];
    for (var i = 0; i < sents.length; i++) {
      var s = sents[i].trim();
      var key = s.toLowerCase();
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

  function extractDecisionsAndQuestions(text) {
    var decisions = [];
    var questions = [];
    var decisionPatterns = [
      /(?:we |i |let's |let us )(?:decided|decide|chose|chosen|will go with|agreed|settled on)[:\s]+([^.!?\n]+)/gi,
      /(?:decision|outcome|conclusion)[:\s]+([^.!?\n]+)/gi,
      /(?:so we'll|i'll|we'll) ([^.!?\n]+)/gi,
      /(?:going with|using|building) ([^.!?\n]+?)(?:\.|$)/gi
    ];
    var questionPatterns = [
      /(?:open question|still need to|unsolved|undecided|pending|to decide)[:\s]+([^.!?\n]+)/gi,
      /(?:what about|how (?:do we|should we|to)|why|when|where)\s+([^.!?\n]{10,100})\??/gi,
      /([^.!?\n]{15,120})\s*\?\s*$/gm
    ];
    decisionPatterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null && decisions.length < 5) {
        var s = m[1].trim();
        if (s.length > 5 && s.length < 120 && decisions.indexOf(s) < 0) decisions.push(s);
      }
    });
    questionPatterns.forEach(function (re) {
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null && questions.length < 5) {
        var s = m[1].trim();
        if (s.length > 5 && s.length < 120 && questions.indexOf(s) < 0) questions.push(s);
      }
    });
    return { decisions: decisions.slice(0, 5), questions: questions.slice(0, 5) };
  }

  function compressIntelligent(messages) {
    if (!messages || messages.length === 0) return "";
    var fullText = messages.map(function (m) { return (m.content || "").trim(); }).join("\n");
    var extracted = extractDecisionsAndQuestions(fullText);
    var parts = [];
    if (extracted.decisions.length > 0) {
      parts.push("D:" + extracted.decisions.join(";"));
    }
    if (extracted.questions.length > 0) {
      parts.push("Q:" + extracted.questions.join(";"));
    }
    var raw = compressMessages(messages);
    if (raw) parts.push(raw);
    return parts.join(" ");
  }

  window.PortableAICompressor = {
    compressMessages: compressMessages,
    compressIntelligent: compressIntelligent
  };
})();
