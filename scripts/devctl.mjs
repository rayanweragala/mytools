#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const RUN_DIR = path.join(ROOT_DIR, ".run");
const PID_FILE = path.join(RUN_DIR, "dev.pid");
const LOG_FILE = path.join(RUN_DIR, "dev.log");
const NPM_STAMP_FILE = path.join(RUN_DIR, "npm-install.stamp");
const DEV_BASE_URL = process.env.DEV_BASE_URL || "http://localhost:8787";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function usage() {
  console.log(`Usage: node scripts/devctl.mjs <command>

Commands:
  start     Install dependencies if needed, then run dev server in background
  stop      Stop background dev server
  restart   Restart background dev server
  status    Show whether background dev server is running
  logs      Tail background dev server logs`);
}

function ensureRunDir() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
}

function readPid() {
  if (!fs.existsSync(PID_FILE)) {
    return null;
  }
  const raw = fs.readFileSync(PID_FILE, "utf8").trim();
  const pid = Number.parseInt(raw, 10);
  if (!Number.isFinite(pid) || pid <= 0) {
    return null;
  }
  return pid;
}

function isRunningPid(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (_error) {
    return false;
  }
}

function isRunning() {
  const pid = readPid();
  return pid ? isRunningPid(pid) : false;
}

function checkNpmAvailable() {
  const check = spawnSync(npmCmd, ["--version"], { stdio: "ignore" });
  if (check.status !== 0) {
    console.error("Error: npm is not installed or not on PATH.");
    process.exit(1);
  }
}

function needsInstall() {
  const nodeModules = path.join(ROOT_DIR, "node_modules");
  const packageJson = path.join(ROOT_DIR, "package.json");
  const packageLock = path.join(ROOT_DIR, "package-lock.json");

  if (!fs.existsSync(nodeModules)) {
    return true;
  }
  if (!fs.existsSync(NPM_STAMP_FILE)) {
    return true;
  }

  const stampMtime = fs.statSync(NPM_STAMP_FILE).mtimeMs;
  if (fs.existsSync(packageJson) && fs.statSync(packageJson).mtimeMs > stampMtime) {
    return true;
  }
  if (fs.existsSync(packageLock) && fs.statSync(packageLock).mtimeMs > stampMtime) {
    return true;
  }
  return false;
}

function installDepsIfNeeded() {
  ensureRunDir();
  if (!needsInstall()) {
    return;
  }

  console.log("Installing dependencies...");
  const install = spawnSync(npmCmd, ["install"], {
    cwd: ROOT_DIR,
    stdio: "inherit"
  });
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
  fs.writeFileSync(NPM_STAMP_FILE, `${Date.now()}\n`, "utf8");
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeHealth() {
  try {
    const response = await fetchWithTimeout(`${DEV_BASE_URL}/health`, 1500);
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function probeEventsRoute() {
  try {
    const response = await fetchWithTimeout(`${DEV_BASE_URL}/api/events`, 1500);
    const contentType = response.headers.get("content-type") || "";
    return response.status === 200 && contentType.toLowerCase().includes("text/event-stream");
  } catch (_error) {
    return false;
  }
}

async function waitForHealthyServer(maxAttempts = 12, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i += 1) {
    if (await probeHealth()) {
      return true;
    }
    await waitMs(delayMs);
  }
  return false;
}

async function startServer() {
  checkNpmAvailable();

  if (isRunning()) {
    console.log(`Dev server is already running (PID ${readPid()}).`);
    const hasEvents = await probeEventsRoute();
    if (!hasEvents) {
      console.log("Warning: running server does not expose /api/events.");
      console.log("Run `npm run worker:restart` to load the latest code.");
    }
    console.log(`Logs: ${LOG_FILE}`);
    return;
  }

  ensureRunDir();
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }

  installDepsIfNeeded();

  const logFd = fs.openSync(LOG_FILE, "a");
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    windowsHide: true
  });
  child.unref();
  fs.closeSync(logFd);
  fs.writeFileSync(PID_FILE, `${child.pid}\n`, "utf8");

  await waitMs(800);

  const childAlive = isRunningPid(child.pid);
  const healthy = await waitForHealthyServer();
  if (childAlive && healthy) {
    const hasEvents = await probeEventsRoute();
    console.log(`Dev server started (PID ${child.pid}).`);
    console.log("Open: http://localhost:8787");
    if (!hasEvents) {
      console.log("Warning: /api/events is unavailable (expected 200 text/event-stream).");
      console.log("If this persists, run `npm run worker:restart`.");
    }
    console.log(`Logs: ${LOG_FILE}`);
    return;
  }

  try {
    fs.unlinkSync(PID_FILE);
  } catch (_error) {
    // ignore
  }

  console.error("Failed to start dev server. Recent logs:");
  printLogTail(50);
  process.exit(1);
}

function runTaskkill(pid, force) {
  const args = ["/PID", String(pid), "/T"];
  if (force) {
    args.push("/F");
  }
  spawnSync("taskkill", args, { stdio: "ignore" });
}

async function stopServer() {
  const pid = readPid();
  if (!pid) {
    console.log("Dev server is not running.");
    return;
  }

  if (!isRunningPid(pid)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch (_error) {
      // ignore
    }
    console.log("Dev server is not running.");
    return;
  }

  console.log(`Stopping dev server (PID ${pid})...`);
  if (process.platform === "win32") {
    runTaskkill(pid, false);
  } else {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_error) {
      // ignore
    }
  }

  for (let i = 0; i < 20; i += 1) {
    if (!isRunningPid(pid)) {
      try {
        fs.unlinkSync(PID_FILE);
      } catch (_error) {
        // ignore
      }
      console.log("Dev server stopped.");
      return;
    }
    await waitMs(250);
  }

  console.log("Process did not stop gracefully; force killing...");
  if (process.platform === "win32") {
    runTaskkill(pid, true);
  } else {
    try {
      process.kill(pid, "SIGKILL");
    } catch (_error) {
      // ignore
    }
  }

  try {
    fs.unlinkSync(PID_FILE);
  } catch (_error) {
    // ignore
  }
  console.log("Dev server stopped.");
}

function statusServer() {
  const pid = readPid();
  if (pid && isRunningPid(pid)) {
    console.log(`Dev server is running (PID ${pid}).`);
    console.log(`Logs: ${LOG_FILE}`);
    return;
  }
  console.log("Dev server is not running.");
  process.exitCode = 1;
}

function printLogTail(lineCount = 200) {
  if (!fs.existsSync(LOG_FILE)) {
    console.log("No logs yet. Start the server first.");
    return;
  }

  const content = fs.readFileSync(LOG_FILE, "utf8");
  const lines = content.split(/\r?\n/);
  const start = Math.max(0, lines.length - lineCount - 1);
  const tail = lines.slice(start).join("\n");
  if (tail.trim()) {
    process.stdout.write(`${tail}${tail.endsWith("\n") ? "" : "\n"}`);
  }
}

function tailLogs() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log("No logs yet. Start the server first.");
    return;
  }

  printLogTail(200);
  let position = fs.statSync(LOG_FILE).size;
  console.log("--- following logs (Ctrl+C to stop) ---");

  const timer = setInterval(() => {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }

    const size = fs.statSync(LOG_FILE).size;
    if (size < position) {
      position = 0;
    }
    if (size === position) {
      return;
    }

    const stream = fs.createReadStream(LOG_FILE, { start: position, end: size - 1, encoding: "utf8" });
    stream.on("data", (chunk) => process.stdout.write(chunk));
    stream.on("end", () => {
      position = size;
    });
  }, 500);

  process.on("SIGINT", () => {
    clearInterval(timer);
    process.exit(0);
  });
}

async function main() {
  const command = process.argv[2] || "";

  switch (command) {
    case "start":
      await startServer();
      break;
    case "stop":
      await stopServer();
      break;
    case "restart":
      await stopServer();
      await startServer();
      break;
    case "status":
      statusServer();
      break;
    case "logs":
      tailLogs();
      break;
    default:
      usage();
      process.exit(1);
  }
}

await main();
