#!/usr/bin/env python3
"""
Supplement 甘肃省博物馆 data into the MuseumCheck system:

  1. data/museums-meta.json  -> set image + hasCollections + collections (durable source)
  2. KV museum-data-lanzhou-museum -> full record (what the check-in page reads)
  3. MySQL museums           -> museum photo (visitorCount preserved via inverse transform)
  4. MySQL museum_treasures  -> 3 镇馆之宝 keyed to the real dedupe_key (甘肃省_甘肃省博物馆)

Treasure info sourced from authoritative public references (甘肃省博物馆官网 gansumuseum.com,
百度百科, 信用中国(甘肃)《国家宝藏》报道). Images are from Wikimedia Commons; artists/licences
verified via the Commons API.

Note: the canonical 甘博 "镇馆之宝" trio (per 《国家宝藏》) is 铜奔马 + 《驿使图》画像砖 +
人头形器口彩陶瓶. 《驿使图》 has no freely-licensed image on Commons, so it is substituted here
by 元·莲花玻璃托盏 (also a 甘博 馆藏精品, with a CC0 image). Swap back if a free 驿使图 image
is found.
"""
import json, sys, time, urllib.request, urllib.parse

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "lanzhou-museum"
NAME = "甘肃省博物馆"
PROV = "甘肃省"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# ---- raw Commons thumb URLs (verified 200 image/jpeg earlier) ----
IMG_MUSEUM = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Gansu_Provincial_Museum_-_%E7%94%98%E8%82%83%E7%9C%81%E5%8D%9A%E7%89%A9%E9%A6%86_%2817143542340%29.jpg/960px-Gansu_Provincial_Museum_-_%E7%94%98%E8%82%83%E7%9C%81%E5%8D%9A%E7%89%A9%E9%A6%86_%2817143542340%29.jpg"
IMG_TONGBENMA = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/%E9%9B%B7%E5%8F%B0%E6%B1%89%E5%A2%93%E9%93%9C%E5%A5%94%E9%A9%AC3.jpg/960px-%E9%9B%B7%E5%8F%B0%E6%B1%89%E5%A2%93%E9%93%9C%E5%A5%94%E9%A9%AC3.jpg"
IMG_HEADPOT = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/%E4%BB%B0%E9%9F%B6%E6%96%87%E5%8C%96%E4%BA%BA%E5%A4%B4%E5%BD%A2%E5%99%A8%E5%8F%A3%E5%BD%A9%E9%99%B6%E7%93%B6.jpg/960px-%E4%BB%B0%E9%9F%B6%E6%96%87%E5%8C%96%E4%BA%BA%E5%A4%B4%E5%BD%A2%E5%99%A8%E5%8F%A3%E5%BD%A9%E9%99%B6%E7%93%B6.jpg"
IMG_LOTUS = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Yuan_Lotus-shaped_Glass_Calix_%2810096176946%29.jpg/960px-Yuan_Lotus-shaped_Glass_Calix_%2810096176946%29.jpg"

IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"

TREASURES = [
    {
        "name": "铜奔马（马踏飞燕）",
        "dynasty": "东汉",
        "category": "青铜器",
        "imageUrl": IMG_TONGBENMA,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E9%9B%B7%E5%8F%B0%E6%B1%89%E5%A2%93%E9%93%9C%E5%A5%94%E9%A9%AC3.jpg",
        "description": "东汉青铜器，1969年出土于甘肃武威雷台汉墓。通高34.5厘米、长45厘米、宽13.1厘米、重7.3千克。作骏马昂首嘶鸣、疾足奔驰状，三足腾空，一足踏掠飞鸟（燕），摄取奔马超越飞鸟的一瞬；全身着力点集注于踏鸟一足之上，精确掌握力学平衡原理，工艺卓绝。1983年被确定为中国旅游标志，1986年鉴定为国宝级文物，2002年列入首批禁止出境展览文物名录，是丝绸之路精神的象征、甘肃省博物馆“镇馆之宝”。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "三猎",
        "attribution": "三猎 / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "人头形器口彩陶瓶",
        "dynasty": "新石器时代（仰韶文化）",
        "category": "彩陶",
        "imageUrl": IMG_HEADPOT,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E4%BB%B0%E9%9F%B6%E6%96%87%E5%8C%96%E4%BA%BA%E5%A4%B4%E5%BD%A2%E5%99%A8%E5%8F%A3%E5%BD%A9%E9%99%B6%E7%93%B6.jpg",
        "description": "仰韶文化中期（庙底沟类型）彩陶，1973年出土于甘肃秦安大地湾遗址。高32.3厘米、口径4厘米、底径6.8厘米，细泥红陶质地。瓶口雕塑为圆雕人头像：挺鼻小嘴、齐刘海、双耳有系挂饰物小孔；瓶身绘黑彩弧线三角纹与变体鸟纹。是大地湾出土上千件陶器中唯一塑有人像的彩陶瓶，将人头与葫芦瓶巧妙结合，体现先民对自身力量的认识与艺术再现能力。2013年列入第三批禁止出境展览文物名录。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "三猎",
        "attribution": "三猎 / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "莲花玻璃托盏",
        "dynasty": "元",
        "category": "玻璃器",
        "imageUrl": IMG_LOTUS,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Yuan_Lotus-shaped_Glass_Calix_(10096176946).jpg",
        "description": "元代玻璃器，出土于甘肃漳县汪世显家族墓。一托一盏，通体半透明蓝色玻璃质，仿莲花造型——托如莲叶，盏似盛开的莲花，是国内迄今出土最完整的一套元代玻璃托盏。造型清丽、工艺精巧，反映了元代玻璃制造工艺的高超水平，是甘肃省博物馆馆藏精品。",
        "rightsType": "CC", "license": "CC0", "copyrightHolder": "Gary Todd",
        "attribution": "Gary Todd / CC0, via Wikimedia Commons",
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
    except Exception:
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
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    entry = next((x for x in meta if x.get("id") == MID), None)
    tags = entry.get("tags", ["丝路文化", "马踏飞燕", "敦煌文化"]) if entry else ["丝路文化", "马踏飞燕", "敦煌文化"]
    kv_data = {
        "id": MID, "name": NAME, "location": "兰州",
        "tags": tags,
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

    d = api_get(f"/api/museums?year={YEAR}&q={urllib.parse.quote(NAME)}&limit=3&_cb={int(time.time()*1000)}")
    r = next((x for x in d.get("museums", []) if x.get("name") == NAME), None)
    photo_ok = bool(r and r.get("imageUrl"))
    print(f"  MySQL photo: image={'Y' if photo_ok else 'N'} vc={r.get('visitorCount') if r else None} -> {'OK' if photo_ok else 'BAD'}")

    d2 = api_get(f"/api/museums/treasures?year={YEAR}&museumName={urllib.parse.quote(NAME)}&province={urllib.parse.quote(PROV)}&limit=10",
                 headers={"Origin": "https://museumcheck.cn"})
    ts = d2.get("treasures") or d2.get("data") or []
    tnames = [t.get("name") for t in ts]
    tre_ok = len(ts) >= 3
    print(f"  MySQL treasures: count={len(ts)} names={tnames} -> {'OK' if tre_ok else 'BAD'}")
    return kv_ok and photo_ok and tre_ok


def main():
    print("=== Image pre-check ===")
    for label, u in [("museum", IMG_MUSEUM), ("铜奔马", IMG_TONGBENMA),
                     ("人头瓶", IMG_HEADPOT), ("莲花盏", IMG_LOTUS)]:
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
