#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
南京博物院 馆藏图「自托管」补充脚本（museumcheck.cn）

流程：研究馆照+3镇馆之宝 → 从 Commons 下载 → 上传到自己的服务器(后端 /image/upload)
      → 拿到 https://museumcheck.cn/images/<file> 公网 URL → 写透 KV/MySQL/meta.json
      → 重新生成 js/museums-meta.js → 端到端验证。
图片全部自托管到 museumcheck.cn，绝不热链第三方；网站与付费 Skill 共用同一 URL。

图片来源（均确藏南京博物院、Commons 自由授权）：
- 馆照  File:Nanjing Museum big.jpg (CC BY-SA 2.5)
- 金兽  File:Gold Beast, Nanjing Museum.jpg (CC BY-SA 4.0)
- 竹林七贤与荣启期砖画  File:Seven Sages of the Bamboo Grove 1.Nanjing Museum.jpg (CC BY-SA 4.0)
- 青釉神兽尊  File:Celadon-glazed porcelain Zun with design of a monster 01.jpg (CC BY-SA 4.0)
"""
import json, sys, time, os, urllib.request, urllib.parse

# ====================== 填写区 ======================
BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "nanjing-museum"          # museums-meta.json 里的 id
NAME = "南京博物院"              # 馆名（与 MySQL/meta 一致）
PROV = "江苏省"                 # 省份（DEDUP_KEY 已设，此字段仅作回退）
# ★ 显式 dedupe key，直接用后端去重键，避免 province 歧义造孤儿行
DEDUP_KEY = "江苏省_南京博物院"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# 馆照：Commons 文件页标题（File:...）；脚本会经 Special:FilePath?width=960 下载
MUSEUM_PHOTO_COMMONS = "File:Nanjing Museum big.jpg"
# 上传到服务器后的文件名（务必唯一 slug，避免后端按原名去重冲突）
MUSEUM_PHOTO_FILENAME = "nanjing-museum-photo-v1.jpg"

# 3 件镇馆之宝（均确藏南京博物院、Commons 有 CC 图）
TREASURES = [
    {
        "name": "金兽", "dynasty": "西汉", "category": "金银器（金器）",
        "commons": "File:Gold Beast, Nanjing Museum.jpg",
        "filename": "nanjing-museum-t1-v1.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gold_Beast,_Nanjing_Museum.jpg",
        "description": "1982年江苏盱眙南窑庄窖藏出土，西汉，重达9100克，是迄今考古发现最重的一块金器；造型为伏卧状豹形神兽，南京博物院镇馆之宝。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "竹林七贤与荣启期砖画", "dynasty": "南朝", "category": "砖画（墓葬壁画）",
        "commons": "File:Seven Sages of the Bamboo Grove 1.Nanjing Museum.jpg",
        "filename": "nanjing-museum-t2-v1.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Seven_Sages_of_the_Bamboo_Grove_1.Nanjing_Museum.jpg",
        "description": "1960年南京西善桥宫山墓出土，南朝，由200余块模印画像砖拼嵌而成，表现嵇康、阮籍等竹林七贤与荣启期，是我国最早的魏晋名士图卷，首批禁止出境展览文物。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "青釉神兽尊", "dynasty": "西晋", "category": "瓷器（青釉）",
        "commons": "File:Celadon-glazed porcelain Zun with design of a monster 01.jpg",
        "filename": "nanjing-museum-t3-v1.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celadon-glazed_porcelain_Zun_with_design_of_a_monster_01.jpg",
        "description": "1976年江苏宜兴周处家族墓出土，西晋，高27.9厘米，以青釉瓷塑成神兽形，是西晋青瓷塑贴工艺的代表作，南京博物院藏。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
]
IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"
# ===================================================


def http_json(url, data=None, headers=None, method="GET", timeout=60):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode())


def download_commons(file_title, dest, width=960, tries=4):
    """经 Special:FilePath 重定向下载 Commons 缩略图；网络抖动时回退到直连原图 URL。
    本沙箱 upload.wikimedia.org 直连与 Special:FilePath 互有可用/超时，故两者都试并显式超时。"""
    fname = file_title.split(":", 1)[1] if ":" in file_title else file_title
    candidates = ["https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname) + f"?width={width}"]
    for i in range(tries):
        for c in candidates:
            try:
                req = urllib.request.Request(c, headers=UA)
                with urllib.request.urlopen(req, timeout=25) as r:
                    data = r.read()
                if data and len(data) > 100:
                    open(dest, "wb").write(data)
                    return True
            except Exception:
                continue
        # 仅首轮：经 Commons API 取直连缩略图 URL 作为新增候选
        if i == 0:
            try:
                api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
                    {"action": "query", "titles": file_title, "prop": "imageinfo",
                     "iiprop": "url", "iiurlwidth": width, "format": "json"})
                with urllib.request.urlopen(urllib.request.Request(api, headers=UA), timeout=25) as r:
                    d = json.loads(r.read().decode())
                page = next(iter(d.get("query", {}).get("pages", {}).values()))
                if "imageinfo" in page:
                    candidates.append(page["imageinfo"][0]["url"])
            except Exception:
                pass
        if i < tries - 1:
            time.sleep(1 + i)
    print(f"  ! 下载失败 {file_title}")
    return False


def upload_image(local_path, filename, tries=3):
    """POST /image/upload (multipart) → 返回公网 URL；失败重试。"""
    boundary = "----McheckBoundary%d" % int(time.time()*1000)
    body = b"\r\n".join([
        ("--" + boundary).encode(),
        ('Content-Disposition: form-data; name="file"; filename="%s"' % filename).encode(),
        b"Content-Type: image/jpeg", b"", open(local_path, "rb").read()])
    payload = b"\r\n" + body + b"\r\n--" + boundary.encode() + b"--\r\n"
    for i in range(tries):
        try:
            st, resp = http_json(BASE + "/image/upload", data=payload,
                                 headers={"Content-Type": "multipart/form-data; boundary=" + boundary},
                                 method="POST")
            if resp.get("success"):
                rel = resp.get("path") or resp.get("filename")
                return "https://museumcheck.cn/" + rel
        except Exception as e:
            if i < tries - 1:
                time.sleep(2 + i * 2); continue
            print(f"  ! 上传失败 {filename}: {e}")
    return None


def verify_public(url):
    try:
        req = urllib.request.Request(url, headers=UA, method="HEAD")
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200 and str(r.headers.get("Content-Type", "")).startswith("image/")
    except Exception:
        try:
            req = urllib.request.Request(url, headers={**UA, "Range": "bytes=0-0"}, method="GET")
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status in (200, 206) and str(r.headers.get("Content-Type", "")).startswith("image/")
        except Exception:
            return False


def kv_post(key, sort_key, value):
    payload = {"key": key, "sortKey": sort_key, "value": json.dumps(value, ensure_ascii=False),
               "expireAt": int(time.time()) + 365 * 24 * 60 * 60}
    req = urllib.request.Request(KV_ENDPOINT, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read().decode())


def patch_meta_json(img_museum, treasures):
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    for m in meta:
        if m.get("id") == MID:
            m["image"] = img_museum
            m["hasCollections"] = True
            m["collections"] = [{k: t[k] for k in ("name", "dynasty", "category", "imageUrl",
                            "description", "sourceUrl", "rightsType", "license", "copyrightHolder", "attribution")}
                            for t in treasures]
            break
    json.dump(meta, open("data/museums-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("  meta.json updated")


def write_kv(img_museum, treasures):
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    entry = next((x for x in meta if x.get("id") == MID), None)
    tags = entry.get("tags", [NAME]) if entry else [NAME]
    kv_data = {"id": MID, "name": NAME, "location": entry.get("location", ""), "tags": tags,
               "image": img_museum, "level": entry.get("level", "一级"),
               "hasCollections": True, "collections": treasures,
               "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    st, body = kv_post(f"museum-data-{MID}", "museum", kv_data)
    return st == 200


def mysql_photo(img_museum):
    st0, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    if not row:
        print("  ! MySQL row not found for", NAME); return False
    vc = row.get("visitorCount"); inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"  ! visitorCount round-trip unsafe ({vc}); 跳过补照"); return False
    rec = dict(row); rec["imageUrl"] = img_museum; rec["visitorCount"] = inv
    st, body = http_json(f"{BASE}/api/museums/ingest", data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def mysql_treasures(treasures):
    records = []
    for t in treasures:
        rec = {"museumName": NAME, "name": t["name"],
            "dynasty": t["dynasty"], "category": t["category"], "description": t["description"],
            "imageUrl": t["imageUrl"], "sourceUrl": t["sourceUrl"], "rightsType": t["rightsType"],
            "license": t["license"], "copyrightHolder": t["copyrightHolder"],
            "attribution": t["attribution"], "imageRightsNote": IMG_RIGHTS_NOTE}
        # 优先显式 dedupe_key，避免 province 取值歧义导致孤儿行
        if DEDUP_KEY:
            rec["museumDedupeKey"] = DEDUP_KEY
        else:
            rec["museumProvince"] = PROV
        records.append(rec)
    st, body = http_json(f"{BASE}/api/museums/treasures", data=json.dumps({"records": records}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def verify(img_museum, treasures):
    print("\n--- VERIFY ---")
    url = f"{KV_ENDPOINT}?key=museum-data-{MID}&sortKey=museum"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        kv = json.loads(r.read().decode())
    raw = kv.get("value")
    if isinstance(raw, list): raw = raw[0].get("value") if isinstance(raw[0], dict) else raw[0]
    obj = json.loads(raw) if isinstance(raw, str) else raw
    kv_ok = (len(obj.get("collections", [])) == len(treasures) and bool(obj.get("image")))
    print(f"  KV: collections={len(obj.get('collections', []))} image={'Y' if obj.get('image') else 'N'} -> {'OK' if kv_ok else 'BAD'}")

    st, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=3&_cb={int(time.time()*1000)}")
    r = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    photo_ok = bool(r and r.get("imageUrl"))
    print(f"  MySQL photo: image={'Y' if photo_ok else 'N'} -> {'OK' if photo_ok else 'BAD'}")

    st, d2 = http_json(f"{BASE}/api/museums/treasures?year={YEAR}&museumName={urllib.parse.quote(NAME)}&province={urllib.parse.quote(PROV)}&limit=10",
                      headers={"Origin": "https://museumcheck.cn"})
    ts = d2.get("treasures") or d2.get("data") or []
    tre_ok = len(ts) >= len(treasures)
    hot = [t for t in ts if (t.get("imageUrl") or "").startswith("http") and "museumcheck.cn" not in t.get("imageUrl")]
    print(f"  MySQL treasures: count={len(ts)} hotlinks={len(hot)} -> {'OK' if tre_ok and not hot else 'BAD'}")
    return kv_ok and photo_ok and tre_ok and not hot


def main():
    tmp = "/tmp/_mcheck_" + MID
    os.makedirs(tmp, exist_ok=True)
    # 1) 馆照
    print("=== 1) 馆照：下载 + 上传 ===")
    p = os.path.join(tmp, MUSEUM_PHOTO_FILENAME)
    if not download_commons(MUSEUM_PHOTO_COMMONS, p):
        print("ABORT: 馆照下载失败"); sys.exit(1)
    img_museum = upload_image(p, MUSEUM_PHOTO_FILENAME)
    if not img_museum or not verify_public(img_museum):
        print("ABORT: 馆照上传/公网验证失败"); sys.exit(1)
    print("  馆照 URL:", img_museum)
    # 2) 3 件藏品
    print("\n=== 2) 镇馆之宝：下载 + 上传 ===")
    for t in TREASURES:
        tp = os.path.join(tmp, t["filename"])
        if not download_commons(t["commons"], tp):
            print(f"ABORT: {t['name']} 下载失败"); sys.exit(1)
        u = upload_image(tp, t["filename"])
        if not u or not verify_public(u):
            print(f"ABORT: {t['name']} 上传/公网验证失败"); sys.exit(1)
        t["imageUrl"] = u
        print(f"  {t['name']}: {u}")
    # 3) 写四端
    print("\n=== 3) meta.json ==="); patch_meta_json(img_museum, TREASURES)
    print("=== 4) KV ==="); write_kv(img_museum, TREASURES)
    print("=== 5) MySQL photo ==="); mysql_photo(img_museum)
    print("=== 6) MySQL treasures ==="); mysql_treasures(TREASURES)
    # 4) 重新生成前端
    print("\n=== 7) 重新生成 js/museums-meta.js ===")
    os.system("node devops/tools/generate-museums-meta-js.js")
    ok = verify(img_museum, TREASURES)
    print("\n=== RESULT:", "ALL OK" if ok else "CHECK FAILED ===")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
