(function () {
  "use strict";

  var PLATFORMS = window.PortableAIPlatforms && window.PortableAIPlatforms.PLATFORMS || [];
  var getCurrentPlatform = window.PortableAIPlatforms && window.PortableAIPlatforms.getCurrentPlatform;

  function createInlineButton(platformId, doPull, findInputContainer) {
    if (!PLATFORMS.length) return;
    var current = getCurrentPlatform ? getCurrentPlatform(window.location.href) : null;
    var others = PLATFORMS.filter(function (p) { return p.id !== platformId; });
    if (others.length === 0) return;

    var btn = document.createElement("button");
    btn.className = "port-ai-inline-btn";
    btn.setAttribute("aria-label", "Port to another AI");
    btn.innerHTML = "<span>Port</span>";
    btn.style.cssText = "display:flex;align-items:center;padding:8px 12px;font-size:12px;font-weight:500;font-family:system-ui,sans-serif;color:#fff;background:#1a1a1a;border:1px solid #333;border-radius:8px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);position:relative;";
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:2147483646;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;";
    wrapper.appendChild(btn);
    btn.style.pointerEvents = "auto";
    btn.onmouseover = function () { btn.style.background = "#2a2a2a"; };
    btn.onmouseout = function () { btn.style.background = "#1a1a1a"; };

    var dropdown = null;
    function hideDropdown() {
      if (dropdown && dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
      dropdown = null;
      document.removeEventListener("click", hideDropdown);
    }

    btn.onclick = function (e) {
      e.stopPropagation();
      if (dropdown) {
        hideDropdown();
        return;
      }
      dropdown = document.createElement("div");
      dropdown.className = "port-ai-inline-dropdown";
      dropdown.style.cssText = "position:absolute;bottom:100%;right:0;margin-bottom:6px;min-width:140px;padding:6px;background:#1a1a1a;border:1px solid #333;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.4);";
      others.forEach(function (p) {
        var opt = document.createElement("button");
        opt.textContent = "Port to " + p.name;
        opt.style.cssText = "display:block;width:100%;padding:8px 12px;font-size:12px;text-align:left;color:#e8e8e8;background:transparent;border:none;border-radius:4px;cursor:pointer;";
        opt.onmouseover = function () { opt.style.background = "#2a2a2a"; };
        opt.onmouseout = function () { opt.style.background = "transparent"; };
        opt.onclick = function (ev) {
          ev.stopPropagation();
          hideDropdown();
          portTo(p, doPull);
        };
        dropdown.appendChild(opt);
      });
      btn.appendChild(dropdown);
      document.addEventListener("click", hideDropdown);
    };

    var container = findInputContainer ? findInputContainer() : null;
    if (container) {
      container.appendChild(wrapper);
    } else {
      document.body.appendChild(wrapper);
    }
  }

  function portTo(destPlatform, doPull) {
    var result = doPull();
    if (!result || !result.success) {
      chrome.runtime.sendMessage({
        action: "portFromInline",
        fallback: true,
        destPlatformId: destPlatform.id,
        destUrl: destPlatform.url,
        source: (getCurrentPlatform && getCurrentPlatform(window.location.href) || {}).name || "chat"
      }).catch(function () {});
      return;
    }
    chrome.runtime.sendMessage({
      action: "portFromInline",
      fallback: false,
      summary: result.summary,
      rawMessages: result.rawMessages,
      count: result.count,
      destPlatformId: destPlatform.id,
      destUrl: destPlatform.url,
      source: (getCurrentPlatform && getCurrentPlatform(window.location.href) || {}).name || "chat"
    }).catch(function () {});
  }

  window.PortableAIInline = {
    create: createInlineButton
  };
})();
