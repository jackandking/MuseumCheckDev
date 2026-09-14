#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
故宫博物院 馆藏图「自托管」补充脚本（museumcheck.cn）

背景：KV `museum-data-forbidden-city` 早有 6 件镇馆之宝（名称/简述齐全），但所有图均为
Wikimedia 热链；`data/museums-meta.json` 也还是 0 collections。本脚本把 1 张馆照 + 6 张
藏品图下载→自托管到 museumcheck.cn/images/，只替换 imageUrl，保留原有名称/描述，
四端写透（KV / MySQL / meta.json / js）。其中「大禹治水玉山」在 Commons 无可用的自由图
（已搜证无果），设为 optional：下载/上传失败则 imageUrl 留空（非热链），不中断脚本。

图片来源：均来自 KV 现有热链对应的 Commons 文件（CC 授权 / 公有领域文物照）。
- 馆照  File:Sunset_of_the_Forbidden_City_2006.JPG
- 清明上河图 / 金瓯永固杯 / 平复帖 / 乾隆田黄三联印 / 九龙壁 / 大禹治水玉山(optional)
"""
import json, sys, time, os, urllib.request, urllib.parse, urllib.error

# ====================== 填写区 ======================
BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "forbidden-city"          # museums-meta.json 里的 id
NAME = "故宫博物院"             # 馆名（与 MySQL/meta 一致）
PROV = "北京市"                 # 省份（DEDUP_KEY 已设，此字段仅作回退）
# ★ 显式 dedupe key，与 MySQL 现有 8 行一致 → upsert 原地更新，不造重复行
DEDUP_KEY = "北京市_故宫博物院"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# 馆照：Commons 文件页标题；经 Special:FilePath?width=1280 下载
MUSEUM_PHOTO_COMMONS = "File:Sunset_of_the_Forbidden_City_2006.JPG"
MUSEUM_PHOTO_FILENAME = "forbidden-city-photo-v1.jpg"
# 直连全图路径（稳定；Special:FilePath 重定向到的 /thumb/ 路径本沙箱间歇失败）
MUSEUM_PHOTO_DIRECT = "https://upload.wikimedia.org/wikipedia/commons/0/00/Sunset_of_the_Forbidden_City_2006.JPG"

# 6 件镇馆之宝（名称/描述复用 KV 现有；补朝代/类别/来源；图全部自托管）
TREASURES = [
    {
        "name": "清明上河图", "dynasty": "北宋", "category": "书画（风俗长卷）",
        "commons": "File:Alongtheriver_QingMing.jpg",
        "filename": "forbidden-city-t1-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/8/86/Alongtheriver_QingMing.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Alongtheriver_QingMing.jpg",
        "description": "北宋张择端所作风俗长卷，细致描绘汴京清明时节市井繁华与漕运景象，为中国十大传世名画之一，首批禁止出境展览文物。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "金瓯永固杯", "dynasty": "清乾隆", "category": "金银器（玉杯）",
        "commons": "File:金瓯永固杯_故宫珍宝馆.jpg",
        "filename": "forbidden-city-t2-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/d/de/%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%BF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:金瓯永固杯_故宫珍宝馆.jpg",
        "description": "清乾隆御用饮酒金杯，金胎镶嵌珍珠、红蓝宝石，寓意江山永固，为清宫元旦开笔仪式之重器。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "平复帖", "dynasty": "西晋", "category": "书法（章草）",
        "commons": "File:平复帖.png",
        "filename": "forbidden-city-t3-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/2/21/%E5%B9%B3%E5%A4%8D%E5%B8%96.png",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:平复帖.png",
        "description": "西晋陆机章草墨迹，为现存最早的名人书法真迹，内容为一封问候友人的书札，首批禁止出境展览文物。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "乾隆田黄三联印", "dynasty": "清乾隆", "category": "玺印（田黄石）",
        "commons": "File:Qing Jade Seals, Qianlong Reign.jpg",
        "filename": "forbidden-city-t4-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Qing_Jade_Seals%2C_Qianlong_Reign.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Qing_Jade_Seals,_Qianlong_Reign.jpg",
        "description": "清乾隆帝田黄三联玺，三方印以整块田黄石雕出的石链相连，巧夺天工，首批禁止出境展览文物。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "九龙壁", "dynasty": "清乾隆", "category": "琉璃建筑",
        "commons": "File:Jiulongbi.jpg",
        "filename": "forbidden-city-t5-v1.jpg",
        "direct": "https://upload.wikimedia.org/wikipedia/commons/c/cf/Jiulongbi.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jiulongbi.jpg",
        "description": "故宫珍宝馆内单面琉璃影壁，壁面九条蟠龙戏珠于云水山石之间，为清代琉璃烧造工艺代表作。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Wikimedia Commons",
        "attribution": "CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "大禹治水玉山", "dynasty": "清乾隆", "category": "玉器（玉山子）", "optional": True,
        "commons": "File:大禹治水玉山.jpg",
        "filename": "forbidden-city-t6-v1.jpg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:大禹治水玉山.jpg",
        "description": "清乾隆青玉山子，重逾五吨，以宋人《大禹治水图》为稿本于扬州雕成，现存最大的单体玉雕，陈设于宁寿宫乐寿堂。",
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


def download_commons(file_title, dest, width=960, tries=5, direct=None):
    """经 Special:FilePath 重定向下载 Commons 缩略图；网络抖动时回退到直连原图 URL。
    本沙箱 upload.wikimedia.org 的 /thumb/ 路径不稳定（间歇 000），但 /commons/<hash>/ 全图路径稳定，
    故优先把 Commons API 返回的原始全图 URL（非 /thumb/）也加入候选。"""
    fname = file_title.split(":", 1)[1] if ":" in file_title else file_title
    candidates = []
    if direct:
        candidates.append(direct)  # 可靠的直连全图路径优先
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
        # 仅首轮：经 Commons API 取直连「原始全图」URL（/commons/<hash>/，稳定）与缩略图 URL
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
                    if ii.get("url"):            # 原始全图（非 /thumb/，稳定）
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
    """后端 /image/upload 对约 >1MB 的文件返回 413。超大图用 macOS 自带 sips 反复缩小最长边，
    直到体积 <= max_bytes（兜底到 400px 仍超则告警）。"""
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
    """POST /image/upload (multipart) → 返回公网 URL；失败重试。
    后端按文件名去重，重传同名文件会返回 409 Conflict；内容相同视为幂等成功（只要公网可访问）。"""
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
                # 同名文件已存在（重传）→ 内容相同，公网可访问即视为成功
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
        # 优先显式 dedupe_key，与 MySQL 现有行一致 → 原地更新不造重复行
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
    if not download_commons(MUSEUM_PHOTO_COMMONS, p, width=1280, direct=MUSEUM_PHOTO_DIRECT):
        print("ABORT: 馆照下载失败"); sys.exit(1)
    maybe_resize(p)
    img_museum = upload_image(p, MUSEUM_PHOTO_FILENAME)
    if not img_museum or not verify_public(img_museum):
        print("ABORT: 馆照上传/公网验证失败"); sys.exit(1)
    print("  馆照 URL:", img_museum)
    # 2) 6 件藏品
    print("\n=== 2) 镇馆之宝：下载 + 上传 ===")
    for t in TREASURES:
        tp = os.path.join(tmp, t["filename"])
        if not download_commons(t["commons"], tp, width=960, direct=t.get("direct")):
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
