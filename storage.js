(function () {
  "use strict";

  const DEFAULT_STATE = {
    personas: [],
    projects: [],
    activePersonaId: null,
    activeProjectId: null,
    pulledContext: null,
    portPending: null,
    apiConfig: { ollamaUrl: "" }
  };

  function getStorage() {
    try {
      return typeof chrome !== "undefined" && chrome && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
    } catch (e) {
      return null;
    }
  }

  function getState() {
    return new Promise(function (resolve) {
      var storage = getStorage();
      if (!storage) {
        return resolve(DEFAULT_STATE);
      }
      var done = false;
      function finish(val) {
        if (done) return;
        done = true;
        try {
          resolve(val && typeof val === "object" ? val : DEFAULT_STATE);
        } catch (e) {
          resolve(DEFAULT_STATE);
        }
      }
      try {
        storage.get(DEFAULT_STATE, function (result) {
          try {
            finish(result);
          } catch (e) {
            finish(DEFAULT_STATE);
          }
        });
      } catch (e) {
        finish(DEFAULT_STATE);
      }
    });
  }

  function setState(partial) {
    return new Promise(function (resolve) {
      var storage = getStorage();
      if (!storage) {
        return resolve();
      }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        try { resolve(); } catch (e) {}
      }
      try {
        storage.set(partial, function () {
          try { finish(); } catch (e) { resolve(); }
        });
      } catch (e) {
        resolve();
      }
    });
  }

  function isContextValid() {
    return getStorage() !== null;
  }

  window.PortableAIStorage = {
    DEFAULT_STATE: DEFAULT_STATE,
    getState: getState,
    setState: setState,
    isContextValid: isContextValid
  };
})();
