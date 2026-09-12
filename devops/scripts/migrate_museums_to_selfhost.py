#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把已补馆（热链 Wikimedia）的馆藏图迁移为自托管（上传到 museumcheck.cn 后端）。

覆盖：镇江博物馆 / 甘肃省博物馆 / 河北博物院
动作：对每馆 1 张馆照 + 3 件镇馆之宝，下载现有热链图 → 上传后端 /image/upload
      → 拿到 https://museumcheck.cn/images/<file> → 重写 KV / MySQL(museums+t中游reasures)
      / data/museums-meta.json 四处 URL（visitorCount 走 inverse 保护，零损坏）。
最后重新生成 js/museums-meta.js 并端到端验证。

运行：在 /Users/jak/MuseumCheck 下  python3 devops/scripts/migrate_museums_to_selfhost.py
"""
import json, sys, time, os, urllib.request, urllib.parse, tempfile

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
MUSEUMS = ["zhenjiang-museum", "lanzhou-museum", "shijiazhuang-museum"]
# 显式 dedupe key（省_馆名），与原始补馆脚本一致；避免用 city 当 province 造孤儿行
DEDUP_KEYS = {
    "zhenjiang-museum": "江苏省_镇江博物馆",
    "lanzhou-museum": "甘肃省_甘肃省博物馆",
    "shijiazhuang-museum": "河北省_河北博物院",
}


def http_json(url, data=None, headers=None, method="GET", timeout=60):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode())


def commons_file_from_url(url):
    """从 upload.wikimedia.org 热链 URL 抽出 Commons 原文件名（URL 解码）。"""
    if "/thumb/" in url:
        seg = url.split("/thumb/", 1)[1].split("/")[-1]      # 960px-Name.ext
        name = seg.split("960px-", 1)[1] if seg.startswith("960px-") else seg
    elif "/commons/" in url:
        name = url.split("/commons/", 1)[1].split("/")[-1]
    else:
        name = url.split("/")[-1]
    return urllib.parse.unquote(name)


def download(url, dest, tries=4):
    # 网络抖动：直连 upload.wikimedia.org 与 Special:FilePath 互有可用/超时。两者都试，显式超时避免长挂。
    fname = commons_file_from_url(url)
    candidates = [
        url,  # 直连原 hotlink（本沙箱当前可用）
        "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname) + "?width=960",
    ]
    last_err = None
    for i in range(tries):
        for c in candidates:
            try:
                req = urllib.request.Request(c, headers=UA)
                with urllib.request.urlopen(req, timeout=25) as r:
                    data = r.read()
                if data and len(data) > 100:
                    open(dest, "wb").write(data)
                    return True
            except Exception as e:
                last_err = e
                continue
        if i < tries - 1:
            time.sleep(1 + i)
    print(f"    (下载失败末因: {type(last_err).__name__}: {str(last_err)[:120]})")
    return False


def upload(local_path, filename, tries=3):
    boundary = "----McheckMig%d" % int(time.time() * 1000)
    body = b"\r\n".join([
        ("--" + boundary).encode(),
        ('Content-Disposition: form-data; name="file"; filename="%s"' % filename).encode(),
        b"Content-Type: image/jpeg", b"", open(local_path, "rb").read()])
    payload = b"\r\n" + body + b"\r\n--" + boundary.encode() + b"--\r\n"
    for i in range(tries):
        try:
            st, resp = http_json(BASE + "/image/upload", data=payload,
                                 headers={"Content-Type": "multipart/form-data; boundary=" + boundary}, method="POST")
            if resp.get("success"):
                rel = resp.get("path") or resp.get("filename")
                return "https://museumcheck.cn/" + urllib.parse.quote(rel, safe="/")
        except Exception:
            if i < tries - 1:
                time.sleep(2 + i * 2); continue
    return None


def public_ok(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA, method="HEAD"), timeout=30) as r:
            return r.status == 200 and str(r.headers.get("Content-Type", "")).startswith("image/")
    except Exception:
        return False


def kv_post(key, sort_key, value):
    payload = {"key": key, "sortKey": sort_key, "value": json.dumps(value, ensure_ascii=False),
               "expireAt": int(time.time()) + 365 * 24 * 60 * 60}
    req = urllib.request.Request(KV_ENDPOINT, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read().decode())


def kv_get(mid):
    url = f"{KV_ENDPOINT}?key=museum-data-{mid}&sortKey=museum"
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        kv = json.loads(r.read().decode())
    raw = kv.get("value")
    if isinstance(raw, list):
        raw = raw[0].get("value") if isinstance(raw[0], dict) else raw[0]
    return json.loads(raw) if isinstance(raw, str) else raw


def mysql_photo(name, new_url):
    st, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(name)}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == name), None)
    if not row:
        print("  ! MySQL row not found:", name); return False
    vc = row.get("visitorCount"); inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"  ! visitorCount round-trip unsafe ({vc}); 跳过补照"); return False
    rec = dict(row); rec["imageUrl"] = new_url; rec["visitorCount"] = inv
    st, _ = http_json(f"{BASE}/api/museums/ingest", data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
                     headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def mysql_treasures(mid, prov, name, treas):
    dk = DEDUP_KEYS.get(mid)
    records = []
    for t in treas:
        rec = {"museumName": name, "name": t["name"], "dynasty": t["dynasty"],
                "category": t["category"], "description": t["description"], "imageUrl": t["imageUrl"],
                "sourceUrl": t["sourceUrl"], "rightsType": t["rightsType"], "license": t["license"],
                "copyrightHolder": t["copyrightHolder"], "attribution": t["attribution"]}
        if dk:
            rec["museumDedupeKey"] = dk
        else:
            rec["museumProvince"] = prov
        records.append(rec)
    st, _ = http_json(f"{BASE}/api/museums/treasures", data=json.dumps({"records": records}).encode(),
                     headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def migrate_one(mid):
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    m = next((x for x in meta if x.get("id") == mid), None)
    if not m:
        print("! meta 无此馆:", mid); return False
    name = m["name"]; prov = m.get("province") or (m.get("location") or "")
    # province 在 meta 可能缺；从 KV 取
    kv = kv_get(mid); prov = kv.get("province") or prov
    print(f"\n##### {name} (prov={prov}) #####")

    tmp = tempfile.mkdtemp(prefix=f"mig_{mid}_")
    # 馆照
    photo_slug = f"{mid}-photo-v1.jpg"
    p = os.path.join(tmp, photo_slug)
    if not download(m["image"], p):
        print("  ! 馆照下载失败，跳过"); return False
    new_photo = upload(p, photo_slug)
    if not new_photo or not public_ok(new_photo):
        print("  ! 馆照上传/公网失败，跳过"); return False
    print("  馆照:", new_photo)

    # 藏品
    for i, c in enumerate(m["collections"]):
        slug = f"{mid}-t{i+1}-v1.jpg"
        cp = os.path.join(tmp, slug)
        if not download(c["imageUrl"], cp):
            print(f"  ! {c['name']} 下载失败，中止"); return False
        u = upload(cp, slug)
        if not u or not public_ok(u):
            print(f"  ! {c['name']} 上传/公网失败，中止"); return False
        c["imageUrl"] = u
        print(f"  {c['name']}:", u)

    # 写 meta.json
    m["image"] = new_photo
    json.dump(meta, open("data/museums-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # 写 KV
    kv["image"] = new_photo
    for c, kc in zip(m["collections"], kv.get("collections", [])):
        kc["imageUrl"] = c["imageUrl"]
    kv_post(f"museum-data-{mid}", "museum", kv)

    # 写 MySQL
    mysql_photo(name, new_photo)
    mysql_treasures(mid, prov, name, m["collections"])
    return True


def verify(mid):
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    m = next((x for x in meta if x.get("id") == mid), None)
    kv = kv_get(mid)
    kv_img = bool(kv.get("image")) and kv["image"].startswith("https://museumcheck.cn/images/")
    kv_tre = all(t.get("imageUrl", "").startswith("https://museumcheck.cn/images/") for t in kv.get("collections", []))
    meta_img = m["image"].startswith("https://museumcheck.cn/images/")
    meta_tre = all(c["imageUrl"].startswith("https://museumcheck.cn/images/") for c in m["collections"])
    print(f"  verify {mid}: KV image={kv_img} KV treasures={kv_tre} meta image={meta_img} meta treasures={meta_tre}")
    return kv_img and kv_tre and meta_img and meta_tre


def main():
    ok_all = True
    for mid in MUSEUMS:
        if not migrate_one(mid):
            ok_all = False
            continue
        verify(mid)
    print("\n=== 重新生成 js/museums-meta.js ===")
    os.system("node devops/tools/generate-museums-meta-js.js")
    print("\n=== RESULT:", "ALL OK" if ok_all else "CHECK FAILED ===")
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
