const endpointTabsEl = document.getElementById("endpointTabs");
const configForm = document.getElementById("configForm");
const logsEl = document.getElementById("logs");
const logCountEl = document.getElementById("logCount");
const resetBtn = document.getElementById("resetBtn");
const clearLogsBtn = document.getElementById("clearLogsBtn");
const finalWebhookUrlEl = document.getElementById("finalWebhookUrl");
const saveStatusEl = document.getElementById("saveStatus");
const logSearchEl = document.getElementById("logSearch");
const saveBtn = document.getElementById("saveBtn");
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profilesListEl = document.getElementById("profilesList");
const tunnelToggleBtn = document.getElementById("tunnelToggleBtn");
const tunnelUrlEl = document.getElementById("tunnelUrl");
const tunnelCopyTooltipEl = document.getElementById("tunnelCopyTooltip");

const authGroups = {
  apiKeyHeaderGroup: document.getElementById("apiKeyHeaderGroup"),
  apiKeyValueGroup: document.getElementById("apiKeyValueGroup"),
  bearerGroup: document.getElementById("bearerGroup")
};

const fields = {
  authType: document.getElementById("authType"),
  apiKeyHeaderName: document.getElementById("apiKeyHeaderName"),
  apiKeyValue: document.getElementById("apiKeyValue"),
  bearerToken: document.getElementById("bearerToken"),
  defaultStatusCode: document.getElementById("defaultStatusCode"),
  statusCodes: document.getElementById("statusCodes"),
  responseDelayMs: document.getElementById("responseDelayMs"),
  responseHeaders: document.getElementById("responseHeaders"),
  responseBody: document.getElementById("responseBody")
};

let appState = null;
let selectedEndpoint = "incoming-call";
let tunnelState = { active: false, url: null };
let tunnelBusy = false;
let tooltipTimer = null;

const dirtyEndpoints = new Set();
const expandedLogIds = new Set();
const replayingLogIds = new Set();
const seenLogIds = new Set();

function setSaveStatus(message, type = "info") {
  saveStatusEl.textContent = message;
  saveStatusEl.dataset.type = type;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function prettyJson(input) {
  try {
    return JSON.stringify(input, null, 2);
  } catch (_error) {
    return String(input);
  }
}

function statusClass(statusCode) {
  if (statusCode >= 500) return "status-5xx";
  if (statusCode >= 400) return "status-4xx";
  if (statusCode >= 200 && statusCode < 300) return "status-2xx";
  return "status-other";
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString();
}

function normalizeStatusCodes(rawValue) {
  return rawValue
    .split(",")
    .map((token) => parseInt(token.trim(), 10))
    .filter((value) => !Number.isNaN(value));
}

function buildFinalWebhookUrl() {
  const base = tunnelState.url || window.location.origin;
  return `${base.replace(/\/+$/, "")}/webhook/${selectedEndpoint}`;
}

function renderFinalWebhookUrl() {
  finalWebhookUrlEl.textContent = buildFinalWebhookUrl();
}

function updateSaveButtonState() {
  const dirty = dirtyEndpoints.has(selectedEndpoint);
  saveBtn.classList.toggle("is-dirty", dirty);
}

function syncAuthFieldStates() {
  const authType = fields.authType.value;
  const isApiKey = authType === "API_KEY";
  const isBearer = authType === "BEARER";

  authGroups.apiKeyHeaderGroup.classList.toggle("is-hidden", !isApiKey);
  authGroups.apiKeyValueGroup.classList.toggle("is-hidden", !isApiKey);
  authGroups.bearerGroup.classList.toggle("is-hidden", !isBearer);

  fields.apiKeyHeaderName.disabled = !isApiKey;
  fields.apiKeyValue.disabled = !isApiKey;
  fields.bearerToken.disabled = !isBearer;
}

function renderEndpointTabs() {
  if (!appState) return;

  endpointTabsEl.innerHTML = (appState.endpointKeys || [])
    .map((endpointKey) => {
      const active = endpointKey === selectedEndpoint;
      const dirtyDot = dirtyEndpoints.has(endpointKey) ? '<span class="dirty-dot"></span>' : "";
      return `
        <button
          type="button"
          class="endpoint-tab"
          data-endpoint="${escapeHtml(endpointKey)}"
          role="tab"
          aria-selected="${active ? "true" : "false"}"
        >
          ${escapeHtml(endpointKey)}
          ${dirtyDot}
        </button>`;
    })
    .join("");
}

function renderConfig(force = false) {
  if (!appState) return;

  if (!force && dirtyEndpoints.has(selectedEndpoint)) {
    syncAuthFieldStates();
    updateSaveButtonState();
    return;
  }

  const cfg = appState.configs[selectedEndpoint];
  if (!cfg) return;

  fields.authType.value = cfg.authType;
  fields.apiKeyHeaderName.value = cfg.apiKeyHeaderName || "";
  fields.apiKeyValue.value = cfg.apiKeyValue || "";
  fields.bearerToken.value = cfg.bearerToken || "";
  fields.defaultStatusCode.value = String(cfg.defaultStatusCode);
  fields.statusCodes.value = (cfg.statusCodes || []).join(", ");
  fields.responseDelayMs.value = String(cfg.responseDelayMs);
  fields.responseHeaders.value = prettyJson(cfg.responseHeaders || {});
  fields.responseBody.value = cfg.responseBody || "";

  dirtyEndpoints.delete(selectedEndpoint);
  syncAuthFieldStates();
  updateSaveButtonState();
  renderEndpointTabs();
}

function renderTunnel() {
  tunnelToggleBtn.textContent = tunnelState.active ? "Stop Tunnel" : "Start Tunnel";
  tunnelToggleBtn.disabled = tunnelBusy;

  const label = tunnelState.url || "Tunnel inactive";
  tunnelUrlEl.textContent = label;
  tunnelUrlEl.disabled = !tunnelState.url;
  tunnelUrlEl.title = tunnelState.url ? "Click to copy tunnel URL" : "Tunnel inactive";

  renderFinalWebhookUrl();
}

function renderLogs() {
  if (!appState) return;

  const logs = appState.logs || [];
  const searchTerm = (logSearchEl.value || "").trim().toLowerCase();

  const filtered = logs.filter((log) => {
    if (!searchTerm) return true;

    const bodyText = prettyJson(log.body).toLowerCase();
    const headerText = prettyJson(log.headers).toLowerCase();
    return (
      (log.endpoint || "").toLowerCase().includes(searchTerm) ||
      (log.method || "").toLowerCase().includes(searchTerm) ||
      (log.path || "").toLowerCase().includes(searchTerm) ||
      (log.note || "").toLowerCase().includes(searchTerm) ||
      bodyText.includes(searchTerm) ||
      headerText.includes(searchTerm)
    );
  });

  logCountEl.textContent = String(filtered.length);

  if (filtered.length === 0) {
    logsEl.innerHTML = `
      <div class="empty-state">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>${searchTerm ? "No matching requests." : "Waiting for webhooks..."}</span>
      </div>`;
    return;
  }

  logsEl.innerHTML = filtered
    .map((log) => {
      const cssStatus = statusClass(Number(log.returnedStatusCode));
      const expanded = expandedLogIds.has(log.id);
      const replaying = replayingLogIds.has(log.id);
      const isNew = !seenLogIds.has(log.id);
      const replayedBadge = log.replayed ? '<span class="replayed-badge">↺ replayed</span>' : "";

      return `
        <article class="log-card ${cssStatus} ${isNew ? "new-entry" : ""}" data-log-id="${log.id}">
          <button type="button" class="btn btn-glass replay-btn" data-action="replay" data-log-id="${log.id}" ${replaying ? "disabled" : ""}>${replaying ? "Replaying" : "Replay"}</button>
          <div class="log-top">
            <div class="log-main">
              <span class="method-badge">${escapeHtml(log.method)}</span>
              <span class="path-chip">${escapeHtml(log.path)}</span>
              <span class="status-badge ${cssStatus}">${escapeHtml(log.returnedStatusCode)}</span>
            </div>
            <span class="log-time">${escapeHtml(formatTimestamp(log.timestamp))}</span>
          </div>

          <div class="log-meta-row">
            <span class="meta-chip">${escapeHtml(log.endpoint)}</span>
            <span class="meta-chip">auth ${log.authValid ? "ok" : "fail"}</span>
            <span class="meta-chip">${escapeHtml(log.note)}</span>
            ${replayedBadge}
          </div>

          <div class="log-details" ${expanded ? "" : "hidden"}>
            <div class="log-block">
              <h3>Auth Result</h3>
              <pre>${log.authValid ? "ok" : "fail"}</pre>
            </div>
            <div class="log-block">
              <h3>Headers</h3>
              <pre>${escapeHtml(prettyJson(log.headers))}</pre>
            </div>
            <div class="log-block">
              <h3>Body</h3>
              <pre>${escapeHtml(prettyJson(log.body))}</pre>
            </div>
          </div>
        </article>`;
    })
    .join("");

  logs.forEach((log) => seenLogIds.add(log.id));
}

function renderProfiles() {
  if (!appState) return;

  const profiles = appState.profiles || [];
  if (profiles.length === 0) {
    profilesListEl.innerHTML = '<p class="profiles-empty">No saved profiles yet.</p>';
    return;
  }

  profilesListEl.innerHTML = profiles
    .map((profile) => {
      return `
        <article class="profile-item" data-profile-id="${escapeHtml(profile.id)}">
          <div class="profile-main">
            <p class="profile-name">${escapeHtml(profile.name)}</p>
            <p class="profile-time">${escapeHtml(formatTimestamp(profile.savedAt))}</p>
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-glass profile-btn" data-action="load" data-profile-id="${escapeHtml(profile.id)}">Load</button>
            <button type="button" class="btn btn-glass profile-btn delete" data-action="delete" data-profile-id="${escapeHtml(profile.id)}">Delete</button>
          </div>
        </article>`;
    })
    .join("");
}

function render() {
  if (!appState) return;
  renderEndpointTabs();
  renderConfig();
  renderProfiles();
  renderTunnel();
  renderLogs();
}

function markCurrentEndpointDirty() {
  dirtyEndpoints.add(selectedEndpoint);
  updateSaveButtonState();
  renderEndpointTabs();
}

async function fetchState() {
  const response = await fetch("/api/state");
  if (!response.ok) {
    throw new Error(`Failed to fetch state (${response.status})`);
  }

  appState = await response.json();
  if (!appState.endpointKeys.includes(selectedEndpoint)) {
    selectedEndpoint = appState.endpointKeys[0] || "incoming-call";
  }
  render();
}

async function fetchTunnelStatus() {
  const response = await fetch("/api/tunnel/status");
  if (!response.ok) {
    throw new Error(`Failed to fetch tunnel status (${response.status})`);
  }

  tunnelState = await response.json();
  renderTunnel();
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "true");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}

function showCopyTooltip(text) {
  tunnelCopyTooltipEl.textContent = text;
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
  }

  tooltipTimer = setTimeout(() => {
    tunnelCopyTooltipEl.textContent = "";
  }, 1200);
}

endpointTabsEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const tab = target.closest(".endpoint-tab");
  if (!(tab instanceof HTMLButtonElement)) {
    return;
  }

  const endpoint = tab.dataset.endpoint;
  if (!endpoint || endpoint === selectedEndpoint) {
    return;
  }

  selectedEndpoint = endpoint;
  renderConfig(true);
  renderFinalWebhookUrl();
  setSaveStatus("", "info");
  renderEndpointTabs();
});

configForm.addEventListener("input", () => {
  markCurrentEndpointDirty();
});

fields.authType.addEventListener("change", () => {
  syncAuthFieldStates();
  markCurrentEndpointDirty();
});

configForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  let parsedHeaders = {};
  try {
    parsedHeaders = JSON.parse(fields.responseHeaders.value || "{}");
  } catch (_error) {
    setSaveStatus("Response headers must be valid JSON.", "error");
    return;
  }

  const payload = {
    authType: fields.authType.value,
    apiKeyHeaderName: fields.apiKeyHeaderName.value,
    apiKeyValue: fields.apiKeyValue.value,
    bearerToken: fields.bearerToken.value,
    defaultStatusCode: Number(fields.defaultStatusCode.value),
    statusCodes: normalizeStatusCodes(fields.statusCodes.value),
    responseDelayMs: Number(fields.responseDelayMs.value),
    responseHeaders: parsedHeaders,
    responseBody: fields.responseBody.value
  };

  setSaveStatus(`Saving ${selectedEndpoint}...`, "info");

  try {
    const response = await fetch(`/api/config/${selectedEndpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Save failed (${response.status})`);
    }

    dirtyEndpoints.delete(selectedEndpoint);
    await fetchState();
    setSaveStatus(`Saved ${selectedEndpoint}.`, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    setSaveStatus(message, "error");
  }
});

resetBtn.addEventListener("click", async () => {
  if (!confirm("Reset all endpoint configs to defaults?")) {
    return;
  }

  await fetch("/api/config/reset", { method: "POST" });
  dirtyEndpoints.clear();
  await fetchState();
  setSaveStatus("All configs reset.", "success");
});

saveProfileBtn.addEventListener("click", async () => {
  const name = profileNameInput.value.trim();
  if (!name) {
    setSaveStatus("Profile name is required.", "error");
    return;
  }

  setSaveStatus(`Saving profile "${name}"...`, "info");
  try {
    const response = await fetch("/api/profiles/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      throw new Error(`Profile save failed (${response.status})`);
    }

    profileNameInput.value = "";
    await fetchState();
    setSaveStatus(`Saved profile "${name}".`, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile save failed";
    setSaveStatus(message, "error");
  }
});

profilesListEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button[data-action]");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const profileId = button.dataset.profileId;
  const action = button.dataset.action;
  if (!profileId || !action) {
    return;
  }

  if (action === "delete") {
    if (!confirm("Delete this profile?")) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Profile delete failed (${response.status})`);
      }

      await fetchState();
      setSaveStatus("Profile deleted.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile delete failed";
      setSaveStatus(message, "error");
    }
    return;
  }

  if (action === "load") {
    try {
      const response = await fetch(`/api/profiles/${profileId}/load`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Profile load failed (${response.status})`);
      }

      dirtyEndpoints.clear();
      await fetchState();
      renderConfig(true);
      setSaveStatus("Profile loaded.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile load failed";
      setSaveStatus(message, "error");
    }
  }
});

clearLogsBtn.addEventListener("click", async () => {
  await fetch("/api/logs/clear", { method: "POST" });
  expandedLogIds.clear();
  seenLogIds.clear();
  await fetchState();
});

logSearchEl.addEventListener("input", () => {
  renderLogs();
});

logsEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const replayButton = target.closest("button[data-action='replay']");
  if (replayButton instanceof HTMLButtonElement) {
    event.stopPropagation();
    const id = Number(replayButton.dataset.logId);
    if (!Number.isInteger(id) || replayingLogIds.has(id)) {
      return;
    }

    replayingLogIds.add(id);
    renderLogs();

    try {
      const response = await fetch(`/api/logs/${id}/replay`, { method: "POST" });
      if (!response.ok) {
        throw new Error(`Replay failed (${response.status})`);
      }
      await fetchState();
    } catch (_error) {
      setSaveStatus("Replay failed.", "error");
    } finally {
      replayingLogIds.delete(id);
      renderLogs();
    }
    return;
  }

  const card = target.closest(".log-card");
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const id = Number(card.dataset.logId);
  if (!Number.isInteger(id)) {
    return;
  }

  if (expandedLogIds.has(id)) {
    expandedLogIds.delete(id);
  } else {
    expandedLogIds.add(id);
  }
  renderLogs();
});

tunnelToggleBtn.addEventListener("click", async () => {
  if (tunnelBusy) {
    return;
  }

  tunnelBusy = true;
  renderTunnel();

  try {
    const endpoint = tunnelState.active ? "/api/tunnel/stop" : "/api/tunnel/start";
    const response = await fetch(endpoint, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Tunnel request failed (${response.status})`);
    }

    tunnelState = await response.json();
    renderTunnel();
  } catch (_error) {
    setSaveStatus("Tunnel action failed.", "error");
  } finally {
    tunnelBusy = false;
    try {
      await fetchTunnelStatus();
    } catch (_error) {
      tunnelState = { active: false, url: null };
      renderTunnel();
    }
  }
});

tunnelUrlEl.addEventListener("click", async () => {
  if (!tunnelState.url) {
    return;
  }

  try {
    await copyText(tunnelState.url);
    showCopyTooltip("copied");
  } catch (_error) {
    showCopyTooltip("copy failed");
  }
});

async function bootstrap() {
  try {
    await Promise.all([fetchState(), fetchTunnelStatus()]);
    setSaveStatus("", "info");
  } catch (_error) {
    setSaveStatus("Failed to load app state.", "error");
  }
}

bootstrap();
setInterval(async () => {
  try {
    await Promise.all([fetchState(), fetchTunnelStatus()]);
  } catch (_error) {
    // Keep polling; transient network/tunnel issues should self-heal.
  }
}, 2000);
