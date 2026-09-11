#!/usr/bin/env python3
"""
Purge Tencent CDN cache for the given URLs after a deploy.

Why: museumcheck.cn is fronted by Tencent CDN, which serves static assets
(js/*.js, css/*.css, *.html) with `Cache-Control: immutable, max-age=2592000`.
Bumping the `?v=` version param works around this, but during the SSH deploy
write-window the CDN can fetch a *new* version key while the origin still has
the old file and pin the stale bytes for 30 days. A post-deploy cache purge
removes that race entirely.

Usage:
    python3 purge-cdn-cache.py < urls.txt        # one full URL per line
    python3 purge-cdn-cache.py https://museumcheck.cn/js/x.js ...
    python3 purge-cdn-cache.py --paths /js/ /css/ /museum-checkin.html ...

Note on cache keys: our assets are versioned with ?v=, so the CDN caches each
variant under a distinct URL. Purging by PATH (--paths /js/ /css/) is the
reliable way to clear every ?v= variant at once. Use URL mode for precision.

Credentials (Tencent Cloud API):
    TENCENT_SECRET_ID   - repo secret (required to actually purge)
    TENCENT_SECRET_KEY  - repo secret
If either is missing the script is a no-op (exit 0) so it never breaks a deploy.

Implements Tencent Cloud API 3.0 TC3-HMAC-SHA256 signing (cdn / PurgeUrlsCache
or PurgePathCache).
"""
import sys
import os
import json
import hmac
import hashlib
import datetime
import urllib.request

HOST = "cdn.tencentcloudapi.com"
SERVICE = "cdn"
VERSION = "2018-06-06"
ALGORITHM = "TC3-HMAC-SHA256"
BATCH = 500  # Tencent allows up to 1000 URLs per request; stay safe.


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _hmac_sha256(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def _sign(secret_id: str, secret_key: str, payload: str, timestamp: int) -> str:
    # 1. Canonical request
    canonical_headers = "content-type:application/json; charset=utf-8\nhost:%s\n" % HOST
    signed_headers = "content-type;host"
    hashed_payload = _sha256_hex(payload.encode("utf-8"))
    canonical_request = "\n".join([
        "POST",
        "/",
        "",
        canonical_headers,
        signed_headers,
        hashed_payload,
    ])

    # 2. String to sign
    date = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc).strftime("%Y-%m-%d")
    credential_scope = "/".join([date, SERVICE, "tc3_request"])
    string_to_sign = "\n".join([
        ALGORITHM,
        str(timestamp),
        credential_scope,
        _sha256_hex(canonical_request.encode("utf-8")),
    ])

    # 3. Signature
    secret_date = _hmac_sha256(("TC3" + secret_key).encode("utf-8"), date)
    secret_service = _hmac_sha256(secret_date, SERVICE)
    secret_signing = _hmac_sha256(secret_service, "tc3_request")
    signature = hmac.new(secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    # 4. Authorization header
    authorization = (
        "%s Credential=%s/%s, SignedHeaders=%s, Signature=%s"
        % (ALGORITHM, secret_id, credential_scope, signed_headers, signature)
    )
    return authorization


def _purge_batch(items, secret_id, secret_key, by_path=False):
    timestamp = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    action = "PurgePathCache" if by_path else "PurgeUrlsCache"
    if by_path:
        payload = json.dumps({"Paths": items, "Area": "mainland"})
    else:
        payload = json.dumps({"Urls": items, "Area": "mainland", "UrlEncode": "0"})
    authorization = _sign(secret_id, secret_key, payload, timestamp)
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json; charset=utf-8",
        "Host": HOST,
        "X-TC-Action": action,
        "X-TC-Timestamp": str(timestamp),
        "X-TC-Version": VERSION,
    }
    req = urllib.request.Request(
        "https://%s/" % HOST, data=payload.encode("utf-8"), headers=headers, method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body)


def main():
    secret_id = os.environ.get("TENCENT_SECRET_ID", "")
    secret_key = os.environ.get("TENCENT_SECRET_KEY", "")

    if not secret_id or not secret_key:
        print("[cdn-purge] No TENCENT_SECRET_ID/TENCENT_SECRET_KEY set -> skipping (deploy continues).")
        return 0

    args = sys.argv[1:]
    by_path = "--paths" in args
    items = [a for a in args if a != "--paths" and (a.startswith("http") or a.startswith("/") or a.startswith("./"))]

    # If no args, read from stdin
    if not items:
        for line in sys.stdin:
            line = line.strip()
            if line.startswith("http") or line.startswith("/"):
                items.append(line)

    if not items:
        print("[cdn-purge] No URLs/paths provided -> nothing to purge.")
        return 0

    label = "path(s)" if by_path else "URL(s)"
    print("[cdn-purge] Purging %d %s from Tencent CDN (by_path=%s)..." % (len(items), label, by_path))
    ok = True
    for i in range(0, len(items), BATCH):
        batch = items[i:i + BATCH]
        try:
            res = _purge_batch(batch, secret_id, secret_key, by_path=by_path)
            if res.get("Response", {}).get("Error"):
                print("[cdn-purge] ERROR batch %d: %s" % (i // BATCH, res["Response"]["Error"]))
                ok = False
            else:
                task_id = res.get("Response", {}).get("TaskId", "?")
                print("[cdn-purge] batch %d accepted (TaskId=%s)" % (i // BATCH, task_id))
        except Exception as e:  # noqa: BLE001
            print("[cdn-purge] EXCEPTION batch %d: %s" % (i // BATCH, e))
            ok = False

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
