(function () {
  "use strict";

  var PLATFORMS = [
    { id: "chatgpt", name: "ChatGPT", url: "https://chat.openai.com", patterns: ["chat.openai.com", "chatgpt.com"] },
    { id: "claude", name: "Claude", url: "https://claude.ai", patterns: ["claude.ai"] },
    { id: "grok", name: "Grok", url: "https://grok.com", patterns: ["grok.com", "x.ai"] }
  ];

  function getCurrentPlatform(url) {
    if (!url) return null;
    for (var i = 0; i < PLATFORMS.length; i++) {
      var p = PLATFORMS[i];
      for (var j = 0; j < p.patterns.length; j++) {
        if (url.indexOf(p.patterns[j]) >= 0) return p;
      }
    }
    return null;
  }

  function getNextPlatform(currentId) {
    var idx = -1;
    for (var i = 0; i < PLATFORMS.length; i++) {
      if (PLATFORMS[i].id === currentId) { idx = i; break; }
    }
    var nextIdx = (idx + 1) % PLATFORMS.length;
    return PLATFORMS[nextIdx];
  }

  window.PortableAIPlatforms = {
    PLATFORMS: PLATFORMS,
    getCurrentPlatform: getCurrentPlatform,
    getNextPlatform: getNextPlatform
  };
})();
