#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 sourceType / 馆照署名字段回填到 KV (museum-data-<id>) 与 MySQL museum_treasures。

meta.json 为唯一事实源（已由 backfill_photo_attribution.py 回填）：
  - KV: 顶层写 imageSourceType / imageLicense / imageCopyrightHolder / imageAttribution / imageSourceUrl
        每个 collection（按 name 匹配）写 sourceType
  - MySQL: GET 全量现有行 → 补 sourceType（连同原字段整体回写，避免 upsert 清空其他列）

运行：cd ~/MuseumCheck && python3 devops/scripts/backfill_source_type_kv_mysql.py
"""
import json, time, urllib.parse, urllib.request

META = "data/museums-meta.json"
BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)",
      "Origin": "https://museumcheck.cn", "Content-Type": "application/json"}


def http_json(url, data=None, method="GET", timeout=40):
    req = urllib.request.Request(url, data=data, headers=UA, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        body = r.read().decode()
    return json.loads(body) if body else {}


def kv_get(key):
    try:
        d = http_json(f"{KV_ENDPOINT}?key={urllib.parse.quote(key)}&sortKey=museum")
        v = d.get("value") or d
        if isinstance(v, str):
            v = json.loads(v)
        return v or None
    except Exception as e:
        print(f"    (KV GET {key} 失败: {e})")
        return None


def kv_post(key, value):
    payload = {"key": key, "sortKey": "museum",
               "value": json.dumps(value, ensure_ascii=False),
               "expireAt": int(time.time()) + 365 * 24 * 60 * 60}
    return http_json(KV_ENDPOINT, data=json.dumps(payload).encode(), method="POST")


def all_mysql_treasures():
    d = http_json(f"{BASE}/api/museums/treasures?limit=500")
    return d.get("treasures") or []


def post_treasures(records):
    body = json.dumps({"records": records}).encode()
    return http_json(f"{BASE}/api/museums/treasures", data=body, method="POST")


def main():
    ms = json.load(open(META))
    targets = [m for m in ms if m.get("collections") and
               any(c.get("sourceType") for c in m["collections"])]
    print(f"目标馆: {len(targets)}（meta 中带 sourceType 藏品的馆）")

    # ---------- KV ----------
    kv_ok = kv_missing = 0
    for m in targets:
        mid = m["id"]
        rec = kv_get(f"museum-data-{mid}")
        if not rec:
            kv_missing += 1
            print(f"  ○ KV 无 museum-data-{mid}（meta fallback 即可，跳过）")
            continue
        changed = False
        # 馆照署名（仅 meta 有才写，不凭空造）
        for f in ("imageSourceType", "imageLicense", "imageCopyrightHolder",
                  "imageAttribution", "imageSourceUrl"):
            if m.get(f) and rec.get(f) != m[f]:
                rec[f] = m[f]; changed = True
        # 藏品 sourceType（按 name 匹配）
        src_by_name = {c["name"]: c.get("sourceType") for c in m["collections"]}
        for c in rec.get("collections") or []:
            st = src_by_name.get(c.get("name"))
            if st and c.get("sourceType") != st:
                c["sourceType"] = st; changed = True
        if changed:
            kv_post(f"museum-data-{mid}", rec)
            kv_ok += 1
            print(f"  ✓ KV 更新 {mid}")
        else:
            print(f"  · KV {mid} 已是最新")
        time.sleep(0.3)

    # ---------- MySQL ----------
    rows = all_mysql_treasures()
    by_name = {}
    for r in rows:
        by_name.setdefault(r["name"], r)
    print(f"\nMySQL 现有 treasures 行: {len(rows)}")

    to_write, unmatched = {}, []
    for m in targets:
        for c in m["collections"]:
            st = c.get("sourceType")
            row = by_name.get(c["name"])
            if not (st and row):
                unmatched.append(f"{m['id']}/{c['name']}")
                continue
            row = dict(row)  # 原字段整体保留，只加 sourceType
            row["sourceType"] = st
            to_write[(row["museumDedupeKey"], row["name"])] = row

    if to_write:
        recs = list(to_write.values())
        # 去掉只读/内部字段，保持 POST 形状
        clean = []
        for r in recs:
            c = {k: v for k, v in r.items()
                 if k not in ("id", "lastFetchedAt") and v is not None}
            clean.append(c)
        # 分批
        for i in range(0, len(clean), 50):
            resp = post_treasures(clean[i:i + 50])
            print(f"  MySQL POST: upserted={resp.get('upserted')} skipped={resp.get('skipped')} errors={resp.get('errors') or ''}")
    print(f"MySQL 待写: {len(to_write)} 行；未匹配（无行或无 sourceType）: {len(unmatched)}")
    if unmatched:
        for u in unmatched[:20]:
            print("    -", u)

    print("\n完成。验证建议：GET /api/museums/treasures?museumName=故宫博物院&province=北京市 看 sourceType 字段。")


if __name__ == "__main__":
    main()
