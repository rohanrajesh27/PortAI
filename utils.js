(function () {
  "use strict";

  function parseList(str) {
    if (!str || typeof str !== "string") return [];
    return str.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  window.PortableAIUtils = {
    parseList: parseList
  };
})();
