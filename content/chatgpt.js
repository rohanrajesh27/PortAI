(function () {
  "use strict";

  var getState = window.PortableAIStorage.getState;
  var setState = window.PortableAIStorage.setState;
  var buildContextBlock = window.PortableAIInjector.buildContextBlock;
  var buildContinuePrompt = window.PortableAIInjector.buildContinuePrompt;

  var injected = false;

  function findInput() {
    var prosemirror = document.querySelector("#prompt-textarea.ProseMirror") ||
      document.querySelector("[data-composer-surface] .ProseMirror[contenteditable='true']");
    if (prosemirror) return prosemirror;
    var ta = document.querySelector("textarea[name='prompt-textarea']") ||
      document.querySelector("textarea");
    return ta;
  }

  function injectViaPaste(el, context) {
    el.focus();
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      var dt = new DataTransfer();
      dt.setData("text/plain", context);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
    } catch (e) {
      document.execCommand("insertText", false, context);
    }
  }

  async function injectIfNeeded(el, useContinuePrompt) {
    if (injected && !useContinuePrompt) return;

    var state = await getState();
    if (!useContinuePrompt) return;

    var persona = (state.personas || []).find(function (p) { return p.id === state.activePersonaId; });
    var project = (state.projects || []).find(function (p) { return p.id === state.activeProjectId; });
    var context = useContinuePrompt
      ? buildContinuePrompt(state)
      : buildContextBlock(persona || {}, project, state.pulledContext, true);

    if (!context) return;

    if (el.tagName === "TEXTAREA") {
      el.value = context + el.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      injectViaPaste(el, context);
    }
    injected = true;
  }

  var autoInjectDone = false;
  function tryAutoInject() {
    if (autoInjectDone) return;
    try {
      if (!window.PortableAIStorage?.isContextValid?.()) return;
    } catch (e) { return; }
    getState().then(function (state) {
      var pp = state.portPending;
      if (!pp || pp.to !== "chatgpt") return;
      var age = Date.now() - (pp.timestamp || 0);
      if (age > 60000) {
        setState({ portPending: null });
        return;
      }
      var el = findInput();
      if (!el) return;
      autoInjectDone = true;
      setState({ portPending: null });
      injected = false;
      injectIfNeeded(el, true).then(function () { setTimeout(triggerSend, 400); });
    }).catch(function () {});
  }

  function triggerSend() {
    var composer = document.querySelector("[data-composer-surface]");
    var scope = composer || document;
    var btn = scope.querySelector("button[data-testid='send-button']") ||
      scope.querySelector("button[data-testid='composer-send-button']") ||
      scope.querySelector("button[aria-label*='Send' i]") ||
      scope.querySelector("button[aria-label*='submit' i]") ||
      document.querySelector("button[data-testid='send-button']") ||
      document.querySelector("form button[type='submit']") ||
      document.querySelector("button[aria-label*='Send' i]");
    if (btn && !btn.disabled) {
      btn.click();
    }
  }

  setInterval(function () {
    if (findInput()) tryAutoInject();
  }, 500);

  function doPull() {
    var containers = document.querySelectorAll("div[data-message-author-role]");
    var messages = [];
    containers.forEach(function (el) {
      var role = el.dataset.messageAuthorRole || "unknown";
      var content = (el.textContent || "").trim();
      if (content) messages.push({ role: role, content: content });
    });
    var compressor = window.PortableAICompressor;
    var summary = compressor ? compressor.compressIntelligent(messages) : "";
    return { success: messages.length > 0, summary: summary, count: messages.length, rawMessages: messages };
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action !== "pull") return;
    sendResponse(doPull());
  });

  function initInline() {
    if (findInput() && window.PortableAIInline && !document.querySelector(".port-ai-inline-btn")) {
      window.PortableAIInline.create("chatgpt", doPull, function () { return document.body; });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInline);
  } else {
    setTimeout(initInline, 2000);
  }
})();
