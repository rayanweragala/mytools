#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/dev.pid"
LOG_FILE="$RUN_DIR/dev.log"
NPM_STAMP_FILE="$RUN_DIR/npm-install.stamp"

usage() {
  cat <<'USAGE'
Usage: scripts/devctl.sh <command>

Commands:
  start     Install dependencies if needed, then run dev server in background
  stop      Stop background dev server
  restart   Restart background dev server
  status    Show whether background dev server is running
  logs      Tail background dev server logs
USAGE
}

ensure_npm_available() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "Error: npm is not installed or not on PATH." >&2
    exit 1
  fi
}

is_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

install_deps_if_needed() {
  mkdir -p "$RUN_DIR"

  local needs_install="false"

  if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    needs_install="true"
  fi

  if [[ ! -f "$NPM_STAMP_FILE" ]]; then
    needs_install="true"
  fi

  if [[ -f "$ROOT_DIR/package-lock.json" && "$ROOT_DIR/package-lock.json" -nt "$NPM_STAMP_FILE" ]]; then
    needs_install="true"
  fi

  if [[ "$ROOT_DIR/package.json" -nt "$NPM_STAMP_FILE" ]]; then
    needs_install="true"
  fi

  if [[ "$needs_install" == "true" ]]; then
    echo "Installing dependencies..."
    (
      cd "$ROOT_DIR"
      npm install
    )
    touch "$NPM_STAMP_FILE"
  fi
}

start_server() {
  ensure_npm_available

  if is_running; then
    echo "Dev server is already running (PID $(cat "$PID_FILE"))."
    echo "Logs: $LOG_FILE"
    return 0
  fi

  rm -f "$PID_FILE"
  install_deps_if_needed
  mkdir -p "$RUN_DIR"
  touch "$LOG_FILE"

  echo "Starting dev server in background..."
  (
    cd "$ROOT_DIR"
    nohup npm run dev >>"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )

  sleep 1

  if is_running; then
    echo "Dev server started (PID $(cat "$PID_FILE"))."
    echo "Open: http://localhost:8787"
    echo "Logs: $LOG_FILE"
    return 0
  fi

  echo "Failed to start dev server. Recent logs:" >&2
  tail -n 50 "$LOG_FILE" >&2 || true
  exit 1
}

stop_server() {
  if ! [[ -f "$PID_FILE" ]]; then
    echo "Dev server is not running."
    return 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"

  if [[ -z "$pid" ]]; then
    rm -f "$PID_FILE"
    echo "Dev server is not running."
    return 0
  fi

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    rm -f "$PID_FILE"
    echo "Dev server is not running."
    return 0
  fi

  echo "Stopping dev server (PID $pid)..."
  kill "$pid" >/dev/null 2>&1 || true

  for _ in {1..20}; do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      rm -f "$PID_FILE"
      echo "Dev server stopped."
      return 0
    fi
    sleep 0.25
  done

  echo "Process did not stop gracefully; force killing..."
  kill -9 "$pid" >/dev/null 2>&1 || true
  rm -f "$PID_FILE"
  echo "Dev server stopped."
}

status_server() {
  if is_running; then
    echo "Dev server is running (PID $(cat "$PID_FILE"))."
    echo "Logs: $LOG_FILE"
  else
    echo "Dev server is not running."
    return 1
  fi
}

tail_logs() {
  if [[ ! -f "$LOG_FILE" ]]; then
    echo "No logs yet. Start the server first."
    return 0
  fi
  tail -n 200 -f "$LOG_FILE"
}

command="${1:-}"
case "$command" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  restart)
    stop_server
    start_server
    ;;
  status)
    status_server
    ;;
  logs)
    tail_logs
    ;;
  *)
    usage
    exit 1
    ;;
esac
