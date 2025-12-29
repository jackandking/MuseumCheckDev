#!/usr/bin/env bash
# Verify remote everyone-achievements.html via curl and compare to local file
# Usage: ./tools/verify_everyone_with_curl.sh <remote_url> <local_path>
set -euo pipefail
remote_url=${1:-"https://animated-parakeet-j7xj7xp46v2q7px-8080.app.github.dev/everyone-achievements.html"}
local_path=${2:-"everyone-achievements.html"}

tmpfile=$(mktemp /tmp/remote_everyne.XXXXXX.html)
trap 'rm -f "$tmpfile"' EXIT

echo "Fetching: $remote_url"
# Follow redirects, show status, save headers
status_code=$(curl -sSL -w "%{http_code}" -o "$tmpfile" "$remote_url")
if [[ "$status_code" != "200" ]]; then
  echo "ERROR: HTTP $status_code when fetching $remote_url"
  exit 2
fi

ctype=$(file --mime-type -b "$tmpfile" || echo "unknown")
echo "Fetched OK (content-type: $ctype). Saved to $tmpfile"

if [[ ! -f "$local_path" ]]; then
  echo "Local file $local_path not found. Saving remote copy to $local_path.remote"
  mv "$tmpfile" "$local_path.remote"
  echo "Saved as $local_path.remote"
  exit 0
fi

# Compare ignoring whitespace differences at line endings
if command -v diff >/dev/null 2>&1; then
  echo "Comparing with local: $local_path"
  if diff -u --strip-trailing-cr "$local_path" "$tmpfile" >/dev/null 2>&1; then
    echo "OK: remote and local are identical (ignoring CR)."
    exit 0
  else
    echo "DIFFER: remote and local differ. Showing unified diff:\n"
    diff -u --strip-trailing-cr "$local_path" "$tmpfile" || true
    exit 1
  fi
else
  echo "diff command not available; cannot compare. Remote saved to $tmpfile"
  exit 3
fi
