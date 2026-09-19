#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""上海科技馆 馆照 + 3 件代表展项 自托管补充（2026-09-19）
基于 supplement_museum_template.py；增强：写 KV 时保留用户打卡添加的藏品（isUserAdded）。
科技馆无文物，选「航天/机器人/自然生态」三个展区的代表展项。
"""
import json, sys, time, os, urllib.request, urllib.parse, urllib.error

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "shanghai-science-technology-museum"
NAME = "上海科技馆"
PROV = "上海市"
DEDUP_KEY = "上海市_上海科技馆"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# 馆照：标志性玻璃球幕（Commons CC0）
MUSEUM_PHOTO_COMMONS = "File:Shanghai Science and Technology Museum glass sphere 20260418.jpg"
MUSEUM_PHOTO_FILENAME = "shanghai-science-museum-photo-v1.jpg"
MUSEUM_PHOTO_DIRECT = "https://upload.wikimedia.org/wikipedia/commons/0/0f/Shanghai_Science_and_Technology_Museum_glass_sphere_20260418.jpg"

TREASURES = [
    {
        "name": "风云二号气象卫星模型", "dynasty": "现代", "category": "航天展项",
        "commons": "File:20090829 Model of Fengyun-2 4002.JPG",
        "filename": "shanghai-science-museum-fengyun2-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/1/1b/20090829_Model_of_Fengyun-2_4002.JPG",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:20090829_Model_of_Fengyun-2_4002.JPG",
        "description": "「宇航天地」展区陈列的风云二号气象卫星模型。风云二号是中国自主研制的地球静止轨道气象卫星，该展项直观展示了中国航天与气象观测技术成就。",
        "rightsType": "CC", "license": "CC BY-SA 4.0",
        "copyrightHolder": "Wikimedia Commons",
        "attribution": "Jakub Hałun, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "弹钢琴机器人", "dynasty": "现代", "category": "机器人展项",
        "commons": "File:20090829 Robot in Shanghai Science and Technology Museum 3985.jpg",
        "filename": "shanghai-science-museum-robot-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/c/c5/20090829_Robot_in_Shanghai_Science_and_Technology_Museum_3985.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:20090829_Robot_in_Shanghai_Science_and_Technology_Museum_3985.jpg",
        "description": "「机器人世界」展区的标志性展项——能现场演奏钢琴曲的机器人，长期是馆内人气最高的打卡点之一，展示机器人机电一体化与控制技术。",
        "rightsType": "CC", "license": "CC BY-SA 4.0",
        "copyrightHolder": "Wikimedia Commons",
        "attribution": "Jakub Hałun, CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "大象模型", "dynasty": "现代", "category": "自然展项",
        "commons": "File:Elephant model at Shanghai Science and Technology Museum-20130322.jpg",
        "filename": "shanghai-science-museum-elephant-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/2/28/Elephant_model_at_Shanghai_Science_and_Technology_Museum-20130322.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Elephant_model_at_Shanghai_Science_and_Technology_Museum-20130322.jpg",
        "description": "馆内自然生态展项中的大象标本模型，还原野生动物生存场景，传递生物多样性与生态保护理念。",
        "rightsType": "CC", "license": "CC BY-SA 4.0",
        "copyrightHolder": "Wikimedia Commons",
        "attribution": "Shwangtianyuan, CC BY-SA 4.0, via Wikimedia Commons",
    },
]
IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"


def http_json(url, data=None, headers=None, method="GET", timeout=60):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode())


def download_commons(file_title, dest, width=960, tries=5, direct=None):
    fname = file_title.split(":", 1)[1] if ":" in file_title else file_title
    candidates = []
    if direct:
        candidates.append(direct)
    candidates.append("https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname) + f"?width={width}")
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
        if i == 0:
            try:
                api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
                    {"action": "query", "titles": file_title, "prop": "imageinfo",
                     "iiprop": "url", "iiurlwidth": width, "format": "json"})
                with urllib.request.urlopen(urllib.request.Request(api, headers=UA), timeout=25) as r:
                    d = json.loads(r.read().decode())
                page = next(iter(d.get("query", {}).get("pages", {}).values()))
                if "imageinfo" in page:
                    ii = page["imageinfo"][0]
                    if ii.get("url"):
                        candidates.append(ii["url"])
                    if ii.get("thumburl"):
                        candidates.append(ii["thumburl"])
            except Exception:
                pass
        if i < tries - 1:
            time.sleep(1 + i)
    print(f"  ! 下载失败 {file_title}")
    return False


def maybe_resize(path, max_bytes=900000, max_dim=1000):
    try:
        if os.path.getsize(path) <= max_bytes:
            return
        dim = max_dim
        while os.path.getsize(path) > max_bytes and dim > 400:
            dim = int(dim * 0.85)
            tmp2 = path + ".rsz.jpg"
            os.system(f'sips -Z {dim} "{path}" --out "{tmp2}" 2>/dev/null')
            if os.path.exists(tmp2) and os.path.getsize(tmp2) > 0:
                os.replace(tmp2, path)
            else:
                break
        if os.path.getsize(path) > max_bytes:
            print(f"  ! resize 仍超 {os.path.getsize(path)//1024}KB，可能 413：{os.path.basename(path)}")
        else:
            print(f"  (resized -> {os.path.getsize(path)//1024}KB) {os.path.basename(path)}")
    except Exception as e:
        print(f"  ! resize 跳过 {path}: {e}")


def upload_image(local_path, filename, tries=3):
    expected = "https://museumcheck.cn/images/" + filename
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
        except urllib.error.HTTPError as e:
            if e.code == 409:
                if verify_public(expected):
                    print(f"  (409 同名已存在，复用) {filename}")
                    return expected
                print(f"  ! 409 但公网不可访问 {filename}")
                return None
            if i < tries - 1:
                time.sleep(2 + i * 2); continue
            print(f"  ! 上传失败 {filename}: HTTP {e.code}")
            return None
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


def kv_get(key):
    """读 KV 现值（用于保留用户添加的藏品）。"""
    try:
        with urllib.request.urlopen(urllib.request.Request(
                f"{KV_ENDPOINT}?key={key}&sortKey=museum", headers=UA), timeout=20) as r:
            kv = json.loads(r.read().decode())
        raw = kv.get("value")
        if isinstance(raw, list):
            raw = raw[0].get("value") if isinstance(raw[0], dict) else raw[0]
        return json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return None


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
    # 保留用户打卡添加的藏品（isUserAdded），追加在官方展项之后
    old = kv_get(f"museum-data-{MID}") or {}
    user_added = [c for c in (old.get("collections") or [])
                  if c.get("isUserAdded") and c.get("name") not in {t["name"] for t in treasures}]
    cols = treasures + user_added
    kv_data = {"id": MID, "name": NAME, "location": entry.get("location", "") if entry else "", "tags": tags,
               "image": img_museum, "level": entry.get("level", "一级") if entry else "一级",
               "hasCollections": True, "collections": cols,
               "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    st, body = kv_post(f"museum-data-{MID}", "museum", kv_data)
    print(f"  KV written: official={len(treasures)} user_added_preserved={len(user_added)}")
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
    official = [c for c in obj.get("collections", []) if c.get("name") in {t["name"] for t in treasures}]
    kv_ok = (len(official) == len(treasures) and bool(obj.get("image")))
    print(f"  KV: total_collections={len(obj.get('collections', []))} official={len(official)} image={'Y' if obj.get('image') else 'N'} -> {'OK' if kv_ok else 'BAD'}")

    st, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=3&_cb={int(time.time()*1000)}")
    r = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    photo_ok = bool(r and r.get("imageUrl")) and "museumcheck.cn" in (r.get("imageUrl") or "")
    print(f"  MySQL photo: {'Y' if photo_ok else 'N'} url={(r.get('imageUrl') or '')[:70]} -> {'OK' if photo_ok else 'BAD'}")

    st, d2 = http_json(f"{BASE}/api/museums/treasures?year={YEAR}&museumName={urllib.parse.quote(NAME)}&province={urllib.parse.quote(PROV)}&limit=10",
                      headers={"Origin": "https://museumcheck.cn"})
    ts = d2.get("treasures") or d2.get("data") or []
    tre_ok = len(ts) >= len([t for t in treasures if t.get("imageUrl")])
    hot = [t for t in ts if (t.get("imageUrl") or "").startswith("http") and "museumcheck.cn" not in t.get("imageUrl")]
    print(f"  MySQL treasures: count={len(ts)} hotlinks={len(hot)} -> {'OK' if tre_ok and not hot else 'BAD'}")
    return kv_ok and photo_ok and tre_ok and not hot


def main():
    tmp = "/tmp/_mcheck_" + MID
    os.makedirs(tmp, exist_ok=True)
    print("=== 1) 馆照：下载 + 上传 ===")
    p = os.path.join(tmp, MUSEUM_PHOTO_FILENAME)
    if not download_commons(MUSEUM_PHOTO_COMMONS, p, width=1280, direct=MUSEUM_PHOTO_DIRECT or None):
        print("ABORT: 馆照下载失败"); sys.exit(1)
    maybe_resize(p)
    img_museum = upload_image(p, MUSEUM_PHOTO_FILENAME)
    if not img_museum or not verify_public(img_museum):
        print("ABORT: 馆照上传/公网验证失败"); sys.exit(1)
    print("  馆照 URL:", img_museum)
    print("\n=== 2) 展项：下载 + 上传 ===")
    for t in TREASURES:
        tp = os.path.join(tmp, t["filename"])
        if not download_commons(t["commons"], tp, width=960, direct=t.get("direct") or None):
            if t.get("optional"):
                print(f"  (optional 项 {t['name']} 下载失败，imageUrl 留空)"); t["imageUrl"] = ""; continue
            print(f"ABORT: {t['name']} 下载失败"); sys.exit(1)
        maybe_resize(tp)
        u = upload_image(tp, t["filename"])
        if not u or not verify_public(u):
            if t.get("optional"):
                print(f"  (optional 项 {t['name']} 上传失败，imageUrl 留空)"); t["imageUrl"] = ""; continue
            print(f"ABORT: {t['name']} 上传/公网验证失败"); sys.exit(1)
        t["imageUrl"] = u
        print(f"  {t['name']}: {u}")
    print("\n=== 3) meta.json ==="); patch_meta_json(img_museum, TREASURES)
    print("=== 4) KV ==="); write_kv(img_museum, TREASURES)
    print("=== 5) MySQL photo ==="); 
    if not mysql_photo(img_museum): print("  ! MySQL photo 写入失败")
    print("=== 6) MySQL treasures ===")
    if not mysql_treasures(TREASURES): print("  ! MySQL treasures 写入失败")
    print("\n=== 7) 重新生成 js/museums-meta.js ===")
    os.system("node devops/tools/generate-museums-meta-js.js")
    ok = verify(img_museum, TREASURES)
    print("\n=== RESULT:", "ALL OK" if ok else "CHECK FAILED ===")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
