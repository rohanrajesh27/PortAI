(function () {
  "use strict";

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action !== "portFromInline") return;

    function storeAndOpen(pulledContext, destPlatformId, destUrl) {
      chrome.storage.local.get({
        personas: [],
        projects: [],
        activePersonaId: null,
        activeProjectId: null,
        pulledContext: null,
        portPending: null,
        apiConfig: {}
      }, function (state) {
        chrome.storage.local.set({
          pulledContext: pulledContext,
          portPending: { to: destPlatformId, timestamp: Date.now(), fallback: pulledContext.fallback }
        }, function () {
          chrome.tabs.create({ url: destUrl });
        });
      });
    }

    if (msg.fallback) {
      storeAndOpen({
        summary: null,
        timestamp: Date.now(),
        source: msg.source,
        count: 0,
        fallback: true
      }, msg.destPlatformId, msg.destUrl);
    } else {
      storeAndOpen({
        summary: msg.summary,
        timestamp: Date.now(),
        source: msg.source,
        count: msg.count || 0,
        fallback: false
      }, msg.destPlatformId, msg.destUrl);
    }
    sendResponse({ ok: true });
    return true;
  });
})();
