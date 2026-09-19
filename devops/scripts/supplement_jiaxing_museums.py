#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
嘉兴地区市/县级博物馆「自托管」补充（2026-09-17）：
  1) 嘉兴博物馆（嘉兴马家浜文化博物馆）★一级
  2) 平湖市博物馆 三级
  3) 海宁市博物馆 三级
  4) 海盐县博物馆 三级（Commons 无馆照建筑图 → 馆照留空，仅补 3 件藏品，待用户提供建筑照）
流程：研究 → Commons 下载 → 上传 museumcheck.cn/image/upload → 四端落库 → 重生成 meta.js。
复用 museum-selfhost-supplement 模板的 download_commons / maybe_resize / upload_image(409幂等) 逻辑。
"""
import json, sys, time, os, urllib.request, urllib.parse, urllib.error

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"

# 猫猫的日记本 / Gary Todd 为 Commons 上传者；按各文件实际许可填写
BY = "猫猫的日记本"
GARY = "Gary Todd"

MUSEUMS = [
    {
        "mid": "jiaxing-museum", "meta_name": "嘉兴博物馆", "mysql_name": "嘉兴博物馆（嘉兴马家浜文化博物馆）",
        "prov": "浙江省", "location": "嘉兴", "level": "一级",
        "tags": ["嘉兴", "马家浜文化", "新石器", "亲子"],
        "photo": {"commons": "File:嘉兴博物馆163043.jpg", "filename": "jiaxing-museum-photo-v1.jpg",
                  "license": "CC BY-SA 4.0", "holder": "Augoustoshai",
                  "attr": "Augoustoshai / CC BY-SA 4.0, via Wikimedia Commons"},
        "treasures": [
            {"name": "玉玦", "dynasty": "马家浜文化（约前5000–前4000）", "category": "玉器",
             "commons": "File:Majiabang Culture Jade Jue.jpg", "filename": "jiaxing-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Majiabang_Culture_Jade_Jue.jpg",
             "description": "马家浜文化玉玦，距今约七千年，中国最早的玉耳饰之一，见证长江下游玉文化的萌发。",
             "license": "CC0", "holder": GARY, "attr": f"{GARY} / CC0, via Wikimedia Commons"},
            {"name": "玉璜", "dynasty": "马家浜文化", "category": "玉器",
             "commons": "File:Beiyinyangying Culture Agate Huang & Majiabang Culture Jade Huang.jpg",
             "filename": "jiaxing-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Beiyinyangying_Culture_Agate_Huang_%26_Majiabang_Culture_Jade_Huang.jpg",
             "description": "马家浜文化玉璜，佩饰类玉礼器雏形，体现先民对玉的尊崇与审美。",
             "license": "CC0", "holder": GARY, "attr": f"{GARY} / CC0, via Wikimedia Commons"},
            {"name": "兽面形陶器耳", "dynasty": "马家浜文化", "category": "陶器",
             "commons": "File:Animal-faced Pottery Handle 01 2017-04.jpg", "filename": "jiaxing-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Animal-faced_Pottery_Handle_01_2017-04.jpg",
             "description": "马家浜遗址出土的兽面形陶器耳，器物附件塑成兽面，憨态可掬，是马家浜陶器的特色。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
        ],
    },
    {
        "mid": "pinghu-museum", "meta_name": "平湖市博物馆", "mysql_name": "平湖市博物馆",
        "prov": "浙江省", "location": "平湖", "level": "三级",
        "tags": ["平湖", "玉器", "明代", "亲子"],
        "photo": {"commons": "File:Pinghu Museum 01 2014-06.JPG", "filename": "pinghu-museum-photo-v1.jpg",
                  "license": "CC BY-SA 3.0", "holder": BY,
                  "attr": f"{BY} / CC BY-SA 3.0, via Wikimedia Commons"},
        "treasures": [
            {"name": "明代白玉藕片", "dynasty": "明代", "category": "玉器",
             "commons": "File:Jade Articles Collected in Pinghu Museum 02 2014-06.JPG", "filename": "pinghu-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jade_Articles_Collected_in_Pinghu_Museum_02_2014-06.JPG",
             "description": "平湖市博物馆藏明代白玉藕片，玉雕莲藕造型，寓意「连生贵子」，温润精巧。",
             "license": "CC BY-SA 3.0", "holder": BY, "attr": f"{BY} / CC BY-SA 3.0, via Wikimedia Commons"},
            {"name": "明代白玉绞丝镯", "dynasty": "明代", "category": "玉器",
             "commons": "File:Jade Articles Collected in Pinghu Museum 03 2014-06.JPG", "filename": "pinghu-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jade_Articles_Collected_in_Pinghu_Museum_03_2014-06.JPG",
             "description": "平湖市博物馆藏明代白玉绞丝镯，丝环相绞的工艺展现高超碾玉技艺。",
             "license": "CC BY-SA 3.0", "holder": BY, "attr": f"{BY} / CC BY-SA 3.0, via Wikimedia Commons"},
            {"name": "清代兵器形玉佩件", "dynasty": "清代", "category": "玉器",
             "commons": "File:Jade Articles Collected in Pinghu Museum 04 2014-06.JPG", "filename": "pinghu-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jade_Articles_Collected_in_Pinghu_Museum_04_2014-06.JPG",
             "description": "平湖市博物馆藏清代兵器形玉佩件，仿刀剑造型的玉佩，别具意趣。",
             "license": "CC BY-SA 3.0", "holder": BY, "attr": f"{BY} / CC BY-SA 3.0, via Wikimedia Commons"},
        ],
    },
    {
        "mid": "haining-museum", "meta_name": "海宁市博物馆", "mysql_name": "海宁市博物馆",
        "prov": "浙江省", "location": "海宁", "level": "三级",
        "tags": ["海宁", "湖田窑", "宋瓷", "亲子"],
        "photo": {"commons": "File:Haining Museum 01 2014-08.JPG", "filename": "haining-museum-photo-v1.jpg",
                  "license": "CC BY-SA 4.0", "holder": BY,
                  "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
        "treasures": [
            {"name": "北宋湖田窑敞口罐", "dynasty": "北宋", "category": "瓷器",
             "commons": "File:Porcelain of Hutian Ware in Haining Museum 01 2014-08.JPG", "filename": "haining-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Porcelain_of_Hutian_Ware_in_Haining_Museum_01_2014-08.JPG",
             "description": "1974年海宁硖石镇东山西麓宋墓出土，北宋景德镇湖田窑青白瓷敞口罐，釉色莹润。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
            {"name": "北宋湖田窑注子和温碗", "dynasty": "北宋", "category": "瓷器",
             "commons": "File:Porcelain of Hutian Ware in Haining Museum 02 2014-08.JPG", "filename": "haining-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Porcelain_of_Hutian_Ware_in_Haining_Museum_02_2014-08.JPG",
             "description": "1974年海宁宋墓出土，北宋湖田窑注子（酒壶）与温碗一套，再现宋人注酒温酒之雅。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
            {"name": "北宋湖田窑注子和刻花温碗", "dynasty": "北宋", "category": "瓷器",
             "commons": "File:Porcelain of Hutian Ware in Haining Museum 03 2014-08.JPG", "filename": "haining-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Porcelain_of_Hutian_Ware_in_Haining_Museum_03_2014-08.JPG",
             "description": "1974年海宁宋墓出土，北宋湖田窑注子配刻花温碗，青白瓷刻花细腻，宋瓷精品。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
        ],
    },
    {
        "mid": "haiyan-museum", "meta_name": "海盐县博物馆", "mysql_name": "海盐县博物馆",
        "prov": "浙江省", "location": "海盐", "level": "三级",
        "tags": ["海盐", "青铜器", "佛教文物", "亲子"],
        "photo": None,  # Commons 无馆照建筑图，待用户补给；本次仅补 3 件藏品
        "treasures": [
            {"name": "象形铜尊", "dynasty": "春秋", "category": "青铜器",
             "commons": "File:Elephant-shaped Bronze Zun in Haiyan Museum 01 2015-03.jpg", "filename": "haiyan-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Elephant-shaped_Bronze_Zun_in_Haiyan_Museum_01_2015-03.jpg",
             "description": "海盐县博物馆藏象形铜尊，仿象形制的青铜盛酒器，造型生动。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
            {"name": "鎏金铁阿育王塔", "dynasty": "五代（吴越国）", "category": "佛教文物",
             "commons": "File:Gold-Plated Iron Asoka Stupa in Haiyan Museum 01 2015-03.jpg", "filename": "haiyan-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gold-Plated_Iron_Asoka_Stupa_in_Haiyan_Museum_01_2015-03.jpg",
             "description": "海盐县博物馆藏鎏金铁阿育王塔，吴越国时期佛教舍利塔，工艺精湛，见证江南崇佛。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
            {"name": "狮形铜香炉", "dynasty": "明清", "category": "铜器",
             "commons": "File:Bronze Lion-shaped Incense Burner in Haiyan Museum 01 2015-03.jpg", "filename": "haiyan-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Bronze_Lion-shaped_Incense_Burner_in_Haiyan_Museum_01_2015-03.jpg",
             "description": "海盐县博物馆藏狮形铜香炉，狮钮熏香用具，明清铜器之趣品。",
             "license": "CC BY-SA 4.0", "holder": BY, "attr": f"{BY} / CC BY-SA 4.0, via Wikimedia Commons"},
        ],
    },
]


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
                    if ii.get("url"): candidates.append(ii["url"])
                    if ii.get("thumburl"): candidates.append(ii["thumburl"])
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


def patch_or_add_meta(m):
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    img = m.get("_img")
    collections = []
    for t in m["treasures"]:
        collections.append({
            "name": t.get("name"),
            "dynasty": t.get("dynasty"),
            "category": t.get("category"),
            "imageUrl": t.get("imageUrl"),
            "description": t.get("description"),
            "sourceUrl": t.get("sourceUrl"),
            "rightsType": t.get("rightsType", "CC"),
            "license": t.get("license"),
            "copyrightHolder": t.get("holder"),
            "attribution": t.get("attr"),
        })
    entry = next((x for x in meta if x.get("id") == m["mid"]), None)
    if entry:
        entry["image"] = img
        entry["hasCollections"] = True
        entry["collections"] = collections
        print("  meta.json 更新现有条目", m["mid"])
    else:
        meta.append({
            "id": m["mid"], "name": m["meta_name"], "location": m["location"],
            "tags": m["tags"], "image": img, "hasCollections": True, "level": m["level"],
            "collections": collections,
        })
        print("  meta.json 新增条目", m["mid"])
    json.dump(meta, open("data/museums-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def write_kv(m):
    kv_data = {"id": m["mid"], "name": m["meta_name"], "location": m["location"], "tags": m["tags"],
               "image": m.get("_img"), "level": m["level"], "hasCollections": True,
               "collections": m["treasures"], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    st, _ = kv_post(f"museum-data-{m['mid']}", "museum", kv_data)
    return st == 200


def mysql_photo(m):
    st0, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(m['mysql_name'])}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == m["mysql_name"]), None)
    if not row:
        print("  ! MySQL row not found for", m["mysql_name"]); return False, None
    real_name = row.get("name")
    vc = row.get("visitorCount"); inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"  ! visitorCount round-trip unsafe ({vc}); 跳过补照"); return False, real_name
    rec = dict(row); rec["imageUrl"] = m.get("_img"); rec["visitorCount"] = inv
    st, body = http_json(f"{BASE}/api/museums/ingest", data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200, real_name


def mysql_treasures(m, real_name):
    dedup = f"{m['prov']}_{real_name}"
    records = []
    for t in m["treasures"]:
        rec = {"museumName": real_name, "name": t["name"], "dynasty": t["dynasty"],
            "category": t["category"], "description": t["description"], "imageUrl": t["imageUrl"],
            "sourceUrl": t["sourceUrl"], "rightsType": t.get("rightsType", "CC"), "license": t["license"],
            "copyrightHolder": t["holder"], "attribution": t["attr"], "imageRightsNote": IMG_RIGHTS_NOTE,
            "museumDedupeKey": dedup}
        records.append(rec)
    st, body = http_json(f"{BASE}/api/museums/treasures", data=json.dumps({"records": records}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def process(m):
    print("\n################", m["meta_name"], "################")
    tmp = "/tmp/_mcheck_" + m["mid"]
    os.makedirs(tmp, exist_ok=True)
    # 1) 馆照
    if m.get("photo"):
        print("=== 馆照 ===")
        p = os.path.join(tmp, m["photo"]["filename"])
        if not download_commons(m["photo"]["commons"], p, width=1280):
            print("  ABORT 馆照下载失败"); return False
        maybe_resize(p)
        u = upload_image(p, m["photo"]["filename"])
        if not u or not verify_public(u):
            print("  ABORT 馆照上传/验证失败"); return False
        m["_img"] = u
        print("  馆照:", u)
    else:
        print("=== 馆照：无 Commons 图，留空（待用户补给）===")
        m["_img"] = None
    # 2) 藏品
    print("=== 镇馆之宝 ===")
    for t in m["treasures"]:
        tp = os.path.join(tmp, t["filename"])
        if not download_commons(t["commons"], tp, width=960):
            print(f"  ABORT {t['name']} 下载失败"); return False
        maybe_resize(tp)
        u = upload_image(tp, t["filename"])
        if not u or not verify_public(u):
            print(f"  ABORT {t['name']} 上传/验证失败"); return False
        t["imageUrl"] = u
        print(f"  {t['name']}: {u}")
    # 3) 四端
    print("=== meta.json ==="); patch_or_add_meta(m)
    print("=== KV ==="); write_kv(m)
    okp, real_name = mysql_photo(m)
    print("=== MySQL photo ===", "OK" if okp else "FAIL", "real_name=", real_name)
    if not okp: return False
    print("=== MySQL treasures ==="); mysql_treasures(m, real_name)
    return True


def main():
    os.chdir(os.path.expanduser("~/MuseumCheck"))
    ok_all = True
    for m in MUSEUMS:
        try:
            if not process(m):
                ok_all = False
                print("  !! 该馆未完全成功，继续下一馆")
        except Exception as e:
            ok_all = False
            print("  !! 异常:", e)
    print("\n=== 重生成 js/museums-meta.js ===")
    os.system("node devops/tools/generate-museums-meta-js.js")
    print("\n=== 总结果:", "ALL OK" if ok_all else "有馆未成功，检查日志 ===")
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
