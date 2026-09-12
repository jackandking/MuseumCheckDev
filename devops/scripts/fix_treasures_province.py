#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复迁移脚本写错的 museum_treasures 省份：原迁移用 city 当 province，
把自托管图写进了孤儿行（如 镇江_镇江博物馆），而站点实际读取的
江苏省_镇江博物馆 等行仍是旧热链。本脚本用显式 museumDedupeKey 直接
upsert 正确的行，从 KV 读取已经自托管的 URL（不再下载）。
"""
import json, urllib.request, urllib.parse

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# 正确的 dedupe key（与原补馆脚本一致：省_馆名）
TARGETS = [
    ("zhenjiang-museum",      "江苏省_镇江博物馆",      "镇江博物馆"),
    ("lanzhou-museum",        "甘肃省_甘肃省博物馆",    "甘肃省博物馆"),
    ("shijiazhuang-museum",   "河北省_河北博物院",      "河北博物院"),
]


def kv_get(mid):
    url = f"{KV_ENDPOINT}?key=museum-data-{mid}&sortKey=museum"
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        kv = json.loads(r.read().decode())
    raw = kv.get("value")
    if isinstance(raw, list):
        raw = raw[0].get("value") if isinstance(raw[0], dict) else raw[0]
    return json.loads(raw) if isinstance(raw, str) else raw


def upsert(key, name, cols):
    records = [{
        "museumDedupeKey": key,
        "museumName": name,
        "name": c["name"],
        "dynasty": c.get("dynasty"),
        "category": c.get("category"),
        "description": c.get("description"),
        "imageUrl": c["imageUrl"],
        "sourceUrl": c.get("sourceUrl"),
        "rightsType": c.get("rightsType"),
        "license": c.get("license"),
        "copyrightHolder": c.get("copyrightHolder"),
        "attribution": c.get("attribution"),
    } for c in cols]
    req = urllib.request.Request(
        f"{BASE}/api/museums/treasures",
        data=json.dumps({"year": YEAR, "records": records}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def verify(key, name):
    q = urllib.parse.urlencode({"museumName": name, "province": key.split("_", 1)[0], "limit": 10})
    req = urllib.request.Request(f"{BASE}/api/museums/treasures?{q}", headers={"Origin": "https://museumcheck.cn"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode())
    arr = d.get("treasures") or []
    ok = all(t.get("imageUrl", "").startswith("https://museumcheck.cn/images/") for t in arr)
    print(f"  verify {key}: rows={len(arr)} all_selfhosted={ok}")
    for t in arr:
        print("     ", t.get("name"), "->", t.get("imageUrl"))
    return ok


def main():
    all_ok = True
    for mid, key, name in TARGETS:
        kv = kv_get(mid)
        cols = kv.get("collections", [])
        print(f"\n##### {name} ({key}) #####")
        resp = upsert(key, name, cols)
        print("  upsert resp:", json.dumps(resp, ensure_ascii=False)[:200])
        if not verify(key, name):
            all_ok = False
    print("\n=== RESULT:", "ALL OK" if all_ok else "CHECK FAILED ===")
    import sys; sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
