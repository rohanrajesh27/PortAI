(function () {
  "use strict";

  var getState = window.PortableAIStorage.getState;
  var setState = window.PortableAIStorage.setState;
  var buildContextBlock = window.PortableAIInjector.buildContextBlock;
  var buildContinuePrompt = window.PortableAIInjector.buildContinuePrompt;

  var injected = false;

  function getPlatformId() {
    var u = window.location.href || "";
    if (u.indexOf("grok.com") >= 0 || u.indexOf("x.ai") >= 0) return "grok";
    if (u.indexOf("gemini.google.com") >= 0) return "gemini";
    if (u.indexOf("perplexity.ai") >= 0) return "perplexity";
    if (u.indexOf("copilot.microsoft.com") >= 0) return "copilot";
    return null;
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
      var pasteEv = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true });
      el.dispatchEvent(pasteEv);
    } catch (err) {
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
    var myId = getPlatformId();
    if (!myId) return;
    try {
      if (!window.PortableAIStorage?.isContextValid?.()) return;
    } catch (e) { return; }
    getState().then(function (state) {
      var pp = state.portPending;
      if (!pp || pp.to !== myId) return;
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
    var btn = document.querySelector("button[aria-label='Send message']") ||
      document.querySelector("button[data-testid='send-button']") ||
      document.querySelector("form button[type='submit']") ||
      document.querySelector("button[aria-label*='Send' i]") ||
      document.querySelector("[aria-label*='Send' i]");
    if (btn && !btn.disabled) btn.click();
  }

  function findInput() {
    return document.querySelector("[data-testid='chat-input']") ||
      document.querySelector("#prompt-textarea") ||
      document.querySelector(".tiptap.ProseMirror") ||
      document.querySelector("textarea") ||
      document.querySelector("[contenteditable='true']");
  }

  setInterval(function () {
    if (findInput()) tryAutoInject();
  }, 500);

  function doPull() {
    var els = document.querySelectorAll("[data-message-author-role], [data-testid='user-message'], [data-testid*='message']");
    var messages = [];
    els.forEach(function (el) {
      var role = el.dataset.messageAuthorRole || (el.dataset.testid && el.dataset.testid.indexOf("user") >= 0 ? "user" : "assistant");
      var content = (el.textContent || "").trim();
      if (content && content.length > 2) messages.push({ role: role, content: content });
    });
    var compressor = window.PortableAICompressor;
    var summary = compressor && messages.length > 0 ? compressor.compressIntelligent(messages) : "";
    return { success: messages.length > 0, summary: summary, count: messages.length, rawMessages: messages };
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action !== "pull") return;
    sendResponse(doPull());
  });

  function initInline() {
    var pid = getPlatformId();
    if (pid && findInput() && window.PortableAIInline && !document.querySelector(".port-ai-inline-btn")) {
      window.PortableAIInline.create(pid, doPull, function () { return document.body; });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInline);
  } else {
    setTimeout(initInline, 2000);
  }
})();
