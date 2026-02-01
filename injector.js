(function () {
  "use strict";

  function formatPersona(persona) {
    if (!persona.role) return "";
    return "User{" + persona.role + "; domains:" + (persona.domains || []).join("|") + "; prefs:" + (persona.preferences || []).join(",") + "}";
  }

  function formatProject(project) {
    if (!project) return "";
    return "ActiveProject{" + project.name + "; goal:" + project.objective + "; status:" + project.status + "; constraints:" + (project.constraints || []).join(",") + "}";
  }

  function formatPulledContext(pulledContext, includePulled) {
    if (!includePulled || !pulledContext || !pulledContext.summary) return "";
    var age = pulledContext.timestamp ? Math.floor((Date.now() - pulledContext.timestamp) / 60000) : 0;
    var src = pulledContext.source ? " from " + pulledContext.source : "";
    return "PulledConvo" + src + "(" + age + "m ago): " + pulledContext.summary;
  }

  function buildContextBlock(persona, project, pulledContext, includePulled) {
    var parts = [];
    var p = formatPersona(persona || {});
    var proj = formatProject(project);
    var pulled = formatPulledContext(pulledContext || {}, includePulled !== false);

    if (p) parts.push(p);
    if (proj) parts.push(proj);
    if (pulled) parts.push(pulled);

    if (parts.length === 0) return "";
    return "Context:\n" + parts.join("\n") + "\n\n";
  }

  function buildContinuePrompt(state) {
    var staticParts = [];
    var persona = (state.personas || []).find(function (p) { return p.id === state.activePersonaId; });
    if (!persona && state.persona && state.persona.role) persona = state.persona;
    var project = (state.projects || []).find(function (p) { return p.id === state.activeProjectId; });
    var p = formatPersona(persona || {});
    var proj = formatProject(project);
    if (p) staticParts.push(p);
    if (proj) staticParts.push(proj);
    var pulledContext = state.pulledContext;
    var isFallback = pulledContext && pulledContext.fallback;
    var contPrompt = isFallback
      ? "No conversation was extracted. Identity and project only (if configured)."
      : "--- Continuation --- This chat continues a conversation ported from another AI. Do not re-introduce or re-explain. Treat it as the same thread. Use only the summary below for context; do not invent prior content. Reply as if we're mid-conversation and ready for the next step.";
    staticParts.push(contPrompt);
    var staticBlock = staticParts.length > 0 ? "Context:\n" + staticParts.join("\n") + "\n\n" : "";
    var variablePart = "";
    if (pulledContext && pulledContext.summary) {
      var age = pulledContext.timestamp ? Math.floor((Date.now() - pulledContext.timestamp) / 60000) : 0;
      var src = pulledContext.source ? " from " + pulledContext.source : "";
      variablePart = "PulledConvo" + src + "(" + age + "m ago): " + pulledContext.summary;
    }
    if (!staticBlock && !variablePart) return "";
    return staticBlock + variablePart;
  }

  window.PortableAIInjector = {
    formatPersona: formatPersona,
    formatProject: formatProject,
    buildContextBlock: buildContextBlock,
    buildContinuePrompt: buildContinuePrompt
  };
})();
