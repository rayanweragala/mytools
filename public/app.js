const endpointSelect = document.getElementById("endpointSelect");
const configForm = document.getElementById("configForm");
const logsEl = document.getElementById("logs");
const logCountEl = document.getElementById("logCount");
const resetBtn = document.getElementById("resetBtn");
const clearLogsBtn = document.getElementById("clearLogsBtn");
const ngrokBaseUrlEl = document.getElementById("ngrokBaseUrl");
const finalWebhookUrlEl = document.getElementById("finalWebhookUrl");
const saveStatusEl = document.getElementById("saveStatus");
const logSearchEl = document.getElementById("logSearch");

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
const dirtyEndpoints = new Set();

function setSaveStatus(message, type = "info") {
  saveStatusEl.textContent = message;
  saveStatusEl.dataset.type = type;
}

function buildFinalWebhookUrl() {
  const base = (ngrokBaseUrlEl.value || "").trim().replace(/\/+$/, "");
  const suffix = `/webhook/${selectedEndpoint}`;
  return base ? `${base}${suffix}` : suffix;
}

function renderFinalWebhookUrl() {
  finalWebhookUrlEl.textContent = buildFinalWebhookUrl();
}

function syncAuthFieldStates() {
  const authType = fields.authType.value;
  const isNone = authType === "NONE";
  const isApiKey = authType === "API_KEY";
  const isBearer = authType === "BEARER";

  fields.apiKeyHeaderName.disabled = isNone || !isApiKey;
  fields.apiKeyValue.disabled = isNone || !isApiKey;
  fields.bearerToken.disabled = isNone || !isBearer;
}

function prettyJson(input) {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

async function fetchState() {
  const res = await fetch("/api/state");
  appState = await res.json();
  render();
}

function renderEndpointOptions() {
  const keys = appState.endpointKeys || [];
  const currentOptions = Array.from(endpointSelect.options).map(o => o.value);
  
  if (JSON.stringify(keys) !== JSON.stringify(currentOptions)) {
    endpointSelect.innerHTML = keys
      .map((key) => `<option value="${key}">${key}</option>`)
      .join("");
    endpointSelect.value = selectedEndpoint;
  }
}

function renderConfig(force = false) {
  if (!force && dirtyEndpoints.has(selectedEndpoint)) {
    syncAuthFieldStates();
    return;
  }

  const cfg = appState.configs[selectedEndpoint];
  if (!cfg) return;

  fields.authType.value = cfg.authType;
  fields.apiKeyHeaderName.value = cfg.apiKeyHeaderName || "";
  fields.apiKeyValue.value = cfg.apiKeyValue || "";
  fields.bearerToken.value = cfg.bearerToken || "";
  fields.defaultStatusCode.value = cfg.defaultStatusCode;
  fields.statusCodes.value = (cfg.statusCodes || []).join(", ");
  fields.responseDelayMs.value = cfg.responseDelayMs;
  fields.responseHeaders.value = prettyJson(cfg.responseHeaders || {});
  fields.responseBody.value = cfg.responseBody;
  syncAuthFieldStates();
  dirtyEndpoints.delete(selectedEndpoint);
}

function renderLogs() {
  const logs = appState.logs || [];
  const searchTerm = (logSearchEl.value || "").toLowerCase();
  
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    return (
      log.endpoint.toLowerCase().includes(searchTerm) ||
      log.method.toLowerCase().includes(searchTerm) ||
      log.path.toLowerCase().includes(searchTerm) ||
      log.note.toLowerCase().includes(searchTerm) ||
      JSON.stringify(log.body).toLowerCase().includes(searchTerm)
    );
  });

  logCountEl.textContent = String(filteredLogs.length);

  if (filteredLogs.length === 0) {
    logsEl.innerHTML = `<div class="log-item"><div class="log-top">${searchTerm ? 'No matching logs' : 'No requests yet'}</div></div>`;
    return;
  }

  logsEl.innerHTML = filteredLogs
    .map((log) => {
      const failClass = log.authValid && log.returnedStatusCode < 400 ? "" : "fail";
      return `
      <article class="log-item ${failClass}">
        <div class="log-top">
          <strong>${log.endpoint}</strong>
          <span>${new Date(log.timestamp).toLocaleString()}</span>
        </div>
        <div class="log-meta">
          <span class="tag">${log.method}</span>
          <span class="tag">${log.path}</span>
          <span class="tag">status ${log.returnedStatusCode}</span>
          <span class="tag">auth ${log.authValid ? "ok" : "fail"}</span>
          <span class="tag">${log.note}</span>
        </div>
        <pre>${prettyJson(log.body)}</pre>
      </article>`;
    })
    .join("");
}

function render() {
  if (!appState) {
    return;
  }
  renderEndpointOptions();
  renderFinalWebhookUrl();
  renderConfig();
  renderLogs();
}

endpointSelect.addEventListener("change", () => {
  selectedEndpoint = endpointSelect.value;
  renderFinalWebhookUrl();
  renderConfig(true);
  setSaveStatus("", "info");
});

ngrokBaseUrlEl.addEventListener("input", () => {
  renderFinalWebhookUrl();
});

configForm.addEventListener("input", () => {
  dirtyEndpoints.add(selectedEndpoint);
});

fields.authType.addEventListener("change", () => {
  syncAuthFieldStates();
});

logSearchEl.addEventListener("input", () => {
  renderLogs();
});

configForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  let headers = {};
  try {
    headers = JSON.parse(fields.responseHeaders.value || "{}");
  } catch (e) {
    setSaveStatus("Invalid JSON in Response Headers", "error");
    return;
  }

  const statusCodes = fields.statusCodes.value
    .split(",")
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n));

  const payload = {
    authType: fields.authType.value,
    apiKeyHeaderName: fields.apiKeyHeaderName.value,
    apiKeyValue: fields.apiKeyValue.value,
    bearerToken: fields.bearerToken.value,
    defaultStatusCode: Number(fields.defaultStatusCode.value),
    statusCodes: statusCodes,
    responseDelayMs: Number(fields.responseDelayMs.value),
    responseHeaders: headers,
    responseBody: fields.responseBody.value
  };

  setSaveStatus(`Saving ${selectedEndpoint} config...`, "info");

  try {
    const res = await fetch(`/api/config/${selectedEndpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let details = "";
      try {
        const body = await res.json();
        details = body?.error ? `: ${body.error}` : "";
      } catch (_error) {
        details = "";
      }
      throw new Error(`Save failed (${res.status})${details}`);
    }

    dirtyEndpoints.delete(selectedEndpoint);
    await fetchState();
    setSaveStatus(`Saved ${selectedEndpoint} config.`, "success");
  } catch (error) {
    setSaveStatus(error instanceof Error ? error.message : "Save failed due to unexpected error.", "error");
  }
});

resetBtn.addEventListener("click", async () => {
  if (!confirm("Reset all configurations to defaults?")) return;
  await fetch("/api/config/reset", { method: "POST" });
  await fetchState();
});

clearLogsBtn.addEventListener("click", async () => {
  await fetch("/api/logs/clear", { method: "POST" });
  await fetchState();
});

fetchState();
setInterval(fetchState, 2000);
