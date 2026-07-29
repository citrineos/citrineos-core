# ============================================================================
# FILE: apps/mock-msp/scripts/demo-lib.sh
# Shared helpers for demo-up.sh / demo-down.sh. Sourced, never executed.
#
# Windows/git-bash notes that drive the design here (all verified empirically):
#   * bash's $! is an MSYS-internal pid, NOT the Windows pid. For `node x.js &`
#     bash reported 11775 while node's own process.pid was 39664. taskkill only
#     understands the Windows pid, so the pid file MUST store the pid resolved
#     from netstat, never $!.
#   * `netstat -ano | grep :8083` matches BOTH the listening server and every
#     client connected to it. A browser with the dashboard open shows up as a
#     chrome.exe row on port 8083 -- killing that pid would kill the demo
#     operator's browser. We therefore match LISTENING rows only, on the LOCAL
#     address column, and refuse to kill any pid that is not node.exe.
#   * `tasklist //FI "PID eq <gone>"` prints "INFO: No tasks..." on STDOUT, so
#     image_of() only accepts CSV rows (which start with a double quote).
# ============================================================================

PORT="${MOCK_MSP_PORT:-8083}"
PID_FILE="${MSP_PID_FILE:-/tmp/demo-msp.pid}"
LOG_FILE="${MSP_LOG_FILE:-/tmp/demo-msp.log}"

say() { printf '  %s\n' "$*"; }
step() { printf '\n[%s] %s\n' "$1" "$2"; }
warn() { printf '  ! %s\n' "$*" >&2; }
ok() { printf '  + %s\n' "$*"; }

# One-line terminal verdicts. Every exit path goes through one of these.
die() {
  printf '\nFAILURE: %s\n' "$*" >&2
  exit 1
}
succeed() {
  printf '\nSUCCESS: %s\n' "$*"
  exit 0
}

# --- process / port helpers -------------------------------------------------

# Windows image name for a pid, or empty if the pid is not alive.
image_of() {
  tasklist //FI "PID eq $1" //FO CSV //NH 2>/dev/null |
    grep -E '^"' | head -1 | sed 's/^"//; s/",.*//'
}

# Windows pid(s) LISTENING on $PORT. Local-address column only, so clients
# connected *to* the port (browsers, curl) are never returned.
listener_pids() {
  netstat -ano 2>/dev/null |
    awk -v want=":${PORT}\$" '$1=="TCP" && $2 ~ want && $4=="LISTENING" {print $5}' |
    grep -E '^[0-9]+$' | grep -v '^0$' | sort -u
}

# Kill a pid only if it is really a node process. Returns non-zero and kills
# nothing if the pid belongs to anything else (guards against pid reuse and
# against the stale-pid-file case).
kill_node_pid() {
  local pid="$1" img
  img="$(image_of "$pid")"
  case "$img" in
    '')
      say "pid $pid is already gone"
      return 0
      ;;
    node.exe)
      if taskkill //F //PID "$pid" >/dev/null 2>&1; then
        ok "killed node.exe pid $pid"
        return 0
      fi
      warn "taskkill failed for pid $pid"
      return 1
      ;;
    *)
      warn "refusing to kill pid $pid: it is '$img', not node.exe"
      return 1
      ;;
  esac
}

# Stop whatever is listening on $PORT and wait for the socket to be released.
# Safe to call when nothing is running (idempotent).
free_port() {
  local pids p i
  pids="$(listener_pids)"

  if [ -z "$pids" ]; then
    say "nothing listening on :$PORT"
  else
    for p in $pids; do
      say "port :$PORT held by pid $p ($(image_of "$p"))"
      kill_node_pid "$p" || die "could not free port :$PORT (pid $p). Stop it by hand and re-run."
    done
    for i in $(seq 1 40); do
      [ -z "$(listener_pids)" ] && break
      sleep 0.25
    done
    [ -n "$(listener_pids)" ] && die "port :$PORT still held after taskkill"
    ok "port :$PORT released"
  fi

  # The pid file is advisory only; reconcile it rather than trusting it.
  if [ -f "$PID_FILE" ]; then
    local stale img
    stale="$(tr -dc '0-9' <"$PID_FILE")"
    if [ -n "$stale" ]; then
      img="$(image_of "$stale")"
      if [ "$img" = "node.exe" ]; then
        say "pid file $PID_FILE points at live node.exe $stale (not listening) - stopping it"
        kill_node_pid "$stale" || true
      elif [ -n "$img" ]; then
        # Exactly the stale-pid-reuse trap: do NOT kill it.
        warn "pid file $PID_FILE holds $stale which is now '$img' - ignoring (not killing)"
      fi
    fi
    rm -f "$PID_FILE"
  fi
  return 0
}
