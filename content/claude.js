(function () {
  "use strict";

  var getState = window.PortableAIStorage.getState;
  var setState = window.PortableAIStorage.setState;
  var buildContextBlock = window.PortableAIInjector.buildContextBlock;
  var buildContinuePrompt = window.PortableAIInjector.buildContinuePrompt;

  var injected = false;

  function findInput() {
    return document.querySelector("[data-testid='chat-input']") ||
      document.querySelector(".tiptap.ProseMirror[contenteditable='true']") ||
      document.querySelector("textarea");
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

  async function inject(el, useContinuePrompt) {
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

  function triggerSend() {
    var btn = document.querySelector("button[aria-label='Send message']") ||
      document.querySelector("button[data-testid='send-button']") ||
      document.querySelector("button[aria-label*='Send' i]");
    if (btn && !btn.disabled) btn.click();
  }

  function isInputFocused(el) {
    if (!el) return false;
    var active = document.activeElement;
    return active === el || el.contains(active);
  }

  var autoInjectDone = false;
  function tryAutoInject() {
    if (autoInjectDone) return;
    try {
      if (!window.PortableAIStorage?.isContextValid?.()) return;
    } catch (e) { return; }
    getState().then(function (state) {
      var pp = state.portPending;
      if (!pp || pp.to !== "claude") return;
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
      inject(el, true).then(function () {
        setTimeout(triggerSend, 400);
      });
    }).catch(function () {});
  }

  setInterval(function () {
    var el = findInput();
    if (el) tryAutoInject();
  }, 500);

  function doPull() {
    var userEls = document.querySelectorAll("div[data-testid='user-message']");
    var claudeEls = document.querySelectorAll("div.font-claude-message");
    var all = [];
    userEls.forEach(function (el) {
      var paras = el.querySelectorAll("p.whitespace-pre-wrap.break-words");
      var content = Array.from(paras).map(function (p) { return (p.textContent || "").trim(); }).join("\n\n").trim();
      if (content) all.push({ role: "user", content: content, el: el });
    });
    claudeEls.forEach(function (el) {
      var content = (el.textContent || "").trim();
      if (content) all.push({ role: "assistant", content: content, el: el });
    });
    all.sort(function (a, b) {
      return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    var msgs = all.map(function (m) { return { role: m.role, content: m.content }; });
    var compressor = window.PortableAICompressor;
    var summary = compressor ? compressor.compressIntelligent(msgs) : "";
    return { success: msgs.length > 0, summary: summary, count: msgs.length, rawMessages: msgs };
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action !== "pull") return;
    sendResponse(doPull());
  });

  function initInline() {
    if (findInput() && window.PortableAIInline && !document.querySelector(".port-ai-inline-btn")) {
      window.PortableAIInline.create("claude", doPull, function () { return document.body; });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInline);
  } else {
    setTimeout(initInline, 2000);
  }
})();
