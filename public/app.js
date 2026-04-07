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
const chaosControlsEl = document.getElementById("chaosControls");
const chaosEnabledEl = document.getElementById("chaosEnabled");
const chaosRateWrapEl = document.getElementById("chaosRateWrap");
const chaosRateEl = document.getElementById("chaosRate");
const chaosPulseEl = document.getElementById("chaosPulse");
const tunnelToggleBtn = document.getElementById("tunnelToggleBtn");
const tunnelUrlEl = document.getElementById("tunnelUrl");
const tunnelCopyTooltipEl = document.getElementById("tunnelCopyTooltip");
const simAiGenerateBtn = document.getElementById("simAiGenerateBtn");
const onboardingReplayBtn = document.getElementById("onboardingReplayBtn");
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatPanelEl = document.getElementById("chatPanel");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const chatMessagesEl = document.getElementById("chatMessages");
const chatSuggestionsEl = document.getElementById("chatSuggestions");
const chatInputEl = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const tabSimulatorBtn = document.getElementById("tabSimulator");
const tabBuilderBtn = document.getElementById("tabBuilder");
const simulatorView = document.getElementById("simulatorView");
const builderView = document.getElementById("builderView");

const envSelectEl = document.getElementById("envSelect");
const envManageBtn = document.getElementById("envManageBtn");
const builderMethodEl = document.getElementById("builderMethod");
const builderUrlEl = document.getElementById("builderUrl");
const builderUrlHighlightEl = document.getElementById("builderUrlHighlight");
const builderImportCurlBtn = document.getElementById("builderImportCurlBtn");
const builderCopyCurlBtn = document.getElementById("builderCopyCurlBtn");
const builderCopyCurlTooltipEl = document.getElementById("builderCopyCurlTooltip");
const builderSaveBtn = document.getElementById("builderSaveBtn");
const builderSendBtn = document.getElementById("builderSendBtn");
const headersRowsEl = document.getElementById("headersRows");
const addHeaderRowBtn = document.getElementById("addHeaderRow");
const paramsRowsEl = document.getElementById("paramsRows");
const addParamRowBtn = document.getElementById("addParamRow");
const bodyFormatSelectEl = document.getElementById("bodyFormatSelect");
const bodyFormatJsonBtn = document.getElementById("bodyFormatJsonBtn");
const bodyAiGenerateBtn = document.getElementById("bodyAiGenerateBtn");
const bodyAiBarEl = document.getElementById("bodyAiBar");
const bodyAiPromptEl = document.getElementById("bodyAiPrompt");
const bodyAiSendBtn = document.getElementById("bodyAiSendBtn");
const bodyAiSpinnerEl = document.getElementById("bodyAiSpinner");
const bodyAiErrorEl = document.getElementById("bodyAiError");
const builderBodyTextEl = document.getElementById("builderBodyText");
const formFieldsMountEl = document.getElementById("formFieldsMount");
const addFormRowBtn = document.getElementById("addFormRow");
const builderAuthTypeEl = document.getElementById("builderAuthType");
const authBearerGroupEl = document.getElementById("authBearerGroup");
const authApiKeyGroupEl = document.getElementById("authApiKeyGroup");
const authBasicGroupEl = document.getElementById("authBasicGroup");
const authBearerTokenEl = document.getElementById("authBearerToken");
const authApiKeyHeaderEl = document.getElementById("authApiKeyHeader");
const authApiKeyValueEl = document.getElementById("authApiKeyValue");
const authBasicUserEl = document.getElementById("authBasicUser");
const authBasicPassEl = document.getElementById("authBasicPass");

const builderResponsePanelEl = document.getElementById("builderResponsePanel");
const respStatusBadgeEl = document.getElementById("respStatusBadge");
const respMetaEl = document.getElementById("respMeta");
const respCopyBtn = document.getElementById("respCopyBtn");
const respBodyOutEl = document.getElementById("respBodyOut");
const respHeadersOutEl = document.getElementById("respHeadersOut");
const respRawOutEl = document.getElementById("respRawOut");
const respWarningsEl = document.getElementById("respWarnings");
const respPanelBodyEl = document.getElementById("respPanelBody");
const respPanelHeadersEl = document.getElementById("respPanelHeaders");
const respPanelRawEl = document.getElementById("respPanelRaw");
const builderDebugSectionEl = document.getElementById("builderDebugSection");
const builderDebugBtn = document.getElementById("builderDebugBtn");
const builderDebugBtnTextEl = document.getElementById("builderDebugBtnText");
const builderDebugSpinnerEl = document.getElementById("builderDebugSpinner");
const builderDebugResultEl = document.getElementById("builderDebugResult");
const builderDebugLabelEl = document.getElementById("builderDebugLabel");
const builderDebugTextEl = document.getElementById("builderDebugText");

const collectionsMountEl = document.getElementById("collectionsMount");
const newCollectionBtn = document.getElementById("newCollectionBtn");
const importCollectionBtn = document.getElementById("importCollectionBtn");
const importCollectionFileEl = document.getElementById("importCollectionFile");
const builderHistoryMountEl = document.getElementById("builderHistoryMount");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const modalBackdropEl = document.getElementById("modalBackdrop");
const actionModalEl = document.getElementById("actionModal");
const actionModalTitleEl = document.getElementById("actionModalTitle");
const actionModalMessageEl = document.getElementById("actionModalMessage");
const actionModalInputWrapEl = document.getElementById("actionModalInputWrap");
const actionModalInputLabelEl = document.getElementById("actionModalInputLabel");
const actionModalInputEl = document.getElementById("actionModalInput");
const actionModalCloseBtn = document.getElementById("actionModalCloseBtn");
const actionModalCancelBtn = document.getElementById("actionModalCancelBtn");
const actionModalConfirmBtn = document.getElementById("actionModalConfirmBtn");
const saveRequestModalEl = document.getElementById("saveRequestModal");
const saveReqCollectionEl = document.getElementById("saveReqCollection");
const saveReqNameEl = document.getElementById("saveReqName");
const saveReqConfirmBtn = document.getElementById("saveReqConfirmBtn");
const curlImportModalEl = document.getElementById("curlImportModal");
const curlImportInputEl = document.getElementById("curlImportInput");
const curlImportErrorEl = document.getElementById("curlImportError");
const curlImportConvertBtn = document.getElementById("curlImportConvertBtn");
const testsPreviewModalEl = document.getElementById("testsPreviewModal");
const testsPreviewListEl = document.getElementById("testsPreviewList");
const testsPreviewCollectionEl = document.getElementById("testsPreviewCollection");
const testsPreviewSaveBtn = document.getElementById("testsPreviewSaveBtn");
const testsPreviewCancelBtn = document.getElementById("testsPreviewCancelBtn");
const toastHostEl = document.getElementById("toastHost");

const envModalEl = document.getElementById("envModal");
const newEnvBtn = document.getElementById("newEnvBtn");
const envListMountEl = document.getElementById("envListMount");
const envVarRowsEl = document.getElementById("envVarRows");
const addEnvVarRowBtn = document.getElementById("addEnvVarRow");
const saveEnvVarsBtn = document.getElementById("saveEnvVarsBtn");
const envPromptModalEl = document.getElementById("envPromptModal");
const envPromptInputEl = document.getElementById("envPromptInput");
const envPromptCloseBtn = document.getElementById("envPromptCloseBtn");
const envPromptCancelBtn = document.getElementById("envPromptCancelBtn");
const envPromptConfirmBtn = document.getElementById("envPromptConfirmBtn");
const onboardingLayerEl = document.getElementById("onboardingLayer");
const onboardingHighlightEl = document.getElementById("onboardingHighlight");
const onboardingCardEl = document.getElementById("onboardingCard");
const onboardingStepLabelEl = document.getElementById("onboardingStepLabel");
const onboardingTitleEl = document.getElementById("onboardingTitle");
const onboardingBodyEl = document.getElementById("onboardingBody");
const onboardingSkipBtn = document.getElementById("onboardingSkipBtn");
const onboardingPrevBtn = document.getElementById("onboardingPrevBtn");
const onboardingNextBtn = document.getElementById("onboardingNextBtn");

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
  forwardUrl: document.getElementById("forwardUrl"),
  responseHeaders: document.getElementById("responseHeaders"),
  responseBody: document.getElementById("responseBody")
};

const MAIN_TAB_KEY = "mytools_active_tab";
const defaultRow = () => ({ key: "", value: "", enabled: true });

let appState = null;
let selectedEndpoint = "incoming-call";
let tunnelState = { active: false, url: null };
let chaosState = { enabled: false, failureRate: 0 };
let tunnelBusy = false;
let tooltipTimer = null;
let builderTooltipTimer = null;
let statePollTimer = null;
let stateEvents = null;
let stateEventsReconnectTimer = null;
let stateEventsUnsupported = false;

let features = { aiEnabled: false, ngrokEnabled: false };

const dirtyEndpoints = new Set();
const expandedLogIds = new Set();
const replayingLogIds = new Set();
const seenLogIds = new Set();
const debuggingLogIds = new Set();
const logDebugAnalysisById = new Map();

let collections = [];
let builderHistory = [];
let environmentsList = [];
let activeEnvironmentId = null;

let builderHeaders = [defaultRow()];
let builderParams = [defaultRow()];
let builderFormFields = [defaultRow()];
let builderBodyFormat = "json";
let suppressUrlSync = false;

let lastBuilderResponse = null;
let lastBuilderRequestPayload = null;
let respActiveTab = "body";
let builderDebugLoading = false;
let builderDebugAnalysis = "";

let expandedCollectionIds = new Set();
let openCollectionMenuId = null;
let generatingTestsRequestId = null;
let generatedTestsPreview = [];
let generatedTestsSourceName = "";
const expandedGeneratedTests = new Set();

let selectedEnvEditId = null;
let envVarDraft = [];
let envPromptResolver = null;
let actionModalResolver = null;
let actionModalNeedsInput = false;

let syncingParamsFromUrl = false;
let chatOpen = false;
let chatLoading = false;
let chatSessionId = "";
let chatHistory = [];
let onboardingActive = false;
let onboardingStepIndex = 0;

const ONBOARDING_COOKIE = "mytools_onboarding_complete";

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

function enabledRowsToRecord(rows) {
  const record = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.enabled === false) {
      continue;
    }
    const key = String(row?.key || "").trim();
    if (!key) {
      continue;
    }
    record[key] = String(row?.value ?? "");
  }
  return record;
}

function hasHeader(record, name) {
  const target = String(name || "").trim().toLowerCase();
  if (!target) {
    return false;
  }
  return Object.keys(record || {}).some((key) => String(key || "").trim().toLowerCase() === target);
}

function shellQuote(value) {
  const text = String(value ?? "");
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

function mergeCurlUrlAndParams(urlValue, paramsRecord) {
  const raw = String(urlValue || "").trim();
  const entries = Object.entries(paramsRecord || {}).filter(([key]) => String(key || "").trim());
  if (!entries.length) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    entries.forEach(([key, value]) => parsed.searchParams.set(key, String(value ?? "")));
    return parsed.toString();
  } catch (_error) {
    const query = new URLSearchParams();
    entries.forEach(([key, value]) => query.set(String(key), String(value ?? "")));
    const suffix = query.toString();
    if (!suffix) {
      return raw;
    }
    return `${raw}${raw.includes("?") ? "&" : "?"}${suffix}`;
  }
}

function buildCurlFromBuilderPayload(payload) {
  const method = String(payload?.method || "GET").trim().toUpperCase() || "GET";
  const headers = {
    ...enabledRowsToRecord(payload?.headers),
    ...authRowsToDebugHeaders(payload?.auth)
  };
  const params = enabledRowsToRecord(payload?.params);
  const url = mergeCurlUrlAndParams(payload?.url, params);

  let body = String(payload?.body ?? "");
  if (payload?.bodyFormat === "form") {
    body = new URLSearchParams(enabledRowsToRecord(payload?.formFields)).toString();
    if (body && !hasHeader(headers, "content-type")) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
  } else if (body.trim() && payload?.bodyFormat === "json" && !hasHeader(headers, "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  const lines = [`curl -X ${method} ${shellQuote(url)}`];
  Object.entries(headers).forEach(([key, value]) => {
    lines.push(`-H ${shellQuote(`${key}: ${String(value ?? "")}`)}`);
  });
  if (body.trim()) {
    lines.push(`-d ${shellQuote(body)}`);
  }
  return lines.join(" \\\n");
}

function recordToRows(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return [defaultRow()];
  }
  const rows = Object.entries(record).map(([key, value]) => ({ key, value: String(value ?? ""), enabled: true }));
  return rows.length ? rows : [defaultRow()];
}

function authRowsToDebugHeaders(auth) {
  const headers = {};
  if (!auth || auth.type === "NONE") {
    return headers;
  }
  if (auth.type === "BEARER") {
    const token = String(auth.bearerToken || "").trim();
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    return headers;
  }
  if (auth.type === "API_KEY") {
    const name = String(auth.apiKeyHeader || "").trim();
    if (name) {
      headers[name] = String(auth.apiKeyValue ?? "");
    }
    return headers;
  }
  if (auth.type === "BASIC") {
    const user = String(auth.basicUser || "");
    const pass = String(auth.basicPassword || "");
    headers.authorization = `Basic ${btoa(`${user}:${pass}`)}`;
  }
  return headers;
}

function toBuilderDebugRequest(payload) {
  if (!payload) {
    return null;
  }
  const headers = {
    ...enabledRowsToRecord(payload.headers),
    ...authRowsToDebugHeaders(payload.auth)
  };
  return {
    method: String(payload.method || "GET").toUpperCase(),
    url: String(payload.url || ""),
    headers,
    body: typeof payload.body === "string" ? payload.body : ""
  };
}

function toBuilderDebugResponse(result) {
  if (!result) {
    return null;
  }
  return {
    status: Number(result.status || 0),
    statusText: String(result.statusText || ""),
    headers: result.headers || {},
    body: typeof result.body === "string" ? result.body : prettyJson(result.body ?? "")
  };
}

function toLogDebugPayload(log) {
  const request = {
    method: String(log.method || "GET"),
    url: `${window.location.origin}${String(log.path || "")}`,
    headers: log.headers || {},
    body: typeof log.rawBody === "string" ? log.rawBody : prettyJson(log.body ?? "")
  };
  const response = {
    status: Number(log.returnedStatusCode || 0),
    statusText: String(log.note || ""),
    headers: log.responseHeaders || {},
    body:
      typeof log.responseBody === "string"
        ? log.responseBody
        : log.responseBody === undefined
          ? ""
          : prettyJson(log.responseBody)
  };
  return { request, response };
}

async function runAiDebug(request, response) {
  const res = await fetch("/api/ai/debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request, response })
  });
  const data = await res.json();
  if (!res.ok || !data.success || typeof data.analysis !== "string") {
    throw new Error(data.error || "AI debug failed");
  }
  return data.analysis;
}

function renderBuilderDebugState() {
  if (!builderResponsePanelEl || !builderDebugSectionEl) {
    return;
  }
  const status = Number(lastBuilderResponse?.status || 0);
  const visible = features.aiEnabled && status >= 400;
  builderDebugSectionEl.classList.toggle("is-hidden", !visible);
  if (!visible) {
    return;
  }

  builderDebugBtn.disabled = builderDebugLoading;
  builderDebugBtnTextEl.textContent = builderDebugLoading ? "Analyzing…" : "Debug with AI";
  builderDebugSpinnerEl.classList.toggle("is-hidden", !builderDebugLoading);
  if (builderDebugAnalysis) {
    builderDebugResultEl.classList.remove("is-hidden");
    builderDebugLabelEl.textContent = "AI Analysis";
    builderDebugTextEl.textContent = builderDebugAnalysis;
  } else {
    builderDebugResultEl.classList.add("is-hidden");
    builderDebugLabelEl.textContent = "AI Analysis";
    builderDebugTextEl.textContent = "";
  }
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

function statusPillClass(statusCode) {
  if (statusCode >= 500) return "is-5xx";
  if (statusCode >= 400) return "is-4xx";
  return "is-2xx";
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString();
}

function timeAgo(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return "";
  }
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function normalizeStatusCodes(rawValue) {
  return rawValue
    .split(",")
    .map((token) => parseInt(token.trim(), 10))
    .filter((value) => !Number.isNaN(value));
}

function normalizeFailureRate(rawValue) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.trunc(numeric)));
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
  fields.forwardUrl.value = cfg.forwardUrl || "";
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

function renderChaos() {
  chaosEnabledEl.checked = Boolean(chaosState.enabled);
  chaosRateEl.value = String(normalizeFailureRate(chaosState.failureRate));
  chaosRateWrapEl.classList.toggle("is-visible", chaosState.enabled);
  chaosPulseEl.classList.toggle("is-visible", chaosState.enabled);
  chaosControlsEl.classList.toggle("is-active", chaosState.enabled);
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
        <span>${searchTerm ? "No matching requests." : "Waiting for mytools..."}</span>
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
      const durationText =
        typeof log.durationMs === "number" ? `<div class="log-timing">Response time: ${log.durationMs} ms</div>` : "";
      const shouldShowDebug = features.aiEnabled && Number(log.returnedStatusCode) >= 400;
      const debugging = debuggingLogIds.has(log.id);
      const debugAnalysis = logDebugAnalysisById.get(log.id) || "";
      const debugBlock = shouldShowDebug
        ? `
            <div class="log-block ai-debug-block">
              ${
                debugAnalysis
                  ? `<p class="ai-debug-label">AI Analysis</p><div class="ai-debug-box">${escapeHtml(debugAnalysis)}</div>`
                  : `<button type="button" class="btn btn-glass btn-micro ai-debug-btn" data-action="debug-log" data-log-id="${log.id}" ${
                      debugging ? "disabled" : ""
                    }><span>${debugging ? "Analyzing…" : "Debug with AI"}</span>${debugging ? '<span class="ai-spinner" aria-hidden="true"></span>' : ""}</button>`
              }
            </div>`
        : "";
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
            ${durationText}
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
            ${debugBlock}
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
  renderChaos();
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

async function fetchChaosState() {
  const response = await fetch("/api/chaos");
  if (!response.ok) {
    throw new Error(`Failed to fetch chaos config (${response.status})`);
  }

  const nextState = await response.json();
  chaosState = {
    enabled: Boolean(nextState.enabled),
    failureRate: normalizeFailureRate(nextState.failureRate)
  };
  renderChaos();
}

async function fetchFeatures() {
  try {
    const res = await fetch("/api/config/features");
    if (!res.ok) {
      return;
    }
    features = await res.json();
  } catch (_e) {
    features = { aiEnabled: false, ngrokEnabled: false };
  }
  syncAiUi();
}

function applyLiveSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return;
  }

  if (snapshot.state && typeof snapshot.state === "object") {
    appState = snapshot.state;
    render();
  }
  if (snapshot.tunnel && typeof snapshot.tunnel === "object") {
    tunnelState = {
      active: Boolean(snapshot.tunnel.active),
      url: typeof snapshot.tunnel.url === "string" && snapshot.tunnel.url ? snapshot.tunnel.url : null
    };
    renderTunnel();
  }
  if (snapshot.chaos && typeof snapshot.chaos === "object") {
    chaosState = {
      enabled: Boolean(snapshot.chaos.enabled),
      failureRate: normalizeFailureRate(snapshot.chaos.failureRate)
    };
    renderChaos();
  }
}

async function pollStateOnce() {
  await Promise.all([fetchState(), fetchTunnelStatus(), fetchChaosState()]);
}

function startPollingFallback() {
  if (statePollTimer) {
    return;
  }
  statePollTimer = setInterval(async () => {
    try {
      await pollStateOnce();
    } catch (_error) {
      // Keep polling; transient network/tunnel issues should self-heal.
    }
  }, 2000);
}

function stopPollingFallback() {
  if (!statePollTimer) {
    return;
  }
  clearInterval(statePollTimer);
  statePollTimer = null;
}

function scheduleStateEventsReconnect() {
  if (stateEventsUnsupported) {
    return;
  }
  if (stateEventsReconnectTimer) {
    return;
  }
  stateEventsReconnectTimer = setTimeout(() => {
    stateEventsReconnectTimer = null;
    connectStateEvents();
  }, 3000);
}

async function probeStateEventsEndpoint() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  try {
    const response = await fetch("/api/events", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    return response.ok && contentType.includes("text/event-stream");
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function connectStateEvents() {
  if (typeof EventSource === "undefined") {
    stateEventsUnsupported = true;
    startPollingFallback();
    return;
  }
  if (stateEvents) {
    return;
  }
  if (stateEventsUnsupported) {
    startPollingFallback();
    return;
  }

  const supported = await probeStateEventsEndpoint();
  if (!supported) {
    stateEventsUnsupported = true;
    startPollingFallback();
    return;
  }

  const source = new EventSource("/api/events");
  stateEvents = source;
  stateEventsUnsupported = false;

  source.onopen = () => {
    stopPollingFallback();
  };

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(String(event.data || "{}"));
      applyLiveSnapshot(payload);
      stopPollingFallback();
    } catch (_error) {
      // Keep stream alive; next valid event will recover.
    }
  };

  source.onerror = () => {
    if (stateEvents === source) {
      stateEvents = null;
    }
    source.close();
    startPollingFallback();
    scheduleStateEventsReconnect();
  };
}

function syncAiUi() {
  const disabled = !features.aiEnabled;
  bodyAiGenerateBtn.disabled = disabled;
  simAiGenerateBtn.disabled = disabled;
  if (disabled) {
    bodyAiGenerateBtn.title = "Enable AI in backend config to use generation";
    simAiGenerateBtn.title = "Enable AI in backend config to use generation";
  } else {
    bodyAiGenerateBtn.removeAttribute("title");
    simAiGenerateBtn.removeAttribute("title");
  }
  renderBuilderDebugState();
  renderLogs();
}

async function updateChaosState(nextState) {
  const payload = {
    enabled: Boolean(nextState.enabled),
    failureRate: normalizeFailureRate(nextState.failureRate)
  };

  const response = await fetch("/api/chaos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Chaos update failed (${response.status})`);
  }

  const saved = await response.json();
  chaosState = {
    enabled: Boolean(saved.enabled),
    failureRate: normalizeFailureRate(saved.failureRate)
  };
  renderChaos();
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (_error) {
      // Fall through to the legacy copy path when clipboard permissions are denied.
    }
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "true");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();
  helper.setSelectionRange(0, helper.value.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(helper);
  if (!copied) {
    throw new Error("copy failed");
  }
}

function promptManualCopy(label, value) {
  window.prompt(`Clipboard blocked. Copy ${label} manually (Ctrl/Cmd+C, then Enter).`, value);
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

function showBuilderCopyCurlTooltip(text, type = "success") {
  if (!builderCopyCurlTooltipEl) {
    return;
  }
  builderCopyCurlTooltipEl.textContent = text;
  builderCopyCurlTooltipEl.classList.toggle("is-error", type === "error");
  if (builderTooltipTimer) {
    clearTimeout(builderTooltipTimer);
  }
  builderTooltipTimer = setTimeout(() => {
    builderCopyCurlTooltipEl.textContent = "";
    builderCopyCurlTooltipEl.classList.remove("is-error");
  }, 1400);
}

function showToast(message, type = "success") {
  if (!toastHostEl) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast-pill toast-${type}`;
  toast.textContent = message;
  toastHostEl.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 220);
  }, 3000);
}

function getCookie(name) {
  const target = `${name}=`;
  const parts = String(document.cookie || "").split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return "";
}

function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function resolveActionModal(value, options = { sync: true }) {
  if (actionModalEl) {
    actionModalEl.hidden = true;
    actionModalEl.classList.add("is-hidden");
  }
  if (actionModalInputEl) {
    actionModalInputEl.value = "";
  }
  actionModalNeedsInput = false;
  const resolver = actionModalResolver;
  actionModalResolver = null;
  if (resolver) {
    resolver(value);
  }
  if (options.sync !== false) {
    syncModalBackdrop();
  }
}

function syncModalBackdrop() {
  const modalNodes = [actionModalEl, saveRequestModalEl, curlImportModalEl, testsPreviewModalEl, envModalEl, envPromptModalEl];
  const hasOpenModal = modalNodes.some((node) => Boolean(node && !node.hidden && !node.classList.contains("is-hidden")));
  modalBackdropEl.hidden = !hasOpenModal;
  modalBackdropEl.classList.toggle("is-hidden", !hasOpenModal);
}

function openActionModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  inputLabel = "",
  inputPlaceholder = "",
  inputValue = ""
}) {
  return new Promise((resolve) => {
    actionModalResolver = resolve;
    actionModalNeedsInput = Boolean(inputLabel);
    modalBackdropEl.hidden = false;
    modalBackdropEl.classList.remove("is-hidden");
    actionModalTitleEl.textContent = title;
    actionModalMessageEl.textContent = message;
    actionModalConfirmBtn.textContent = confirmLabel;
    actionModalCancelBtn.textContent = cancelLabel;
    actionModalConfirmBtn.classList.toggle("btn-danger", confirmTone === "danger");
    actionModalInputWrapEl.classList.toggle("is-hidden", !actionModalNeedsInput);
    actionModalInputLabelEl.textContent = inputLabel || "Value";
    actionModalInputEl.placeholder = inputPlaceholder;
    actionModalInputEl.value = inputValue;
    actionModalEl.hidden = false;
    actionModalEl.classList.remove("is-hidden");
    queueMicrotask(() => {
      if (actionModalNeedsInput) {
        actionModalInputEl?.focus();
      } else {
        actionModalConfirmBtn?.focus();
      }
    });
  });
}

async function askConfirm({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "primary" }) {
  const result = await openActionModal({
    title,
    message,
    confirmLabel,
    cancelLabel,
    confirmTone: tone
  });
  return result === true;
}

async function askPrompt({
  title,
  message,
  inputLabel,
  placeholder = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  initialValue = ""
}) {
  const result = await openActionModal({
    title,
    message,
    confirmLabel,
    cancelLabel,
    inputLabel,
    inputPlaceholder: placeholder,
    inputValue: initialValue
  });
  if (typeof result !== "string") {
    return null;
  }
  const normalized = result.trim();
  return normalized || null;
}

function bodyPreview(body) {
  const text = typeof body === "string" ? body : prettyJson(body ?? "");
  return text.trim() || "(empty)";
}

function trimChatHistory() {
  if (chatHistory.length > 20) {
    chatHistory = chatHistory.slice(-20);
  }
}

function renderChatContent(text) {
  const blocks = [];
  let rendered = String(text || "").replace(/```([\s\S]*?)```/g, (_match, code) => {
    const token = `@@CHAT_BLOCK_${blocks.length}@@`;
    blocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return token;
  });

  rendered = escapeHtml(rendered).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
  blocks.forEach((html, idx) => {
    rendered = rendered.replace(`@@CHAT_BLOCK_${idx}@@`, html);
  });
  return rendered;
}

function buildChatContext() {
  const activeEnvName = environmentsList.find((env) => env.id === activeEnvironmentId)?.name || null;
  const recentLogSummary = (appState?.logs || []).slice(0, 10).map((entry) => ({
    method: entry.method,
    path: entry.path,
    status: entry.returnedStatusCode,
    timestamp: entry.timestamp
  }));
  const currentUrl = String(builderUrlEl.value || "").trim();
  return {
    endpointKeys: appState?.endpointKeys || [],
    collectionNames: collections.map((collection) => collection.name),
    recentLogSummary,
    activeEnvironment: activeEnvName,
    builderCurrentRequest: currentUrl ? { method: builderMethodEl.value, url: currentUrl } : null
  };
}

function renderChatMessages() {
  const hasMessages = chatHistory.length > 0;
  chatSuggestionsEl.classList.toggle("is-hidden", hasMessages || chatLoading);
  if (!hasMessages && !chatLoading) {
    chatMessagesEl.innerHTML = "";
    return;
  }

  const messagesHtml = chatHistory
    .map((message) => {
      const roleClass = message.role === "user" ? "chat-msg-user" : "chat-msg-ai";
      return `<article class="chat-message ${roleClass}"><div class="chat-bubble"><div class="chat-bubble-content">${renderChatContent(message.content)}</div></div></article>`;
    })
    .join("");

  const typingHtml = chatLoading
    ? `
      <article class="chat-message chat-msg-ai">
        <div class="chat-bubble chat-typing">
          <div class="chat-typing-dots"><span></span><span></span><span></span></div>
        </div>
      </article>`
    : "";

  chatMessagesEl.innerHTML = `${messagesHtml}${typingHtml}`;
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function setChatOpen(nextOpen) {
  chatOpen = Boolean(nextOpen);
  chatPanelEl.classList.toggle("is-hidden", !chatOpen);
  chatPanelEl.toggleAttribute("hidden", !chatOpen);
  if (chatOpen) {
    queueMicrotask(() => chatInputEl?.focus());
    renderChatMessages();
  }
}

function autoGrowChatInput() {
  chatInputEl.style.height = "auto";
  const maxHeight = 24 * 4 + 16;
  chatInputEl.style.height = `${Math.min(chatInputEl.scrollHeight, maxHeight)}px`;
}

async function sendChatMessage(rawMessage) {
  const message = String(rawMessage || "").trim();
  if (!message || chatLoading) {
    return;
  }

  chatHistory.push({ role: "user", content: message });
  trimChatHistory();
  chatLoading = true;
  chatInputEl.value = "";
  autoGrowChatInput();
  renderChatMessages();

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: chatHistory,
        context: buildChatContext(),
        sessionId: chatSessionId || undefined
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success || typeof data.reply !== "string") {
      throw new Error(data.error || "Chat failed");
    }
    chatSessionId = typeof data.sessionId === "string" ? data.sessionId : chatSessionId;
    chatHistory.push({ role: "assistant", content: data.reply });
    trimChatHistory();
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Chat failed", "error");
    chatHistory.push({
      role: "assistant",
      content: "I couldn't complete that just now. Please try again."
    });
    trimChatHistory();
  } finally {
    chatLoading = false;
    renderChatMessages();
  }
}

const onboardingSteps = [
  {
    targetId: "chaosControls",
    title: "Step 1: Chaos Mode (optional)",
    body: "Use Chaos Mode to intentionally create random failures, so you can confirm your system handles retries and errors correctly.",
    tab: "simulator"
  },
  {
    targetId: "endpointTabs",
    title: "Step 2: Choose an Endpoint",
    body: "Each tab is a webhook route. Pick one route, then configure auth, status code, delay, headers, and response body for that route.",
    tab: "simulator"
  },
  {
    targetId: "saveBtn",
    title: "Step 3: Save Your Setup",
    body: "After editing settings, click Save Endpoint Config to apply your simulator behavior.",
    tab: "simulator"
  },
  {
    targetId: "tunnelToggleBtn",
    title: "Step 4: Shareable Tunnel",
    body: "Start Tunnel to expose your local webhook URL so external systems can send real requests to your simulator.",
    tab: "simulator"
  },
  {
    targetId: "logs",
    title: "Step 5: Watch Live Requests",
    body: "Every incoming request appears here. Open any row to inspect payload, headers, auth result, and response details.",
    tab: "simulator"
  },
  {
    targetId: "tabBuilder",
    title: "Step 6: Switch to Builder",
    body: "Builder mode helps you craft and send API requests manually, then inspect response body, headers, and raw output.",
    tab: "builder"
  },
  {
    targetId: "newCollectionBtn",
    title: "Step 7: Save Collections",
    body: "Create collections to organize reusable requests for smoke tests, QA scenarios, and release checks.",
    tab: "builder"
  },
  {
    targetId: "chatToggleBtn",
    title: "Step 8: Ask Assistant",
    body: "Use Ask mytools for quick summaries in plain language, like configured endpoints, saved collections, or failed requests.",
    tab: "simulator"
  }
];

function ensureOnboardingTargetTab(step) {
  if (!step?.tab) {
    return;
  }
  if (getMainTab() !== step.tab) {
    setMainTab(step.tab);
  }
}

function positionOnboardingCard(rect) {
  if (!onboardingCardEl || !onboardingHighlightEl) {
    return;
  }
  const margin = 12;
  const pad = 6;
  onboardingHighlightEl.style.left = `${Math.max(margin, rect.left - pad)}px`;
  onboardingHighlightEl.style.top = `${Math.max(margin, rect.top - pad)}px`;
  onboardingHighlightEl.style.width = `${Math.min(window.innerWidth - margin * 2, rect.width + pad * 2)}px`;
  onboardingHighlightEl.style.height = `${Math.min(window.innerHeight - margin * 2, rect.height + pad * 2)}px`;

  const cardRect = onboardingCardEl.getBoundingClientRect();
  let top = rect.bottom + 16;
  if (top + cardRect.height > window.innerHeight - margin) {
    top = rect.top - cardRect.height - 16;
  }
  if (top < margin) {
    top = margin;
  }

  let left = rect.left;
  if (left + cardRect.width > window.innerWidth - margin) {
    left = window.innerWidth - cardRect.width - margin;
  }
  if (left < margin) {
    left = margin;
  }

  onboardingCardEl.style.left = `${left}px`;
  onboardingCardEl.style.top = `${top}px`;
}

function renderOnboardingStep() {
  if (!onboardingActive || !onboardingLayerEl) {
    return;
  }
  const step = onboardingSteps[onboardingStepIndex];
  if (!step) {
    stopOnboarding(false);
    return;
  }

  ensureOnboardingTargetTab(step);
  const target = document.getElementById(step.targetId);
  if (!target) {
    if (onboardingStepIndex >= onboardingSteps.length - 1) {
      stopOnboarding(false);
      return;
    }
    onboardingStepIndex += 1;
    renderOnboardingStep();
    return;
  }

  onboardingStepLabelEl.textContent = `Step ${onboardingStepIndex + 1} of ${onboardingSteps.length}`;
  onboardingTitleEl.textContent = step.title;
  onboardingBodyEl.textContent = step.body;
  onboardingPrevBtn.disabled = onboardingStepIndex === 0;
  onboardingNextBtn.textContent = onboardingStepIndex === onboardingSteps.length - 1 ? "Finish" : "Next";

  const targetRect = target.getBoundingClientRect();
  if (targetRect.bottom < 0 || targetRect.top > window.innerHeight) {
    target.scrollIntoView({ block: "center", inline: "nearest" });
    requestAnimationFrame(syncOnboardingPosition);
    return;
  }
  positionOnboardingCard(targetRect);
}

function syncOnboardingPosition() {
  if (!onboardingActive) {
    return;
  }
  renderOnboardingStep();
}

function stopOnboarding(completed) {
  onboardingActive = false;
  onboardingLayerEl.hidden = true;
  onboardingLayerEl.classList.add("is-hidden");
  window.removeEventListener("resize", syncOnboardingPosition);
  window.removeEventListener("scroll", syncOnboardingPosition, true);
  if (completed) {
    setCookie(ONBOARDING_COOKIE, "1", 60 * 60 * 24 * 365);
    showToast("Tour completed. You will not see it again on this browser.", "success");
  }
}

function startOnboarding(force = false) {
  if ((!force && getCookie(ONBOARDING_COOKIE) === "1") || !onboardingLayerEl) {
    return;
  }
  if (onboardingActive) {
    return;
  }
  onboardingActive = true;
  onboardingStepIndex = 0;
  onboardingLayerEl.hidden = false;
  onboardingLayerEl.classList.remove("is-hidden");
  renderOnboardingStep();
  window.addEventListener("resize", syncOnboardingPosition);
  window.addEventListener("scroll", syncOnboardingPosition, true);
}

function startOnboardingIfNeeded() {
  startOnboarding(false);
}

/* --- Main tabs --- */

function getMainTab() {
  return localStorage.getItem(MAIN_TAB_KEY) === "builder" ? "builder" : "simulator";
}

function setMainTab(tab) {
  localStorage.setItem(MAIN_TAB_KEY, tab);
  const isSim = tab === "simulator";
  tabSimulatorBtn.classList.toggle("is-active", isSim);
  tabBuilderBtn.classList.toggle("is-active", !isSim);
  tabSimulatorBtn.setAttribute("aria-selected", isSim ? "true" : "false");
  tabBuilderBtn.setAttribute("aria-selected", isSim ? "false" : "true");

  simulatorView.classList.toggle("is-hidden", !isSim);
  simulatorView.toggleAttribute("hidden", !isSim);
  builderView.classList.toggle("is-hidden", isSim);
  builderView.toggleAttribute("hidden", isSim);

  if (!isSim) {
    void refreshBuilderContext();
  }
  if (onboardingActive) {
    requestAnimationFrame(syncOnboardingPosition);
  }
}

/* --- Builder: KV rows --- */

function renderKvRows(container, rows, kind) {
  container.innerHTML = rows
    .map((row, idx) => {
      const checked = row.enabled !== false ? "checked" : "";
      return `
        <div class="kv-row" data-kind="${escapeHtml(kind)}" data-idx="${idx}">
          <input type="checkbox" data-field="enabled" ${checked} aria-label="Enable row" />
          <input type="text" data-field="key" value="${escapeHtml(row.key)}" placeholder="key" />
          <input type="text" data-field="value" value="${escapeHtml(row.value)}" placeholder="value" />
          <button type="button" class="btn btn-glass btn-tiny" data-action="delete">✕</button>
        </div>`;
    })
    .join("");

  container.querySelectorAll(".kv-row").forEach((rowEl) => {
    rowEl.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => onKvInput(rowEl, kind));
      input.addEventListener("change", () => onKvInput(rowEl, kind));
    });
    const del = rowEl.querySelector("button[data-action='delete']");
    del?.addEventListener("click", () => onKvDelete(rowEl, kind));
  });
}

function onKvInput(rowEl, kind) {
  const idx = Number(rowEl.dataset.idx);
  const target = rowEl.querySelector("[data-field='key']");
  const val = rowEl.querySelector("[data-field='value']");
  const en = rowEl.querySelector("[data-field='enabled']");
  const arr = getRowsByKind(kind);
  if (!arr[idx]) {
    return;
  }
  arr[idx].key = target instanceof HTMLInputElement ? target.value : "";
  arr[idx].value = val instanceof HTMLInputElement ? val.value : "";
  arr[idx].enabled = en instanceof HTMLInputElement ? en.checked : true;

  if (kind === "params") {
    syncUrlFromParams();
  }
  if (kind === "headers" || kind === "form" || kind === "params") {
    updateUrlHighlight();
  }
}

function onKvDelete(rowEl, kind) {
  const idx = Number(rowEl.dataset.idx);
  const arr = getRowsByKind(kind);
  if (!arr || arr.length <= 1) {
    arr[0] = defaultRow();
    renderKvRows(kind === "headers" ? headersRowsEl : kind === "params" ? paramsRowsEl : formFieldsMountEl, arr, kind);
    if (kind === "params") {
      syncUrlFromParams();
    }
    return;
  }
  arr.splice(idx, 1);
  renderKvRows(kind === "headers" ? headersRowsEl : kind === "params" ? paramsRowsEl : formFieldsMountEl, arr, kind);
  if (kind === "params") {
    syncUrlFromParams();
  }
}

function getRowsByKind(kind) {
  if (kind === "headers") return builderHeaders;
  if (kind === "params") return builderParams;
  if (kind === "form") return builderFormFields;
  return builderHeaders;
}

function syncUrlFromParams() {
  if (syncingParamsFromUrl) {
    return;
  }
  const base = stripQuery(builderUrlEl.value || "");
  const joined = mergeParamsIntoUrl(base, builderParams);
  builderUrlEl.value = joined;
  updateUrlHighlight();
}

function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch (_e) {
    return url;
  }
}

function mergeParamsIntoUrl(base, params) {
  try {
    const u = new URL(ensureUrlScheme(base));
    const sp = new URLSearchParams();
    params
      .filter((r) => r.enabled !== false && String(r.key || "").trim())
      .forEach((r) => sp.append(String(r.key).trim(), String(r.value ?? "")));
    u.search = sp.toString();
    return u.toString();
  } catch (_e) {
    return base;
  }
}

function ensureUrlScheme(raw) {
  const t = String(raw || "").trim();
  if (!t) {
    return "http://localhost";
  }
  if (!/^https?:\/\//i.test(t)) {
    return `http://${t}`;
  }
  return t;
}

function parseParamsFromUrl(urlStr) {
  try {
    const u = new URL(ensureUrlScheme(urlStr));
    const rows = [];
    u.searchParams.forEach((value, key) => {
      rows.push({ key, value, enabled: true });
    });
    if (rows.length === 0) {
      return [defaultRow()];
    }
    return rows;
  } catch (_e) {
    return [defaultRow()];
  }
}

function syncParamsFromUrlField() {
  syncingParamsFromUrl = true;
  builderParams = parseParamsFromUrl(builderUrlEl.value || "");
  renderKvRows(paramsRowsEl, builderParams, "params");
  syncingParamsFromUrl = false;
  updateUrlHighlight();
}

function updateUrlHighlight() {
  const url = builderUrlEl.value || "";
  const active = Boolean(activeEnvironmentId);
  if (!active || !url.includes("{{")) {
    builderUrlHighlightEl.classList.add("is-hidden");
    builderUrlHighlightEl.innerHTML = "";
    return;
  }
  const html = url.replace(/\{\{([^}]+)\}\}/g, (_m, g1) => {
    return `<span class="var-highlight">{{${escapeHtml(String(g1))}}}</span>`;
  });
  builderUrlHighlightEl.innerHTML = html;
  builderUrlHighlightEl.classList.remove("is-hidden");
}

function setBuilderSubtab(name) {
  document.querySelectorAll(".builder-subtab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.subtab === name);
  });
  document.getElementById("subtabHeaders").classList.toggle("is-hidden", name !== "headers");
  document.getElementById("subtabBody").classList.toggle("is-hidden", name !== "body");
  document.getElementById("subtabAuth").classList.toggle("is-hidden", name !== "auth");
  document.getElementById("subtabParams").classList.toggle("is-hidden", name !== "params");
}

function setBodyFormatUi() {
  const fmt = builderBodyFormat;
  const isForm = fmt === "form";
  builderBodyTextEl.classList.toggle("is-hidden", isForm);
  formFieldsMountEl.classList.toggle("is-hidden", !isForm);
  addFormRowBtn.classList.toggle("is-hidden", !isForm);
  bodyFormatJsonBtn.classList.toggle("is-hidden", fmt !== "json");
}

function syncBuilderAuthUi() {
  const t = builderAuthTypeEl.value;
  authBearerGroupEl.classList.toggle("is-hidden", t !== "BEARER");
  authApiKeyGroupEl.classList.toggle("is-hidden", t !== "API_KEY");
  authBasicGroupEl.classList.toggle("is-hidden", t !== "BASIC");
}

function buildAuthPayload() {
  const type = builderAuthTypeEl.value;
  if (type === "BEARER") {
    return { type: "BEARER", bearerToken: authBearerTokenEl.value };
  }
  if (type === "API_KEY") {
    return { type: "API_KEY", apiKeyHeader: authApiKeyHeaderEl.value, apiKeyValue: authApiKeyValueEl.value };
  }
  if (type === "BASIC") {
    return { type: "BASIC", basicUser: authBasicUserEl.value, basicPassword: authBasicPassEl.value };
  }
  return { type: "NONE" };
}

function applyAuthToState(auth) {
  const t = auth?.type || "NONE";
  builderAuthTypeEl.value = t === "BEARER" || t === "API_KEY" || t === "BASIC" ? t : "NONE";
  authBearerTokenEl.value = auth?.bearerToken || "";
  authApiKeyHeaderEl.value = auth?.apiKeyHeader || "";
  authApiKeyValueEl.value = auth?.apiKeyValue || "";
  authBasicUserEl.value = auth?.basicUser || "";
  authBasicPassEl.value = auth?.basicPassword || "";
  syncBuilderAuthUi();
}

function collectBuilderPayload() {
  return {
    method: builderMethodEl.value,
    url: builderUrlEl.value,
    headers: builderHeaders,
    body: builderBodyTextEl.value,
    bodyFormat: builderBodyFormat,
    formFields: builderFormFields,
    params: builderParams,
    auth: buildAuthPayload()
  };
}

function applyBuilderSnapshot(snap) {
  builderMethodEl.value = snap.method || "GET";
  builderUrlEl.value = snap.url || "";
  builderHeaders = Array.isArray(snap.headers) && snap.headers.length ? snap.headers : [defaultRow()];
  builderParams = Array.isArray(snap.params) && snap.params.length ? snap.params : [defaultRow()];
  builderFormFields = Array.isArray(snap.formFields) && snap.formFields.length ? snap.formFields : [defaultRow()];
  builderBodyFormat = snap.bodyFormat === "text" || snap.bodyFormat === "form" ? snap.bodyFormat : "json";
  bodyFormatSelectEl.value = builderBodyFormat;
  builderBodyTextEl.value = typeof snap.bodyText === "string" ? snap.bodyText : "";
  applyAuthToState(snap.auth || { type: "NONE" });
  renderKvRows(headersRowsEl, builderHeaders, "headers");
  renderKvRows(paramsRowsEl, builderParams, "params");
  renderKvRows(formFieldsMountEl, builderFormFields, "form");
  setBodyFormatUi();
  updateUrlHighlight();
}

async function refreshBuilderContext() {
  await fetchFeatures();
  try {
    const [cols, hist, envs] = await Promise.all([
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/builder/history").then((r) => r.json()),
      fetch("/api/environments").then((r) => r.json())
    ]);
    collections = cols.collections || [];
    builderHistory = hist.history || [];
    environmentsList = envs.environments || [];
    activeEnvironmentId = envs.activeEnvironmentId ?? null;
    renderEnvSelect();
    renderCollections();
    renderBuilderHistory();
  } catch (_e) {
    setSaveStatus("Failed to load builder data.", "error");
  }
}

function renderEnvSelect() {
  envSelectEl.innerHTML = `<option value="">No environment</option>${environmentsList
    .map((e) => `<option value="${escapeHtml(e.id)}" ${e.id === activeEnvironmentId ? "selected" : ""}>${escapeHtml(e.name)}</option>`)
    .join("")}`;
}

async function setActiveEnvironment(id) {
  await fetch("/api/environments/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id || null })
  });
  const res = await fetch("/api/environments");
  const data = await res.json();
  environmentsList = data.environments || [];
  activeEnvironmentId = data.activeEnvironmentId ?? null;
  renderEnvSelect();
  updateUrlHighlight();
}

function truncateUrl(u, n = 48) {
  const s = String(u || "");
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function renderCollections() {
  if (collections.length === 0) {
    collectionsMountEl.innerHTML = '<p class="profiles-empty">No collections yet.</p>';
    return;
  }

  collectionsMountEl.innerHTML = collections
    .map((col) => {
      const expanded = expandedCollectionIds.has(col.id);
      const reqs = (col.requests || [])
        .map((r) => {
          const generating = generatingTestsRequestId === r.id;
          return `
            <div class="collection-item" data-collection-id="${escapeHtml(col.id)}" data-request-id="${escapeHtml(r.id)}">
              <div class="collection-item-main">
                <span class="method-badge">${escapeHtml(r.method)}</span>
                <span class="truncate" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</span>
              </div>
              <div class="collection-item-actions">
                <button type="button" class="btn btn-glass btn-tiny collection-menu-trigger" aria-label="Request actions">⋯</button>
                <div class="menu-popover">
                  <button type="button" class="menu-btn" data-action="run-req">Run</button>
                  <button type="button" class="menu-btn" data-action="edit-req">Edit</button>
                  <button type="button" class="menu-btn" data-action="generate-tests" ${generating ? "disabled" : ""}>
                    ${generating ? "Generating…" : "Generate Tests"}
                  </button>
                  <button type="button" class="menu-btn" data-action="delete-req">Delete</button>
                </div>
              </div>
            </div>`;
        })
        .join("");

      return `
        <div class="collection-block" data-collection-id="${escapeHtml(col.id)}">
          <div class="collection-head">
            <button type="button" class="collection-name-btn" data-action="toggle-col">${escapeHtml(col.name)}</button>
            <div class="collection-actions">
              <button type="button" class="btn btn-glass btn-tiny" data-action="export-col">Export</button>
              <button type="button" class="btn btn-glass btn-tiny" data-action="delete-col">Delete</button>
            </div>
          </div>
          <div class="collection-items" ${expanded ? "" : "hidden"}>
            ${reqs || '<p class="profiles-empty">No saved requests.</p>'}
          </div>
        </div>`;
    })
    .join("");
}

function renderBuilderHistory() {
  if (builderHistory.length === 0) {
    builderHistoryMountEl.innerHTML = '<p class="profiles-empty">No history yet.</p>';
    return;
  }
  builderHistoryMountEl.innerHTML = builderHistory
    .map((h) => {
      return `
        <div class="history-item" data-history-id="${escapeHtml(h.id)}">
          <div class="history-top">
            <span class="method-badge">${escapeHtml(h.method)}</span>
            <span class="status-badge ${statusClass(Number(h.status))}">${escapeHtml(h.status)}</span>
          </div>
          <div class="truncate" title="${escapeHtml(h.url)}">${escapeHtml(truncateUrl(h.url))}</div>
          <div class="log-time">${escapeHtml(timeAgo(h.at))} · ${escapeHtml(String(h.durationMs))} ms</div>
        </div>`;
    })
    .join("");
}

function openModal(kind) {
  modalBackdropEl.hidden = false;
  modalBackdropEl.classList.remove("is-hidden");
  if (kind === "save") {
    saveRequestModalEl.hidden = false;
    saveRequestModalEl.classList.remove("is-hidden");
    saveReqCollectionEl.innerHTML = collections.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
  }
  if (kind === "env") {
    envModalEl.hidden = false;
    envModalEl.classList.remove("is-hidden");
    renderEnvModalList();
  }
  if (kind === "curl-import") {
    curlImportErrorEl.classList.add("is-hidden");
    curlImportErrorEl.textContent = "";
    curlImportModalEl.hidden = false;
    curlImportModalEl.classList.remove("is-hidden");
    queueMicrotask(() => curlImportInputEl?.focus());
  }
  if (kind === "tests-preview") {
    testsPreviewModalEl.hidden = false;
    testsPreviewModalEl.classList.remove("is-hidden");
    testsPreviewSaveBtn.disabled = false;
    testsPreviewCollectionEl.innerHTML = [
      '<option value="new">New collection</option>',
      ...collections.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    ].join("");
    renderGeneratedTestsPreview();
  }
}

function closeEnvPrompt(result = null) {
  if (envPromptModalEl) {
    envPromptModalEl.hidden = true;
    envPromptModalEl.classList.add("is-hidden");
  }
  if (envPromptInputEl) {
    envPromptInputEl.value = "";
  }
  const resolver = envPromptResolver;
  envPromptResolver = null;
  if (resolver) {
    resolver(result);
  }
}

function closeModals() {
  resolveActionModal(null, { sync: false });
  saveRequestModalEl.hidden = true;
  saveRequestModalEl.classList.add("is-hidden");
  curlImportModalEl.hidden = true;
  curlImportModalEl.classList.add("is-hidden");
  curlImportErrorEl.classList.add("is-hidden");
  curlImportErrorEl.textContent = "";
  testsPreviewModalEl.hidden = true;
  testsPreviewModalEl.classList.add("is-hidden");
  envModalEl.hidden = true;
  envModalEl.classList.add("is-hidden");
  closeEnvPrompt();
  modalBackdropEl.hidden = true;
  modalBackdropEl.classList.add("is-hidden");
}

function openEnvPrompt() {
  return new Promise((resolve) => {
    envPromptResolver = resolve;
    modalBackdropEl.hidden = false;
    modalBackdropEl.classList.remove("is-hidden");
    envPromptModalEl.hidden = false;
    envPromptModalEl.classList.remove("is-hidden");
    envPromptInputEl.value = "";
    queueMicrotask(() => envPromptInputEl?.focus());
  });
}

function renderEnvModalList() {
  if (environmentsList.length === 0) {
    envListMountEl.innerHTML = '<p class="profiles-empty">No environments.</p>';
    selectedEnvEditId = null;
    envVarDraft = [{ key: "", value: "", secret: false }];
    renderEnvVarRows();
    return;
  }
  if (!selectedEnvEditId || !environmentsList.some((e) => e.id === selectedEnvEditId)) {
    selectedEnvEditId = environmentsList[0].id;
  }
  envListMountEl.innerHTML = environmentsList
    .map((e) => {
      return `
        <div class="env-item ${e.id === selectedEnvEditId ? "is-active" : ""}" data-env-id="${escapeHtml(e.id)}">
          <button type="button" class="env-item-name" data-action="pick-env">${escapeHtml(e.name)}</button>
          <button type="button" class="btn btn-glass btn-tiny" data-action="delete-env">✕</button>
        </div>`;
    })
    .join("");
  void loadEnvDetail(selectedEnvEditId);
}

async function loadEnvDetail(id) {
  selectedEnvEditId = id;
  const res = await fetch(`/api/environments/${encodeURIComponent(id)}`);
  if (!res.ok) {
    return;
  }
  const data = await res.json();
  envVarDraft = (data.variables || []).map((v) => ({
    key: v.key || "",
    value: v.value || "",
    secret: Boolean(v.secret)
  }));
  if (envVarDraft.length === 0) {
    envVarDraft = [{ key: "", value: "", secret: false }];
  }
  renderEnvVarRows();
}

function renderEnvVarRows() {
  envVarRowsEl.innerHTML = envVarDraft
    .map((row, idx) => {
      const sec = row.secret ? "checked" : "";
      return `
        <div class="kv-row env-var-row" data-idx="${idx}">
          <input type="text" class="env-var-input" data-field="key" value="${escapeHtml(row.key)}" placeholder="KEY" />
          <input type="text" class="env-var-input" data-field="value" value="${escapeHtml(row.value)}" placeholder="VALUE" />
          <label class="secret-toggle" aria-label="Mark variable as secret">
            <input type="checkbox" data-field="secret" ${sec} />
            <span class="secret-toggle-track" aria-hidden="true"></span>
            <span class="secret-toggle-label">Secret</span>
          </label>
          <button type="button" class="btn btn-glass btn-tiny env-row-delete-btn" data-action="delete-env-var" aria-label="Delete variable">✕</button>
        </div>`;
    })
    .join("");

  envVarRowsEl.querySelectorAll(".kv-row").forEach((rowEl) => {
    rowEl.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", onEnvVarInput);
      input.addEventListener("change", onEnvVarInput);
    });
    rowEl.querySelector("button[data-action='delete-env-var']")?.addEventListener("click", () => {
      const idx = Number(rowEl.dataset.idx);
      envVarDraft.splice(idx, 1);
      if (envVarDraft.length === 0) {
        envVarDraft.push({ key: "", value: "", secret: false });
      }
      renderEnvVarRows();
    });
  });
}

function onEnvVarInput(event) {
  const rowEl = event.target.closest(".kv-row");
  if (!(rowEl instanceof HTMLElement)) {
    return;
  }
  const idx = Number(rowEl.dataset.idx);
  const key = rowEl.querySelector("[data-field='key']");
  const val = rowEl.querySelector("[data-field='value']");
  const sec = rowEl.querySelector("[data-field='secret']");
  envVarDraft[idx] = {
    key: key instanceof HTMLInputElement ? key.value : "",
    value: val instanceof HTMLInputElement ? val.value : "",
    secret: sec instanceof HTMLInputElement ? sec.checked : false
  };
}

function setRespSubtab(name) {
  respActiveTab = name;
  document.querySelectorAll(".resp-subtab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.resptab === name);
  });
  respPanelBodyEl.classList.toggle("is-hidden", name !== "body");
  respPanelHeadersEl.classList.toggle("is-hidden", name !== "headers");
  respPanelRawEl.classList.toggle("is-hidden", name !== "raw");
}

function showBuilderResponse(result) {
  lastBuilderResponse = result;
  builderDebugLoading = false;
  builderDebugAnalysis = "";
  builderResponsePanelEl.classList.remove("is-hidden");
  respStatusBadgeEl.textContent = String(result.status);
  respStatusBadgeEl.className = `status-badge-pill ${statusPillClass(Number(result.status))}`;
  respMetaEl.textContent = `${result.duration_ms} ms · ${result.size_bytes} bytes`;
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  if (warnings.length) {
    respWarningsEl.textContent = warnings.map((w) => `⚠ ${w}`).join("\n");
    respWarningsEl.classList.remove("is-hidden");
  } else {
    respWarningsEl.textContent = "";
    respWarningsEl.classList.add("is-hidden");
  }

  let prettyBody = result.body || "";
  try {
    prettyBody = JSON.stringify(JSON.parse(prettyBody), null, 2);
  } catch (_e) {
    // keep text
  }
  respBodyOutEl.textContent = prettyBody;
  respHeadersOutEl.textContent = prettyJson(result.headers || {});
  respRawOutEl.textContent = result.body || "";
  setRespSubtab("body");
  renderBuilderDebugState();
}

async function runAiGenerate(prompt, context) {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "AI error");
  }
  return data.result;
}

async function runCurlImport(curlText) {
  const res = await fetch("/api/ai/curl-to-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ curl: curlText })
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.request) {
    throw new Error(data.error || "Could not parse curl command");
  }
  return data.request;
}

function applyImportedCurlRequest(request) {
  const bodyText = typeof request.body === "string" ? request.body : prettyJson(request.body ?? "");
  const normalizedBody = bodyText.trim();
  let bodyFormat = "text";
  if (!normalizedBody) {
    bodyFormat = "json";
  } else {
    try {
      JSON.parse(normalizedBody);
      bodyFormat = "json";
    } catch (_error) {
      bodyFormat = "text";
    }
  }

  applyBuilderSnapshot({
    method: request.method || "GET",
    url: request.url || "",
    headers: recordToRows(request.headers),
    params: recordToRows(request.params),
    bodyFormat,
    bodyText,
    formFields: [defaultRow()],
    auth: { type: "NONE" }
  });
}

function savedRequestToAiRequest(savedRequest) {
  const headers = enabledRowsToRecord(savedRequest.headers || []);
  const params = enabledRowsToRecord(savedRequest.params || []);
  return {
    name: savedRequest.name || "Request",
    method: savedRequest.method || "GET",
    url: savedRequest.url || "",
    headers,
    body: savedRequest.bodyText || "",
    params
  };
}

async function runGenerateTests(savedRequest) {
  const request = savedRequestToAiRequest(savedRequest);
  const res = await fetch("/api/ai/generate-tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request })
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.tests)) {
    throw new Error(data.error || "Failed to generate tests");
  }
  return data.tests;
}

function renderGeneratedTestsPreview() {
  testsPreviewListEl.innerHTML = generatedTestsPreview
    .map((test, idx) => {
      const id = `gen_test_${idx}`;
      const expanded = expandedGeneratedTests.has(id);
      return `
        <article class="test-preview-card" data-test-id="${id}">
          <div class="test-preview-head">
            <p class="test-preview-name">${escapeHtml(test.name || `Test ${idx + 1}`)}</p>
            <span class="method-badge">${escapeHtml(test.method || "GET")}</span>
          </div>
          <pre class="test-preview-body ${expanded ? "is-expanded" : ""}">${escapeHtml(bodyPreview(test.body))}</pre>
          <button type="button" class="btn btn-glass btn-tiny test-preview-toggle" data-action="toggle-generated-test" data-test-id="${id}">
            ${expanded ? "Collapse" : "Expand"}
          </button>
        </article>`;
    })
    .join("");
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
    forwardUrl: fields.forwardUrl.value,
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
  const confirmed = await askConfirm({
    title: "Reset endpoint configs?",
    message: "This will restore every endpoint configuration to its default values.",
    confirmLabel: "Reset all",
    tone: "danger"
  });
  if (!confirmed) {
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
    const confirmed = await askConfirm({
      title: "Delete profile?",
      message: "This saved profile will be removed from your workspace.",
      confirmLabel: "Delete",
      tone: "danger"
    });
    if (!confirmed) {
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

chaosEnabledEl.addEventListener("change", async () => {
  const nextState = {
    enabled: chaosEnabledEl.checked,
    failureRate: normalizeFailureRate(chaosRateEl.value)
  };

  try {
    await updateChaosState(nextState);
    setSaveStatus(`Chaos ${chaosState.enabled ? "enabled" : "disabled"}.`, "success");
  } catch (error) {
    chaosEnabledEl.checked = chaosState.enabled;
    const message = error instanceof Error ? error.message : "Chaos update failed";
    setSaveStatus(message, "error");
    renderChaos();
  }
});

chaosRateEl.addEventListener("change", async () => {
  const nextState = {
    enabled: chaosEnabledEl.checked,
    failureRate: normalizeFailureRate(chaosRateEl.value)
  };

  try {
    await updateChaosState(nextState);
    setSaveStatus(`Chaos rate set to ${chaosState.failureRate}%.`, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chaos update failed";
    setSaveStatus(message, "error");
    renderChaos();
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

  const debugBtn = target.closest("button[data-action='debug-log']");
  if (debugBtn instanceof HTMLButtonElement) {
    event.stopPropagation();
    const id = Number(debugBtn.dataset.logId);
    if (!features.aiEnabled || !Number.isInteger(id) || debuggingLogIds.has(id) || logDebugAnalysisById.has(id)) {
      return;
    }
    const log = (appState?.logs || []).find((entry) => Number(entry.id) === id);
    if (!log || Number(log.returnedStatusCode) < 400) {
      return;
    }
    debuggingLogIds.add(id);
    renderLogs();
    try {
      const payload = toLogDebugPayload(log);
      const analysis = await runAiDebug(payload.request, payload.response);
      logDebugAnalysisById.set(id, analysis);
      renderLogs();
    } catch (_e) {
      setSaveStatus("AI analysis failed.", "error");
    } finally {
      debuggingLogIds.delete(id);
      renderLogs();
    }
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

chatToggleBtn.addEventListener("click", () => {
  setChatOpen(!chatOpen);
});

chatCloseBtn.addEventListener("click", () => {
  setChatOpen(false);
});

chatSuggestionsEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const chip = target.closest("[data-chat-suggestion]");
  if (!(chip instanceof HTMLButtonElement)) {
    return;
  }
  const message = chip.dataset.chatSuggestion || "";
  void sendChatMessage(message);
});

chatInputEl.addEventListener("input", autoGrowChatInput);
chatInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void sendChatMessage(chatInputEl.value);
  }
});

chatSendBtn.addEventListener("click", () => {
  void sendChatMessage(chatInputEl.value);
});

/* --- Main tab listeners --- */

tabSimulatorBtn.addEventListener("click", () => setMainTab("simulator"));
tabBuilderBtn.addEventListener("click", () => setMainTab("builder"));

/* --- Builder listeners --- */

document.querySelectorAll(".builder-subtab").forEach((btn) => {
  btn.addEventListener("click", () => setBuilderSubtab(btn.dataset.subtab || "headers"));
});

builderUrlEl.addEventListener("input", () => {
  syncParamsFromUrlField();
});

builderImportCurlBtn.addEventListener("click", () => {
  curlImportInputEl.value = "";
  curlImportErrorEl.classList.add("is-hidden");
  curlImportErrorEl.textContent = "";
  openModal("curl-import");
});

curlImportConvertBtn.addEventListener("click", async () => {
  const curlText = String(curlImportInputEl.value || "").trim();
  if (!curlText) {
    curlImportErrorEl.textContent = "paste your curl command here...";
    curlImportErrorEl.classList.remove("is-hidden");
    return;
  }

  curlImportConvertBtn.disabled = true;
  curlImportConvertBtn.textContent = "Converting…";
  curlImportErrorEl.classList.add("is-hidden");
  curlImportErrorEl.textContent = "";

  try {
    const request = await runCurlImport(curlText);
    applyImportedCurlRequest(request);
    closeModals();
    setSaveStatus("Curl request imported.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse curl command";
    curlImportErrorEl.textContent = message;
    curlImportErrorEl.classList.remove("is-hidden");
  } finally {
    curlImportConvertBtn.disabled = false;
    curlImportConvertBtn.textContent = "Convert";
  }
});

builderCopyCurlBtn.addEventListener("click", async () => {
  const payload = collectBuilderPayload();
  if (!String(payload.url || "").trim()) {
    showBuilderCopyCurlTooltip("add a URL first", "error");
    setSaveStatus("Add a URL first.", "error");
    return;
  }

  builderCopyCurlBtn.disabled = true;
  const curl = buildCurlFromBuilderPayload(payload);
  try {
    await copyText(curl);
    showBuilderCopyCurlTooltip("copied");
    setSaveStatus("cURL copied to clipboard.", "success");
  } catch (_error) {
    promptManualCopy("cURL", curl);
    showBuilderCopyCurlTooltip("manual copy", "error");
    setSaveStatus("Clipboard was blocked. cURL opened for manual copy.", "error");
  } finally {
    builderCopyCurlBtn.disabled = false;
  }
});

addHeaderRowBtn.addEventListener("click", () => {
  builderHeaders.push(defaultRow());
  renderKvRows(headersRowsEl, builderHeaders, "headers");
});

addParamRowBtn.addEventListener("click", () => {
  builderParams.push(defaultRow());
  renderKvRows(paramsRowsEl, builderParams, "params");
  syncUrlFromParams();
});

addFormRowBtn.addEventListener("click", () => {
  builderFormFields.push(defaultRow());
  renderKvRows(formFieldsMountEl, builderFormFields, "form");
});

bodyFormatSelectEl.addEventListener("change", () => {
  builderBodyFormat = bodyFormatSelectEl.value === "text" || bodyFormatSelectEl.value === "form" ? bodyFormatSelectEl.value : "json";
  setBodyFormatUi();
});

bodyFormatJsonBtn.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(builderBodyTextEl.value || "{}");
    builderBodyTextEl.value = JSON.stringify(parsed, null, 2);
  } catch (_e) {
    setSaveStatus("Body is not valid JSON.", "error");
  }
});

bodyAiGenerateBtn.addEventListener("click", () => {
  if (!features.aiEnabled) {
    return;
  }
  bodyAiBarEl.classList.toggle("is-hidden");
  bodyAiErrorEl.classList.add("is-hidden");
  bodyAiErrorEl.textContent = "";
});

bodyAiSendBtn.addEventListener("click", async () => {
  if (!features.aiEnabled) {
    return;
  }
  const prompt = bodyAiPromptEl.value.trim();
  if (!prompt) {
    return;
  }
  bodyAiSpinnerEl.classList.remove("is-hidden");
  bodyAiPromptEl.disabled = true;
  bodyAiSendBtn.disabled = true;
  bodyAiErrorEl.classList.add("is-hidden");
  try {
    const ctx = `Method ${builderMethodEl.value}, URL ${builderUrlEl.value || "(empty)"}`;
    const text = await runAiGenerate(prompt, ctx);
    builderBodyTextEl.value = text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    bodyAiErrorEl.textContent = msg;
    bodyAiErrorEl.classList.remove("is-hidden");
  } finally {
    bodyAiSpinnerEl.classList.add("is-hidden");
    bodyAiPromptEl.disabled = false;
    bodyAiSendBtn.disabled = false;
  }
});

builderAuthTypeEl.addEventListener("change", syncBuilderAuthUi);

builderSendBtn.addEventListener("click", async () => {
  builderSendBtn.disabled = true;
  try {
    const payload = collectBuilderPayload();
    lastBuilderRequestPayload = payload;
    const res = await fetch("/api/builder/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Send failed (${res.status})`);
    }
    showBuilderResponse(data);
    await refreshBuilderContext();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    setSaveStatus(msg, "error");
  } finally {
    builderSendBtn.disabled = false;
  }
});

builderDebugBtn.addEventListener("click", async () => {
  if (builderDebugLoading || !features.aiEnabled) {
    return;
  }
  const status = Number(lastBuilderResponse?.status || 0);
  if (status < 400) {
    return;
  }

  const request = toBuilderDebugRequest(lastBuilderRequestPayload);
  const response = toBuilderDebugResponse(lastBuilderResponse);
  if (!request || !response) {
    setSaveStatus("Nothing to debug yet.", "error");
    return;
  }

  builderDebugLoading = true;
  renderBuilderDebugState();
  try {
    builderDebugAnalysis = await runAiDebug(request, response);
    renderBuilderDebugState();
  } catch (_error) {
    setSaveStatus("AI debug failed.", "error");
  } finally {
    builderDebugLoading = false;
    renderBuilderDebugState();
  }
});

builderSaveBtn.addEventListener("click", () => {
  if (!collections.length) {
    setSaveStatus("Create a collection first.", "error");
    return;
  }
  saveReqNameEl.value = "";
  openModal("save");
});

saveReqConfirmBtn.addEventListener("click", async () => {
  const collectionId = saveReqCollectionEl.value;
  const name = saveReqNameEl.value.trim();
  if (!collectionId || !name) {
    setSaveStatus("Collection and name are required.", "error");
    return;
  }
  const snap = collectBuilderPayload();
  const res = await fetch(`/api/collections/${encodeURIComponent(collectionId)}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      method: snap.method,
      url: snap.url,
      headers: snap.headers,
      bodyFormat: snap.bodyFormat,
      bodyText: snap.body,
      formFields: snap.formFields,
      params: snap.params,
      auth: snap.auth
    })
  });
  if (!res.ok) {
    setSaveStatus("Save failed.", "error");
    return;
  }
  closeModals();
  await refreshBuilderContext();
  setSaveStatus("Request saved.", "success");
});

envSelectEl.addEventListener("change", async () => {
  const v = envSelectEl.value;
  await setActiveEnvironment(v || null);
  updateUrlHighlight();
});

envManageBtn.addEventListener("click", () => openModal("env"));

modalBackdropEl.addEventListener("click", () => {
  if (actionModalEl && !actionModalEl.hidden && !actionModalEl.classList.contains("is-hidden")) {
    resolveActionModal(null);
    return;
  }
  closeModals();
});
document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", closeModals);
});
actionModalCloseBtn?.addEventListener("click", () => resolveActionModal(null));
actionModalCancelBtn?.addEventListener("click", () => resolveActionModal(null));
actionModalConfirmBtn?.addEventListener("click", () => {
  const value = actionModalNeedsInput ? String(actionModalInputEl?.value || "") : true;
  resolveActionModal(value);
});
actionModalInputEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    resolveActionModal(String(actionModalInputEl.value || ""));
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    resolveActionModal(null);
  }
});

newCollectionBtn.addEventListener("click", async () => {
  const name = await askPrompt({
    title: "New collection",
    message: "Create a collection to organize saved requests.",
    inputLabel: "Collection name",
    placeholder: "Smoke checks",
    confirmLabel: "Create"
  });
  if (!name) {
    return;
  }
  await fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  await refreshBuilderContext();
});

importCollectionBtn.addEventListener("click", () => importCollectionFileEl.click());

importCollectionFileEl.addEventListener("change", async () => {
  const file = importCollectionFileEl.files?.[0];
  importCollectionFileEl.value = "";
  if (!file) {
    return;
  }
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    await fetch("/api/collections/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    await refreshBuilderContext();
    setSaveStatus("Collection imported.", "success");
  } catch (_e) {
    setSaveStatus("Import failed.", "error");
  }
});

clearHistoryBtn.addEventListener("click", async () => {
  await fetch("/api/builder/history/clear", { method: "POST" });
  await refreshBuilderContext();
});

collectionsMountEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const headBtn = target.closest("button[data-action='toggle-col']");
  if (headBtn) {
    const block = headBtn.closest(".collection-block");
    const id = block?.getAttribute("data-collection-id");
    if (!id) {
      return;
    }
    if (expandedCollectionIds.has(id)) {
      expandedCollectionIds.delete(id);
    } else {
      expandedCollectionIds.add(id);
    }
    renderCollections();
    return;
  }

  const exportBtn = target.closest("button[data-action='export-col']");
  if (exportBtn) {
    const block = exportBtn.closest(".collection-block");
    const id = block?.getAttribute("data-collection-id");
    const col = collections.find((c) => c.id === id);
    if (!col) {
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          {
            name: col.name,
            requests: (col.requests || []).map((r) => ({
              name: r.name,
              method: r.method,
              url: r.url,
              headers: r.headers,
              bodyFormat: r.bodyFormat,
              bodyText: r.bodyText,
              formFields: r.formFields,
              params: r.params,
              auth: r.auth
            }))
          },
          null,
          2
        )
      ],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "collection.json";
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  const deleteCol = target.closest("button[data-action='delete-col']");
  if (deleteCol) {
    const block = deleteCol.closest(".collection-block");
    const id = block?.getAttribute("data-collection-id");
    if (!id) {
      return;
    }
    const confirmed = await askConfirm({
      title: "Delete collection?",
      message: "All requests inside this collection will be removed.",
      confirmLabel: "Delete",
      tone: "danger"
    });
    if (!confirmed) {
      return;
    }
    await fetch(`/api/collections/${encodeURIComponent(id)}`, { method: "DELETE" });
    await refreshBuilderContext();
    return;
  }

  const runReq = target.closest("button[data-action='run-req']");
  if (runReq) {
    const row = runReq.closest(".collection-item");
    const cid = row?.getAttribute("data-collection-id");
    const rid = row?.getAttribute("data-request-id");
    if (!cid || !rid) {
      return;
    }
    const col = collections.find((c) => c.id === cid);
    const req = col?.requests?.find((r) => r.id === rid);
    const res = await fetch(`/api/collections/${encodeURIComponent(cid)}/requests/${encodeURIComponent(rid)}/run`, {
      method: "POST"
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveStatus(data.error || "Run failed.", "error");
      return;
    }
    const requestBody = {
      method: req?.method || "GET",
      url: req?.url || "",
      headers: req?.headers || [],
      body: req?.bodyText || "",
      bodyFormat: req?.bodyFormat || "json",
      formFields: req?.formFields || [],
      params: req?.params || [],
      auth: req?.auth || { type: "NONE" }
    };
    lastBuilderRequestPayload = requestBody;
    showBuilderResponse(data);
    return;
  }

  const editReq = target.closest("button[data-action='edit-req']");
  if (editReq) {
    const row = editReq.closest(".collection-item");
    const cid = row?.getAttribute("data-collection-id");
    const rid = row?.getAttribute("data-request-id");
    const col = collections.find((c) => c.id === cid);
    const req = col?.requests?.find((r) => r.id === rid);
    if (!req) {
      return;
    }
    applyBuilderSnapshot({
      method: req.method,
      url: req.url,
      headers: req.headers,
      params: req.params,
      bodyFormat: req.bodyFormat,
      bodyText: req.bodyText,
      formFields: req.formFields,
      auth: req.auth
    });
    return;
  }

  const generateTestsBtn = target.closest("button[data-action='generate-tests']");
  if (generateTestsBtn) {
    const row = generateTestsBtn.closest(".collection-item");
    const cid = row?.getAttribute("data-collection-id");
    const rid = row?.getAttribute("data-request-id");
    const col = collections.find((c) => c.id === cid);
    const req = col?.requests?.find((r) => r.id === rid);
    if (!req) {
      return;
    }
    generatingTestsRequestId = req.id;
    renderCollections();
    try {
      const tests = await runGenerateTests(req);
      generatedTestsPreview = tests;
      generatedTestsSourceName = req.name || "Request";
      expandedGeneratedTests.clear();
      openModal("tests-preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate tests";
      showToast(message, "error");
    } finally {
      generatingTestsRequestId = null;
      renderCollections();
    }
    return;
  }

  const deleteReq = target.closest("button[data-action='delete-req']");
  if (deleteReq) {
    const row = deleteReq.closest(".collection-item");
    const cid = row?.getAttribute("data-collection-id");
    const rid = row?.getAttribute("data-request-id");
    if (!cid || !rid) {
      return;
    }
    const confirmed = await askConfirm({
      title: "Delete saved request?",
      message: "This request will be removed from the collection.",
      confirmLabel: "Delete",
      tone: "danger"
    });
    if (!confirmed) {
      return;
    }
    await fetch(`/api/collections/${encodeURIComponent(cid)}/requests/${encodeURIComponent(rid)}`, { method: "DELETE" });
    await refreshBuilderContext();
  }
});

testsPreviewListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const toggleBtn = target.closest("button[data-action='toggle-generated-test']");
  if (!(toggleBtn instanceof HTMLButtonElement)) {
    return;
  }
  const id = toggleBtn.dataset.testId;
  if (!id) {
    return;
  }
  if (expandedGeneratedTests.has(id)) {
    expandedGeneratedTests.delete(id);
  } else {
    expandedGeneratedTests.add(id);
  }
  renderGeneratedTestsPreview();
});

testsPreviewSaveBtn.addEventListener("click", async () => {
  if (!generatedTestsPreview.length) {
    showToast("No generated tests to save.", "error");
    return;
  }

  const collectionId = testsPreviewCollectionEl.value || "new";
  testsPreviewSaveBtn.disabled = true;
  try {
    const res = await fetch("/api/ai/generate-tests/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionId,
        tests: generatedTestsPreview,
        sourceRequestName: generatedTestsSourceName
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save generated tests");
    }
    const count = Number(data.saved || 0);
    closeModals();
    await refreshBuilderContext();
    const name =
      collectionId === "new"
        ? data.collectionName || `${generatedTestsSourceName || "Request"} Tests`
        : collections.find((c) => c.id === collectionId)?.name || data.collectionName || "collection";
    showToast(`${count} tests saved to ${name}`, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save generated tests";
    showToast(message, "error");
  } finally {
    testsPreviewSaveBtn.disabled = false;
  }
});

testsPreviewCancelBtn.addEventListener("click", () => {
  closeModals();
});

builderHistoryMountEl.addEventListener("click", (event) => {
  const item = event.target instanceof HTMLElement ? event.target.closest(".history-item") : null;
  if (!item) {
    return;
  }
  const id = item.getAttribute("data-history-id");
  const entry = builderHistory.find((h) => h.id === id);
  if (!entry) {
    return;
  }
  applyBuilderSnapshot({
    method: entry.method,
    url: entry.url,
    headers: entry.headers,
    params: entry.params,
    bodyFormat: entry.bodyFormat,
    bodyText: entry.bodyText,
    formFields: entry.formFields,
    auth: entry.auth
  });
});

respCopyBtn.addEventListener("click", async () => {
  if (!lastBuilderResponse) {
    return;
  }
  let prettyBody = lastBuilderResponse.body || "";
  try {
    prettyBody = JSON.stringify(JSON.parse(prettyBody), null, 2);
  } catch (_e) {
    // keep
  }
  try {
    await copyText(prettyBody);
    setSaveStatus("Response body copied.", "success");
  } catch (_error) {
    promptManualCopy("response body", prettyBody);
    setSaveStatus("Clipboard was blocked. Response body opened for manual copy.", "error");
  }
});

document.querySelectorAll(".resp-subtab").forEach((btn) => {
  btn.addEventListener("click", () => setRespSubtab(btn.dataset.resptab || "body"));
});

newEnvBtn.addEventListener("click", async () => {
  const name = await openEnvPrompt();
  if (!name || !name.trim()) {
    return;
  }
  await fetch("/api/environments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() })
  });
  await refreshBuilderContext();
  renderEnvModalList();
});

envListMountEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const pick = target.closest("button[data-action='pick-env']");
  if (pick) {
    const item = pick.closest(".env-item");
    const id = item?.getAttribute("data-env-id");
    if (!id) {
      return;
    }
    selectedEnvEditId = id;
    envListMountEl.querySelectorAll(".env-item").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-env-id") === id);
    });
    await loadEnvDetail(id);
    return;
  }
  const del = target.closest("button[data-action='delete-env']");
  if (del) {
    const item = del.closest(".env-item");
    const id = item?.getAttribute("data-env-id");
    if (!id) {
      return;
    }
    const confirmed = await askConfirm({
      title: "Delete environment?",
      message: "Variables in this environment will be permanently removed.",
      confirmLabel: "Delete",
      tone: "danger"
    });
    if (!confirmed) {
      return;
    }
    await fetch(`/api/environments/${encodeURIComponent(id)}`, { method: "DELETE" });
    selectedEnvEditId = null;
    await refreshBuilderContext();
    renderEnvModalList();
  }
});

addEnvVarRowBtn.addEventListener("click", () => {
  envVarDraft.push({ key: "", value: "", secret: false });
  renderEnvVarRows();
});

envPromptCloseBtn?.addEventListener("click", () => closeEnvPrompt());
envPromptCancelBtn?.addEventListener("click", () => closeEnvPrompt());
envPromptConfirmBtn?.addEventListener("click", () => closeEnvPrompt(envPromptInputEl?.value.trim() || ""));
envPromptInputEl?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    closeEnvPrompt(envPromptInputEl?.value.trim() || "");
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeEnvPrompt();
  }
});

saveEnvVarsBtn.addEventListener("click", async () => {
  if (!selectedEnvEditId) {
    return;
  }
  const res = await fetch(`/api/environments/${encodeURIComponent(selectedEnvEditId)}/variables`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variables: envVarDraft })
  });
  if (!res.ok) {
    setSaveStatus("Failed to save variables.", "error");
    return;
  }
  await refreshBuilderContext();
  closeModals();
  setSaveStatus("Environment variables saved.", "success");
});

simAiGenerateBtn.addEventListener("click", async () => {
  if (!features.aiEnabled) {
    return;
  }
  const ctx = `Endpoint: ${selectedEndpoint}, auth: ${fields.authType.value}`;
  const prompt = "Generate a realistic JSON response body for this webhook simulator endpoint.";
  simAiGenerateBtn.disabled = true;
  try {
    const text = await runAiGenerate(prompt, ctx);
    fields.responseBody.value = text;
    markCurrentEndpointDirty();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI error";
    setSaveStatus(msg, "error");
  } finally {
    simAiGenerateBtn.disabled = false;
    syncAiUi();
  }
});

onboardingSkipBtn?.addEventListener("click", () => stopOnboarding(false));
onboardingReplayBtn?.addEventListener("click", () => {
  startOnboarding(true);
});
onboardingPrevBtn?.addEventListener("click", () => {
  onboardingStepIndex = Math.max(0, onboardingStepIndex - 1);
  renderOnboardingStep();
});
onboardingNextBtn?.addEventListener("click", () => {
  if (onboardingStepIndex >= onboardingSteps.length - 1) {
    stopOnboarding(true);
    return;
  }
  onboardingStepIndex += 1;
  renderOnboardingStep();
});

document.addEventListener("keydown", (event) => {
  if (onboardingActive) {
    if (event.key === "Escape") {
      event.preventDefault();
      stopOnboarding(false);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onboardingNextBtn?.click();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onboardingPrevBtn?.click();
      return;
    }
  }

  if (!actionModalEl?.hidden && event.key === "Escape") {
    event.preventDefault();
    resolveActionModal(null);
    return;
  }

  if (!actionModalEl?.hidden && event.key === "Enter" && !actionModalNeedsInput) {
    event.preventDefault();
    actionModalConfirmBtn?.click();
  }
});

async function bootstrap() {
  try {
    await fetchFeatures();
    await pollStateOnce();
    setSaveStatus("", "info");
  } catch (_error) {
    setSaveStatus("Failed to load app state.", "error");
  }

  setMainTab(getMainTab());
  renderKvRows(headersRowsEl, builderHeaders, "headers");
  renderKvRows(paramsRowsEl, builderParams, "params");
  renderKvRows(formFieldsMountEl, builderFormFields, "form");
  setBuilderSubtab("headers");
  setBodyFormatUi();
  syncBuilderAuthUi();
  autoGrowChatInput();
  renderChatMessages();
  setTimeout(startOnboardingIfNeeded, 280);
}

bootstrap();
void connectStateEvents();
