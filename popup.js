(function () {
  "use strict";

  var getState = window.PortableAIStorage.getState;
  var setState = window.PortableAIStorage.setState;
  var DEFAULT_STATE = window.PortableAIStorage.DEFAULT_STATE;
  var parseList = window.PortableAIUtils.parseList;
  var platforms = window.PortableAIPlatforms;
  var SUPPORTED = ["chat.openai.com", "chatgpt.com", "claude.ai", "grok.com", "x.ai"];

  var statusEl = document.getElementById("status");
  var portButtonsEl = document.getElementById("port-buttons");
  var personaListEl = document.getElementById("persona-list");
  var personaFormEl = document.getElementById("persona-form");
  var personaAddBtn = document.getElementById("persona-add");
  var projectListEl = document.getElementById("project-list");
  var projectFormEl = document.getElementById("project-form");
  var projectAddBtn = document.getElementById("project-add");

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderPersonas(personas, activeId) {
    personaListEl.innerHTML = "";
    (personas || []).forEach(function (p) {
      var div = document.createElement("div");
      div.className = "item" + (p.id === activeId ? " active" : "");
      div.innerHTML = "<span class=\"item-name\">" + esc(p.name || p.role || "Unnamed") + "</span>" +
        "<button class=\"btn-set\" data-id=\"" + esc(p.id) + "\">Use</button>" +
        "<button class=\"btn-remove\" data-id=\"" + esc(p.id) + "\" title=\"Remove\">×</button>";
      personaListEl.appendChild(div);
    });
  }

  function renderProjects(projects, activeId) {
    projectListEl.innerHTML = "";
    (projects || []).forEach(function (p) {
      var div = document.createElement("div");
      div.className = "item" + (p.id === activeId ? " active" : "");
      div.innerHTML = "<span class=\"item-name\">" + esc(p.name || "Unnamed") + "</span>" +
        "<button class=\"btn-set\" data-id=\"" + esc(p.id) + "\">Use</button>" +
        "<button class=\"btn-remove\" data-id=\"" + esc(p.id) + "\" title=\"Remove\">×</button>";
      projectListEl.appendChild(div);
    });
  }

  function bindPersonaActions() {
    personaListEl.querySelectorAll(".btn-set").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        setState({ activePersonaId: id }).then(load);
      };
    });
    personaListEl.querySelectorAll(".btn-remove").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        getState().then(function (state) {
          var personas = (state.personas || []).filter(function (p) { return p.id !== id; });
          var update = { personas: personas };
          if (state.activePersonaId === id) update.activePersonaId = null;
          setState(update).then(load);
        });
      };
    });
  }

  function bindProjectActions() {
    projectListEl.querySelectorAll(".btn-set").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        setState({ activeProjectId: id }).then(load);
      };
    });
    projectListEl.querySelectorAll(".btn-remove").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        getState().then(function (state) {
          var projects = (state.projects || []).filter(function (p) { return p.id !== id; });
          var update = { projects: projects };
          if (state.activeProjectId === id) update.activeProjectId = null;
          setState(update).then(load);
        });
      };
    });
  }

  function showPersonaForm() {
    personaFormEl.style.display = "block";
    document.getElementById("persona-name").value = "";
    document.getElementById("persona-role").value = "";
    document.getElementById("persona-domains").value = "";
    document.getElementById("persona-prefs").value = "";
  }

  function hidePersonaForm() {
    personaFormEl.style.display = "none";
  }

  function savePersona() {
    var name = document.getElementById("persona-name").value.trim();
    var role = document.getElementById("persona-role").value.trim();
    if (!name && !role) return;
    getState().then(function (state) {
      var personas = (state.personas || []).slice();
      var p = {
        id: "pers_" + Date.now(),
        name: name || role,
        role: role || name,
        domains: parseList(document.getElementById("persona-domains").value),
        preferences: parseList(document.getElementById("persona-prefs").value)
      };
      personas.push(p);
      setState({ personas: personas, activePersonaId: p.id }).then(function () {
        hidePersonaForm();
        load();
      });
    });
  }

  function showProjectForm() {
    projectFormEl.style.display = "block";
    document.getElementById("project-name").value = "";
    document.getElementById("project-objective").value = "";
    document.getElementById("project-status").value = "";
    document.getElementById("project-constraints").value = "";
  }

  function hideProjectForm() {
    projectFormEl.style.display = "none";
  }

  function saveProject() {
    var name = document.getElementById("project-name").value.trim();
    if (!name) return;
    getState().then(function (state) {
      var projects = (state.projects || []).slice();
      var p = {
        id: "proj_" + Date.now(),
        name: name,
        objective: document.getElementById("project-objective").value.trim(),
        status: document.getElementById("project-status").value.trim(),
        constraints: parseList(document.getElementById("project-constraints").value)
      };
      projects.push(p);
      setState({ projects: projects, activeProjectId: p.id }).then(function () {
        hideProjectForm();
        load();
      });
    });
  }

  function getCurrentTab(cb) {
    chrome.tabs.query({ active: true }, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url && SUPPORTED.some(function (s) { return tabs[i].url.indexOf(s) >= 0; })) {
          return cb(tabs[i]);
        }
      }
      cb(null);
    });
  }

  function portTo(destPlatform) {
    getCurrentTab(function (tab) {
      if (!tab || !tab.id) {
        statusEl.textContent = "Open ChatGPT, Claude, or Grok first.";
        return;
      }
      var current = platforms.getCurrentPlatform(tab.url);
      if (current && current.id === destPlatform.id) {
        statusEl.textContent = "Already on " + destPlatform.name + ".";
        return;
      }
      statusEl.textContent = "Pulling...";
      portButtonsEl.querySelectorAll("button").forEach(function (b) { b.disabled = true; });

      chrome.tabs.sendMessage(tab.id, { action: "pull" }, function (res) {
        if (chrome.runtime.lastError) {
          var files = tab.url.indexOf("claude.ai") >= 0
            ? ["storage.js", "injector.js", "compressor.js", "content/claude.js"]
            : (tab.url.indexOf("chat.openai.com") >= 0 || tab.url.indexOf("chatgpt.com") >= 0)
              ? ["storage.js", "injector.js", "compressor.js", "content/chatgpt.js"]
              : ["storage.js", "injector.js", "compressor.js", "content/universal.js"];
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: files }, function () {
            if (chrome.runtime.lastError) {
              statusEl.textContent = "Refresh the page and try again.";
              portButtonsEl.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
              return;
            }
            setTimeout(function () { doPull(tab, destPlatform, current); }, 100);
          });
          return;
        }
        doPull(tab, destPlatform, current, res);
      });
    });
  }

  function doPull(tab, destPlatform, current, res) {
    if (!res) {
      chrome.tabs.sendMessage(tab.id, { action: "pull" }, function (r) {
        finishPull(tab, destPlatform, current, r);
      });
    } else {
      finishPull(tab, destPlatform, current, res);
    }
  }

  function formatForSummarizer(msgs) {
    if (!msgs || msgs.length === 0) return "";
    return msgs.map(function (m) {
      var label = (m.role || "user").toLowerCase().indexOf("user") >= 0 ? "User" : "Assistant";
      return label + ": " + (m.content || "").trim();
    }).join("\n\n");
  }

  function summarizeWithOllama(url, model, text, cb) {
    var base = url.replace(/\/$/, "");
    fetch(base + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "llama3.2",
        prompt: "Summarize this conversation comprehensively. Preserve key decisions, open questions, numbers, and context needed to continue. Output in English. Be thorough.\n\n" + text,
        stream: false
      })
    }).then(function (r) {
      if (!r.ok) return cb(null);
      return r.json().then(function (j) { cb((j.response || "").trim() || null); });
    }).catch(function () { cb(null); });
  }

  function finishPull(tab, destPlatform, current, res) {
    portButtonsEl.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
    var source = current ? current.name : "chat";
    var fallbackMode = !res || !res.success || !(res.summary || "").trim();

    if (fallbackMode) {
      statusEl.textContent = "Conversation not detected. Injected identity + project only.";
      setState({
        pulledContext: { summary: null, timestamp: Date.now(), source: source, count: 0, fallback: true },
        portPending: { to: destPlatform.id, timestamp: Date.now(), fallback: true }
      }).then(function () {
        chrome.tabs.create({ url: destPlatform.url });
        setTimeout(function () { window.close(); }, 1500);
      });
      return;
    }

    var fallback = res.summary || "";
    var raw = res.rawMessages || [];
    var convoText = formatForSummarizer(raw);

    function storeAndGo(summary) {
      var finalSummary = (summary && summary.length > 50) ? summary : fallback;
      setState({
        pulledContext: {
          summary: finalSummary,
          timestamp: Date.now(),
          source: source,
          count: res.count || 0,
          fallback: false
        },
        portPending: { to: destPlatform.id, timestamp: Date.now(), fallback: false }
      }).then(function () {
        chrome.tabs.create({ url: destPlatform.url });
        statusEl.textContent = "Porting to " + destPlatform.name + "...";
        window.close();
      });
    }

    getState().then(function (state) {
      var api = state.apiConfig || {};
      var ollamaUrl = (api.ollamaUrl || "").trim();

      var allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(ollamaUrl);
      if (allowed && ollamaUrl && convoText) {
        statusEl.textContent = "Summarizing with Ollama...";
        summarizeWithOllama(ollamaUrl, "llama3.2", convoText, function (summary) {
          storeAndGo(summary || fallback);
        });
      } else {
        storeAndGo(fallback);
      }
    });
  }

  function updatePortButtons() {
    getCurrentTab(function (tab) {
      if (!tab) {
        statusEl.textContent = "Open ChatGPT, Claude, or Grok.";
        portButtonsEl.innerHTML = "";
        return;
      }
      var current = platforms.getCurrentPlatform(tab.url);
      statusEl.textContent = "From " + (current ? current.name : "?") + ". Port to:";
      portButtonsEl.innerHTML = "";
      platforms.PLATFORMS.forEach(function (p) {
        if (current && p.id === current.id) return;
        var btn = document.createElement("button");
        btn.className = "btn-port";
        btn.textContent = p.name;
        btn.onclick = function () { portTo(p); };
        portButtonsEl.appendChild(btn);
      });
    });
  }

  function load() {
    getState().then(function (state) {
      var s = state || {};
      var personas = s.personas || [];
      var projects = s.projects || [];
      if (personas.length === 0 && s.persona && typeof s.persona === "object" && s.persona.role) {
        personas = [{ id: "pers_0", name: s.persona.role, role: s.persona.role, domains: s.persona.domains || [], preferences: s.persona.preferences || [] }];
        setState({ personas: personas, activePersonaId: "pers_0" });
      }
      renderPersonas(personas, s.activePersonaId);
      renderProjects(projects, s.activeProjectId);
      bindPersonaActions();
      bindProjectActions();
      var api = s.apiConfig || {};
      var ollamaUrl = document.getElementById("api-ollama-url");
      if (ollamaUrl) ollamaUrl.value = api.ollamaUrl || "";
      updatePortButtons();
    });
  }

  personaAddBtn.onclick = showPersonaForm;
  document.getElementById("persona-save").onclick = savePersona;
  document.getElementById("persona-cancel").onclick = hidePersonaForm;

  projectAddBtn.onclick = showProjectForm;
  document.getElementById("project-save").onclick = saveProject;
  document.getElementById("project-cancel").onclick = hideProjectForm;

  document.getElementById("api-toggle").onclick = function () {
    var fields = document.getElementById("api-fields");
    var hidden = fields.style.display === "none";
    fields.style.display = hidden ? "block" : "none";
    this.textContent = hidden ? "▲" : "▼";
  };

  function saveApiConfig() {
    var api = {
      ollamaUrl: (document.getElementById("api-ollama-url") || {}).value.trim() || ""
    };
    setState({ apiConfig: api });
  }

  ["api-ollama-url"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", saveApiConfig);
      el.addEventListener("blur", saveApiConfig);
    }
  });

  load();
})();
