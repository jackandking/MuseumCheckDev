#!/usr/bin/env python3
"""
Supplement 镇江博物馆 data into the MuseumCheck system:

  1. data/museums-meta.json  -> set image + hasCollections + collections (durable source)
  2. KV museum-data-zhenjiang-museum -> full record (what the check-in page reads)
  3. MySQL museums           -> museum photo (visitorCount preserved via inverse transform)
  4. MySQL museum_treasures  -> 3 镇馆之宝 keyed to the real dedupe_key (江苏省_镇江博物馆)

Treasure info sourced from authoritative public references (镇江博物馆官网, CCTV,
人民日报/中国江苏网). Images are from Wikimedia Commons (CC BY-SA); artists/licences
verified via the Commons API.
"""
import json, sys, time, urllib.request, urllib.parse, os

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "zhenjiang-museum"
NAME = "镇江博物馆"
PROV = "江苏省"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# ---- raw Commons thumb URLs (verified 200 image/jpeg earlier) ----
IMG_MUSEUM = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Zhenjiang_Museum_01_2011-10.JPG/960px-Zhenjiang_Museum_01_2011-10.JPG"
IMG_FENGZUN = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/%E9%9D%92%E9%93%9C%E5%87%A4%E7%BA%B9%E5%B0%8A_%EF%BC%88%E6%AD%A3%EF%BC%89.jpg/960px-%E9%9D%92%E9%93%9C%E5%87%A4%E7%BA%B9%E5%B0%8A_%EF%BC%88%E6%AD%A3%EF%BC%89.jpg"
IMG_YUZHU = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Guifu_Lunyu_Yuzhu_Jiuchoutong_-_150725095.JPG/960px-Guifu_Lunyu_Yuzhu_Jiuchoutong_-_150725095.JPG"
IMG_NIAOGAIHU = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/%E9%9D%92%E9%93%9C%E9%B8%9F%E7%9B%96%E5%A3%B6.jpg/960px-%E9%9D%92%E9%93%9C%E9%B8%9F%E7%9B%96%E5%A3%B6.jpg"

IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"

TREASURES = [
    {
        "name": "青铜凤纹尊",
        "dynasty": "西周",
        "category": "青铜器",
        "imageUrl": IMG_FENGZUN,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E9%9D%92%E9%93%9C%E5%87%A4%E7%BA%B9%E5%B0%8A_%EF%BC%88%E6%AD%A3%EF%BC%89.jpg",
        "description": "西周早期青铜礼器，1976年出土于江苏丹阳司徒西周铜器窑藏。通高34厘米、口径41厘米、重约18公斤。尊腹满饰凤鸟纹，两对大型凤鸟回首展翅，间饰蛙形（或龟形）小动物，纹饰繁丽华贵。是迄今所见吴国早期铸造最精美华丽的青铜重器，镇江博物馆唯一的“国宝级”文物。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "白色瑰宝",
        "attribution": "白色瑰宝 / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "银鎏金龟负“论语玉烛”酒令筒",
        "dynasty": "唐",
        "category": "金银器",
        "imageUrl": IMG_YUZHU,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Guifu_Lunyu_Yuzhu_Jiuchoutong_-_150725095.JPG",
        "description": "唐代银器，1982年出土于江苏丹徒丁卯桥唐代金银器窑藏。通体银质鎏金：底座作龟形，龟背托举圆柱形酒筹筒，筒身刻“论语玉烛”四字，筒内盛放50枚鎏金银酒令筹。令辞上半采自《论语》语句，下半对应具体饮酒规定，生动再现唐代宴饮礼俗，是唐代金银工艺与酒文化结合的巅峰之作，列入禁止出境展览文物名录。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Shallowell",
        "attribution": "Shallowell / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "青铜鸟盖壶",
        "dynasty": "西周",
        "category": "青铜器",
        "imageUrl": IMG_NIAOGAIHU,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E9%9D%92%E9%93%9C%E9%B8%9F%E7%9B%96%E5%A3%B6.jpg",
        "description": "西周青铜酒器，1982年出土于江苏丹徒大港母子墩西周墓。形体硕大，壶盖塑作展翅欲飞的小鸟，弱化器体的沉重感；壶体以凸宽带纹间隔，饰云形勾连纹与对称乳丁，出土时器内尚存液体。造型生动别致，是吴国青铜器中极具特色的代表作品。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "白色瑰宝",
        "attribution": "白色瑰宝 / CC BY-SA 4.0, via Wikimedia Commons",
    },
]


def api_get(path, headers=None):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(BASE + path, headers=h)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def api_post(path, payload, headers=None):
    h = {"Content-Type": "application/json", **UA}; h.update(headers or {})
    data = json.dumps(payload).encode()
    req = urllib.request.Request(BASE + path, data=data, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, json.loads(r.read().decode())


def kv_post(key, sort_key, value):
    payload = {"key": key, "sortKey": sort_key,
               "value": json.dumps(value, ensure_ascii=False),
               "expireAt": int(time.time()) + 365 * 24 * 60 * 60}
    req = urllib.request.Request(KV_ENDPOINT, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read().decode())


def verify_image(url):
    try:
        req = urllib.request.Request(url, headers=UA, method="HEAD")
        with urllib.request.urlopen(req, timeout=25) as r:
            ct = r.headers.get("Content-Type", "")
            return r.status == 200 and ct.startswith("image/")
    except Exception as e:
        # some CDNs reject HEAD; retry with GET range
        try:
            req = urllib.request.Request(url, headers={**UA, "Range": "bytes=0-0"}, method="GET")
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.status in (200, 206) and r.headers.get("Content-Type", "").startswith("image/")
        except Exception:
            return False


def patch_meta_json():
    path = "data/museums-meta.json"
    meta = json.load(open(path, encoding="utf-8"))
    for m in meta:
        if m.get("id") == MID:
            m["image"] = IMG_MUSEUM
            m["hasCollections"] = True
            m["collections"] = [
                {k: t[k] for k in ("name", "dynasty", "category", "imageUrl",
                                   "description", "sourceUrl", "rightsType",
                                   "license", "copyrightHolder", "attribution")}
                for t in TREASURES
            ]
            break
    json.dump(meta, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("  meta.json updated (image + hasCollections + collections)")


def write_kv():
    kv_data = {
        "id": MID, "name": NAME, "location": "镇江",
        "tags": ["镇江文化", "长江文明", "山水文化"],
        "image": IMG_MUSEUM, "level": "一级",
        "hasCollections": True, "collections": TREASURES,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    st, body = kv_post(f"museum-data-{MID}", "museum", kv_data)
    print(f"  KV write: HTTP {st} -> {json.dumps(body, ensure_ascii=False)[:120]}")
    return st == 200


def mysql_photo():
    d = api_get(f"/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    if not row:
        print("  ! MySQL row not found for", NAME); return False
    vc = row.get("visitorCount")
    inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"  ! visitorCount round-trip unsafe ({vc}); aborting photo patch"); return False
    rec = dict(row)
    rec["imageUrl"] = IMG_MUSEUM
    rec["visitorCount"] = inv
    st, body = api_post("/api/museums/ingest", {"year": YEAR, "records": [rec]})
    print(f"  MySQL photo ingest: HTTP {st} vc={vc}->inverse={inv} -> {json.dumps(body, ensure_ascii=False)[:100]}")
    return st == 200


def mysql_treasures():
    records = []
    for t in TREASURES:
        records.append({
            "museumProvince": PROV, "museumName": NAME,
            "name": t["name"], "dynasty": t["dynasty"], "category": t["category"],
            "description": t["description"], "imageUrl": t["imageUrl"],
            "sourceUrl": t["sourceUrl"], "rightsType": t["rightsType"],
            "license": t["license"], "copyrightHolder": t["copyrightHolder"],
            "attribution": t["attribution"], "imageRightsNote": IMG_RIGHTS_NOTE,
        })
    st, body = api_post("/api/museums/treasures", {"records": records})
    print(f"  MySQL treasures upsert: HTTP {st} -> {json.dumps(body, ensure_ascii=False)[:160]}")
    return st == 200


def verify():
    print("\n--- VERIFY ---")
    # KV (direct read)
    url = f"{KV_ENDPOINT}?key=museum-data-{MID}&sortKey=museum"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        kv = json.loads(r.read().decode())
    raw = kv.get("value")
    if isinstance(raw, list):
        raw = raw[0].get("value") if isinstance(raw[0], dict) else raw[0]
    obj = json.loads(raw) if isinstance(raw, str) else raw
    n_col = len(obj.get("collections", []))
    kv_img = bool(obj.get("image"))
    kv_ok = (n_col == 3 and kv_img)
    print(f"  KV: collections={n_col} image={'Y' if kv_img else 'N'} -> {'OK' if kv_ok else 'BAD'}")

    # MySQL photo
    d = api_get(f"/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=3&_cb={int(time.time()*1000)}")
    r = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    photo_ok = bool(r and r.get("imageUrl"))
    print(f"  MySQL photo: image={'Y' if photo_ok else 'N'} vc={r.get('visitorCount') if r else None} -> {'OK' if photo_ok else 'BAD'}")

    # MySQL treasures (Origin lock)
    d2 = api_get(f"/api/museums/treasures?year={YEAR}&museumName={urllib.parse.quote(NAME)}&province={urllib.parse.quote(PROV)}&limit=10",
                 headers={"Origin": "https://museumcheck.cn"})
    ts = d2.get("treasures") or d2.get("data") or []
    tnames = [t.get("name") for t in ts]
    tre_ok = len(ts) >= 3
    print(f"  MySQL treasures: count={len(ts)} names={tnames} -> {'OK' if tre_ok else 'BAD'}")
    return kv_ok and photo_ok and tre_ok


def main():
    print("=== Image pre-check ===")
    for label, u in [("museum", IMG_MUSEUM), ("凤纹尊", IMG_FENGZUN),
                     ("论语玉烛", IMG_YUZHU), ("鸟盖壶", IMG_NIAOGAIHU)]:
        ok = verify_image(u)
        print(f"  {label}: {'OK' if ok else 'FAIL'}  {u[:70]}...")
        if not ok:
            print("  ABORT: image not live"); sys.exit(1)

    print("\n=== 1) meta.json ===")
    patch_meta_json()
    print("\n=== 2) KV ===")
    write_kv()
    print("\n=== 3) MySQL photo (visitorCount preserved) ===")
    mysql_photo()
    print("\n=== 4) MySQL treasures ===")
    mysql_treasures()

    ok = verify()
    print("\n=== RESULT:", "ALL OK" if ok else "CHECK FAILED ===")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
