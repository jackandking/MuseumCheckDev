#!/usr/bin/env python3
"""
Supplement 河北博物院 data into the MuseumCheck system:

  1. data/museums-meta.json  -> set image + hasCollections + collections (durable source)
  2. KV museum-data-shijiazhuang-museum -> full record (what the check-in page reads)
  3. MySQL museums           -> museum photo (visitorCount preserved via inverse transform)
  4. MySQL museum_treasures  -> 3 镇馆之宝 keyed to the real dedupe_key (河北省_河北博物院)

Treasure info sourced from authoritative public references (河北博物院官网 hebeimuseum.org.cn,
"百姓眼中的镇馆之宝"评选, 公考常识等). Images are from Wikimedia Commons; artists/licences
verified via the Commons API.

Note: the public-voted 河北博物院 "镇馆之宝" trio is 长信宫灯 + 刘胜金缕玉衣 + 中山王铁足大铜鼎
(战国). 中山王铁足大铜鼎 has no freely-licensed image on Commons, so it is substituted here by
错金银四龙四凤铜方案座 (also a 河北博物院 "十大珍宝" + 首批禁止出境展览文物, with a CC BY-SA image).
Swap back if a free 铁足铜鼎 image is found.
"""
import json, sys, time, urllib.request, urllib.parse

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
MID = "shijiazhuang-museum"
NAME = "河北博物院"
PROV = "河北省"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# ---- raw Commons thumb URLs (verified 200 image/jpeg earlier) ----
IMG_MUSEUM = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/20250118_Hebei_Museum.jpg/960px-20250118_Hebei_Museum.jpg"
IMG_CHANGXIN = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/%E9%95%BF%E4%BF%A1%E5%AE%AB%E7%81%AF-%E6%B2%B3%E5%8C%97%E5%8D%9A%E7%89%A9%E9%99%A2.jpg/960px-%E9%95%BF%E4%BF%A1%E5%AE%AB%E7%81%AF-%E6%B2%B3%E5%8C%97%E5%8D%9A%E7%89%A9%E9%99%A2.jpg"
IMG_YUYI = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Jade_burial_suit_of_Liu_Sheng.jpg/960px-Jade_burial_suit_of_Liu_Sheng.jpg"
IMG_LONGFENG = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Bronze_Square_Table_Stand_Decorated_with_Dragon-and-phoenix.jpg/960px-Bronze_Square_Table_Stand_Decorated_with_Dragon-and-phoenix.jpg"

IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"

TREASURES = [
    {
        "name": "长信宫灯",
        "dynasty": "西汉",
        "category": "青铜器",
        "imageUrl": IMG_CHANGXIN,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E9%95%BF%E4%BF%A1%E5%AE%AB%E7%81%AF-%E6%B2%B3%E5%8C%97%E5%8D%9A%E7%89%A9%E9%99%A2.jpg",
        "description": "西汉青铜器，1968年河北满城窦绾墓出土，高48厘米，通体鎏金。作跪地执灯宫女形：灯盘可转动，灯罩屏板可推合以调节亮度与照射方向；宫女右臂中空为烟道，烟灰经衣袖进入体中以保持室内清洁。灯分头、身、右臂、灯座、灯盘、灯罩六部分，均可拆卸清洗，灯体刻“长信尚浴”“阳信家”等铭文65字。被誉为“中华第一灯”，2002年列入首批禁止出境展览文物名录，河北博物院“镇馆之宝”。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Suginami",
        "attribution": "Suginami / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "刘胜金缕玉衣",
        "dynasty": "西汉",
        "category": "玉器",
        "imageUrl": IMG_YUYI,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jade_burial_suit_of_Liu_Sheng.jpg",
        "description": "西汉玉衣，1968年河北满城汉墓（中山靖王刘胜墓）出土。由2498片玉片、约1100克金丝编缀而成，是我国考古发掘中年代最早、保存最完整、规格最高的汉代金缕玉衣，再现了汉代诸侯王丧葬礼制与玉作工艺的巅峰。2002年列入首批禁止出境展览文物名录，河北博物院“镇馆之宝”。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Baomi",
        "attribution": "Baomi / CC BY-SA 4.0, via Wikimedia Commons",
    },
    {
        "name": "错金银四龙四凤铜方案座",
        "dynasty": "战国",
        "category": "青铜器",
        "imageUrl": IMG_LONGFENG,
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Bronze_Square_Table_Stand_Decorated_with_Dragon-and-phoenix.jpg",
        "description": "战国青铜器，1977年河北平山三汲村中山王墓出土。案面已朽，仅存案座，边长47.5厘米。底部两雄两雌跪鹿承托，四龙四凤盘绕纠结组成案身：四龙独首双尾上托斗拱，四凤双翅聚于中央连成半球，凤头自龙尾引颈而出。集铸造、镶嵌、焊接等多种工艺于一身，复杂精巧，是战国中山国青铜工艺的代表作，河北博物院“十大珍宝”之一（首批禁止出境展览文物）。",
        "rightsType": "CC", "license": "CC BY-SA 4.0", "copyrightHolder": "Photographed by Baomi",
        "attribution": "Photographed by Baomi / CC BY-SA 4.0, via Wikimedia Commons",
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


def verify_image(url, tries=4):
    """HEAD then GET-range; retry on 429/5xx/timeout (Commons rate-limits bursts)."""
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA, method="HEAD")
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.status == 200 and r.headers.get("Content-Type", "").startswith("image/")
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < tries - 1:
                time.sleep(2 + attempt * 2); continue
            if e.code in (200, 206):
                return True
        except Exception:
            pass
        try:
            req = urllib.request.Request(url, headers={**UA, "Range": "bytes=0-0"}, method="GET")
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.status in (200, 206) and r.headers.get("Content-Type", "").startswith("image/")
        except Exception:
            if attempt < tries - 1:
                time.sleep(2 + attempt * 2); continue
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
    tags = entry.get("tags", ["燕赵文化", "河北历史", "中山国"]) if entry else ["燕赵文化", "河北历史", "中山国"]
    kv_data = {
        "id": MID, "name": NAME, "location": "石家庄",
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
    for label, u in [("museum", IMG_MUSEUM), ("长信宫灯", IMG_CHANGXIN),
                     ("金缕玉衣", IMG_YUYI), ("四龙四凤", IMG_LONGFENG)]:
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
