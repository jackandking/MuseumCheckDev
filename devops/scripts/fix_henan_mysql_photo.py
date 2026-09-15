#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""补河南博物院 MySQL museums 行漏掉的自托管馆照（2026-09-15）。
复用 supplement_museum_template.py 的 mysql_photo 逻辑：只换 imageUrl，
visitorCount 走 inverse 变换 + round-trip 校验，不符则跳过绝不硬写。
"""
import json, time, urllib.parse, urllib.request

BASE = "https://museumcheck.cn"
YEAR = 2026
NAME = "河南博物院"
IMG_MUSEUM = "https://museumcheck.cn/images/henan-museum-photo-v1.jpg"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}


def http_json(url, data=None, headers=None, method="GET", timeout=60):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode())


def main():
    st0, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    if not row:
        print("! MySQL row not found:", NAME); return 1
    old_img = row.get("imageUrl")
    print("row found:", row.get("dedupeKey"), "| old imageUrl:", old_img)
    if old_img == IMG_MUSEUM:
        print("already self-hosted, nothing to do"); return 0
    vc = row.get("visitorCount"); inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"! visitorCount round-trip unsafe ({vc}); 跳过补照"); return 1
    rec = dict(row); rec["imageUrl"] = IMG_MUSEUM; rec["visitorCount"] = inv
    st, body = http_json(f"{BASE}/api/museums/ingest",
                         data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    print("ingest status:", st, str(body)[:120])
    time.sleep(1)
    st2, d2 = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=3&_cb={int(time.time()*1000)}")
    r2 = next((x for x in d2.get("museums", []) if x.get("name") == NAME), None)
    ok = r2 and r2.get("imageUrl") == IMG_MUSEUM
    print("verify imageUrl:", r2.get("imageUrl") if r2 else None, "| visitorCount readback:", r2.get("visitorCount") if r2 else None)
    print("RESULT:", "OK" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
