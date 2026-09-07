#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sync the check-in system's curated museums / photos / treasures into MySQL.

Sources (LOCAL truth):
  - data/museums-meta.json  -> 119 curated museums (id,name,location,image,level,hasCollections)
  - KV museum-data-<id>     -> per-museum collections[] (name,imageUrl,description)

Targets (production MySQL via open APIs):
  - museums          (POST /api/museums/ingest)   -- museum photo + level
  - museum_treasures (POST /api/museums/treasures)-- 镇馆之宝

SAFETY:
  - Treasures go to a SEPARATE table with no visitorCount -> safe.
  - New museums (not in MySQL) -> safe full insert.
  - Existing museums with NON-NULL visitorCount CANNOT be patched via /api/museums/ingest
    because upsertMuseums runs visitorCount through parseVisitor() (x10000) on every write,
    which would corrupt the stored absolute value. Setting image_url on those requires a
    targeted server-side `UPDATE museums SET image_url=? WHERE dedupe_key=?` (SSH, needs approval).
    This script therefore only INSERTS new museums via the API and reports the existing ones
    that need the SSH patch for their photo.

Modes:
  --assess            read-only: report what a sync would do (counts, province coverage, risk)
  --sync-treasures    fetch KV collections for hasCollections museums -> upsert museum_treasures
  --sync-new-museums  insert curated museums that are NOT yet in MySQL (with image_url + level)
"""
import json, sys, urllib.request, urllib.parse, argparse, time, re

BASE = "https://museumcheck.cn"
YEAR = 2026
UA = {"User-Agent": "Mozilla/5.0"}
META = "/Users/jak/MuseumCheck/data/museums-meta.json"

# city (meta.location) -> province string used in MySQL dedupe key (province_name)
CITY2PROV = {
    "北京": "北京市", "上海": "上海市", "天津": "天津市", "重庆": "重庆市",
    "西安": "陕西省", "南京": "江苏省", "武汉": "湖北省", "成都": "四川省",
    "杭州": "浙江省", "郑州": "河南省", "沈阳": "辽宁省", "济南": "山东省",
    "广州": "广东省", "昆明": "云南省", "福州": "福建省", "南宁": "广西壮族自治区",
    "兰州": "甘肃省", "石家庄": "河北省", "哈尔滨": "黑龙江省", "长春": "吉林省",
    "合肥": "安徽省", "南昌": "江西省", "贵阳": "贵州省", "海口": "海南省",
    "呼和浩特": "内蒙古自治区", "乌鲁木齐": "新疆维吾尔自治区", "拉萨": "西藏自治区",
    "西宁": "青海省", "太原": "山西省", "长沙": "湖南省", "银川": "宁夏回族自治区",
    "景德镇": "江西省", "泉州": "福建省", "厦门": "福建省", "绍兴": "浙江省",
    "宁波": "浙江省", "无锡": "江苏省", "常州": "江苏省", "扬州": "江苏省",
    "青岛": "山东省", "烟台": "山东省", "临沂": "山东省", "温州": "浙江省",
    "嘉兴": "浙江省", "镇江": "江苏省", "徐州": "江苏省", "舟山": "浙江省",
    "安庆": "安徽省", "邯郸": "河北省", "洛阳": "河南省", "荆州": "湖北省",
    "桂林": "广西壮族自治区", "吉安": "江西省", "上饶": "江西省", "赣州": "江西省",
    "九江": "江西省", "宜昌": "湖北省", "包头": "内蒙古自治区", "保定": "河北省",
    "平湖": "浙江省", "深圳": "广东省", "广州": "广东省", "大连": "辽宁省",
    "苏州": "江苏省",     "大同": "山西省", "江门": "广东省", "岳阳": "湖南省",
}
# direct province-name locations (already province-level)
PROV_DIRECT = {
    "河北": "河北省", "山西": "山西省", "辽宁": "辽宁省", "吉林": "吉林省",
    "黑龙江": "黑龙江省", "江苏": "江苏省", "浙江": "浙江省", "安徽": "安徽省",
    "福建": "福建省", "江西": "江西省", "山东": "山东省", "河南": "河南省",
    "湖北": "湖北省", "湖南": "湖南省", "广东": "广东省", "广西": "广西壮族自治区",
    "海南": "海南省", "四川": "四川省", "贵州": "贵州省", "云南": "云南省",
    "陕西": "陕西省", "甘肃": "甘肃省", "青海": "青海省", "台湾": "台湾省",
    "内蒙古": "内蒙古自治区", "新疆": "新疆维吾尔自治区", "西藏": "西藏自治区",
    "宁夏": "宁夏回族自治区", "北京": "北京市", "上海": "上海市", "天津": "天津市", "重庆": "重庆市",
}
FOREIGN = {"新西兰·奥克兰": "海外"}


def province_of(location):
    if location in FOREIGN:
        return FOREIGN[location]
    if location in PROV_DIRECT:
        return PROV_DIRECT[location]
    if location in CITY2PROV:
        return CITY2PROV[location]
    return None


def api_get(path):
    url = BASE + path
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def api_post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={"Content-Type": "application/json", **UA}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, json.loads(r.read().decode("utf-8"))


def kv_get(key):
    url = f"https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore?key={urllib.parse.quote(key)}&sortKey=*"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        d = json.load(r)
    v = d.get("value")
    if isinstance(v, str):
        try:
            v = json.loads(v)
        except Exception:
            return None
    # value may be a list of envelope objects {expireAt, value(json-string)}
    if isinstance(v, list):
        for item in v:
            if isinstance(item, dict) and "value" in item and isinstance(item["value"], str):
                try:
                    return json.loads(item["value"])
                except Exception:
                    pass
        # maybe plain list of collections
        if v and isinstance(v[0], dict) and ("name" in v[0] or "imageUrl" in v[0]):
            return {"collections": v}
    if isinstance(v, dict):
        return v
    return None


def load_meta():
    return json.load(open(META))


def norm_name(s):
    if not s:
        return ""
    # strip parentheticals （）()【】[]「」 and whitespace; museums stored under
    # official names like '苏州博物馆（苏州民俗博物馆…）' must match meta '苏州博物馆'
    s = re.sub(r"[（(【[].*?[）)】\]]", "", str(s))
    return re.sub(r"\s+", "", s)


def names_match(stored, meta):
    ns, nm = norm_name(stored), norm_name(meta)
    if not ns or not nm:
        return False
    return ns == nm or ns.startswith(nm) or nm.startswith(ns)


def resolve(museum):
    """Find the existing MySQL museums row for a curated meta museum.

    Production stores OFFICIAL names that may carry parentheticals, so an exact
    name match fails and would otherwise cause false 'new' inserts, skipped
    photo patches, and DUPLICATE rows (different dedupe_key). Match by
    normalized name instead. Returns the row dict (real `name`+`dedupeKey`) or None.
    """
    name = museum["name"]
    prov = province_of(museum.get("location", "")) or ""
    d = api_get(f"/api/museums?year={YEAR}&q={urllib.parse.quote(name)}&limit=30")
    cands = [r for r in d.get("museums", []) if names_match(r.get("name", ""), name)]
    if not cands:
        return None
    # Prefer the authoritative registry row: one carrying real stats
    # (visitorCount), else the longest official name, else province match.
    # This avoids targeting a stats-less duplicate inserted by an earlier run.
    def score(r):
        has_stats = 1 if r.get("visitorCount") else 0
        long_name = len(r.get("name") or "")
        prov_ok = 1 if (prov and r.get("province") == prov) else 0
        return (has_stats, long_name, prov_ok)
    return sorted(cands, key=score, reverse=True)[0]


def assess():
    meta = load_meta()
    total = len(meta)
    existing, new, risk, already_img, unmapped = [], [], [], [], []
    has_coll = [m for m in meta if m.get("hasCollections")]
    for m in meta:
        prov = province_of(m.get("location", ""))
        if prov is None:
            unmapped.append((m["id"], m.get("location")))
        row = resolve(m)
        if row:
            existing.append(m)
            if row.get("visitorCount"):
                risk.append(m["name"])
            if row.get("imageUrl"):
                already_img.append(m["name"])
        else:
            new.append(m)
    print("=== ASSESS (read-only) ===")
    print(f"curated museums in meta      : {total}")
    print(f"  already in MySQL          : {len(existing)}")
    print(f"  NOT in MySQL (new insert) : {len(new)}")
    print(f"  hasCollections (treasures): {len(has_coll)}")
    print(f"existing w/ NON-NULL visitorCount (API-photo-patch would CORRUPT): {len(risk)}")
    print(f"existing already having image_url (photo not needed)              : {len(already_img)}")
    print(f"unmapped locations (need province)                                : {len(unmapped)}")
    if unmapped:
        print("  UNMAPPED:", unmapped)
    # treasures count
    tc = 0
    print("\n--- per hasCollections museum (KV collections) ---")
    for m in has_coll:
        obj = kv_get(f"museum-data-{m['id']}")
        n = len(obj.get("collections", [])) if obj else 0
        tc += n
        print(f"  {m['name']:<16} id={m['id']:<28} collections={n}")
    print(f"\nTOTAL treasures to sync: {tc}")


def sync_treasures():
    meta = load_meta()
    has_coll = [m for m in meta if m.get("hasCollections")]
    total = 0
    for m in has_coll:
        prov = province_of(m.get("location", "")) or "未知"
        row = resolve(m)
        obj = kv_get(f"museum-data-{m['id']}")
        cols = obj.get("collections", []) if obj else []
        if not cols:
            print(f"  SKIP {m['name']}: no collections in KV")
            continue
        records = []
        for c in cols:
            name = c.get("name")
            if not name:
                continue
            rec = {
                "museumProvince": prov,
                "museumName": m["name"],
                "name": name,
                "dynasty": None,
                "category": None,
                "description": c.get("description", ""),
                "imageUrl": c.get("imageUrl"),
                "sourceUrl": None,
                "rightsType": "CC",
                "license": None,
                "copyrightHolder": None,
                "attribution": "Wikimedia Commons (来源推断，具体许可证未逐条核验)",
                "imageRightsNote": "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。",
            }
            # Link treasure to the REAL museum row's dedupe_key so the paid
            # product (which resolves the museum row first) can find it.
            if row and row.get("dedupeKey"):
                rec["museumDedupeKey"] = row["dedupeKey"]
            records.append(rec)
        if records:
            st, body = api_post("/api/museums/treasures", {"year": YEAR, "records": records})
            ok = body.get("upserted", 0)
            total += ok
            print(f"  {m['name']:<16} status={st} upserted={ok}/{len(records)}")
    print(f"\nTOTAL treasures upserted: {total}")


def _inverse_visitor(absolute_str):
    """Return the value that, passed through parseVisitor() (x10000), reproduces
    the stored absolute visitorCount. parseVisitor(v)=round(parseFloat(v)*10000).
    So v = absolute/10000. We verify the round-trip; if it doesn't reproduce,
    return None (caller must skip to avoid corrupting data)."""
    if absolute_str is None:
        return None
    try:
        a = int(str(absolute_str).replace(",", ""))
    except Exception:
        return None
    if a == 0:
        return 0
    x = a / 10000.0
    # simulate parseVisitor
    import math
    if round(x * 10000) != a:
        return None
    return x


def sync_photos_existing(test_one=False):
    """Patch image_url for museums ALREADY in MySQL, preserving ALL other columns.
    Uses read-modify-write via /api/museums/ingest with visitorCount sent as the
    inverse (absolute/10000) so parseVisitor() reproduces the original value exactly.
    This avoids the x10000 corruption AND avoids needing SSH.
    """
    meta = load_meta()
    patch = []
    for m in meta:
        row = resolve(m)
        if not row:
            continue
        if not m.get("image"):
            continue
        if row.get("imageUrl"):
            continue
        patch.append((m, row))
    if test_one and patch:
        patch = patch[:1]
    print(f"patching {len(patch)} existing museums (image_url only, stats preserved)")
    ok = 0
    for m, row in patch:
        inv = _inverse_visitor(row.get("visitorCount"))
        if inv is None and row.get("visitorCount") is not None:
            print(f"  SKIP {m['name']}: visitorCount round-trip unsafe -> {row.get('visitorCount')}")
            continue
        rec = {
            "province": row.get("province"),
            "name": row.get("name"),
            "sequenceNumber": row.get("sequenceNumber"),
            "nature": row.get("nature"),
            "qualityGrade": row.get("qualityGrade") or m.get("level"),
            "freeAdmission": row.get("freeAdmission"),
            "city": row.get("city"),
            "address": row.get("address"),
            "collectionCount": row.get("collectionCount"),
            "preciousArtifactsCount": row.get("preciousArtifactsCount"),
            "exhibitionsCount": row.get("exhibitionsCount"),
            "educationalActivitiesCount": row.get("educationalActivitiesCount"),
            "visitorCount": inv,
            "imageUrl": m.get("image"),
            "sourceUrl": row.get("sourceUrl"),
        }
        st, body = api_post("/api/museums/ingest", {"year": YEAR, "records": [rec]})
        if not body.get("success"):
            print(f"  FAIL {m['name']}: {body}")
            continue
        # VERIFY with cache-busting retry (GET may be CDN-cached stale right after write)
        # Match the RESOLVED real row's name, NOT m["name"] (meta exact) — otherwise a
        # stats-less duplicate row with the exact meta name would be checked instead.
        real_name = row.get("name")
        row2 = None
        for attempt in range(5):
            r2list = api_get(f"/api/museums?year={YEAR}&q={urllib.parse.quote(m['name'])}"
                             f"&limit=10&_cb={int(time.time()*1000)+attempt}").get("museums", [])
            row2 = next((x for x in r2list if x.get("name") == real_name), None)
            if row2 and row2.get("imageUrl") == m.get("image"):
                break
            time.sleep(1)
        vc_ok = (row2.get("visitorCount") == row.get("visitorCount"))
        img_ok = (row2.get("imageUrl") == m.get("image"))
        if vc_ok and img_ok:
            ok += 1
            print(f"  OK   {m['name']:<16} visitorCount preserved image set")
        else:
            print(f"  !!   {m['name']:<16} MISMATCH vc_ok={vc_ok} img_ok={img_ok} "
                  f"(before vc={row.get('visitorCount')} after vc={row2.get('visitorCount')})")
    print(f"\npatched OK: {ok}/{len(patch)}")


def sync_new_museums():
    meta = load_meta()
    inserted = 0
    for m in meta:
        row = resolve(m)
        if row:
            continue  # existing (name-variant matched) -> handled by photo patch, not insert
        prov = province_of(m.get("location", ""))
        if prov is None:
            print(f"  SKIP (unmapped prov) {m['name']} loc={m.get('location')}")
            continue
        rec = {
            "province": prov,
            "name": m["name"],
            "qualityGrade": m.get("level"),
            "imageUrl": m.get("image") or None,
            "freeAdmission": None, "nature": None,
            "collectionCount": None, "preciousArtifactsCount": None,
            "exhibitionsCount": None, "educationalActivitiesCount": None,
            "visitorCount": None, "sequenceNumber": None, "sourceUrl": None,
        }
        st, body = api_post("/api/museums/ingest", {"year": YEAR, "records": [rec]})
        if body.get("success"):
            inserted += 1
            print(f"  INSERT {m['name']:<16} prov={prov} img={'Y' if rec['imageUrl'] else '-'} -> {st}")
        else:
            print(f"  FAIL   {m['name']:<16} {body}")
    print(f"\nTOTAL new museums inserted: {inserted}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--assess", action="store_true")
    ap.add_argument("--sync-treasures", action="store_true")
    ap.add_argument("--sync-new-museums", action="store_true")
    ap.add_argument("--sync-photos-existing", action="store_true")
    ap.add_argument("--test-one", action="store_true")
    args = ap.parse_args()
    if args.assess:
        assess()
    elif args.sync_treasures:
        sync_treasures()
    elif args.sync_new_museums:
        sync_new_museums()
    elif args.sync_photos_existing:
        sync_photos_existing(test_one=args.test_one)
    else:
        print("usage: --assess | --sync-treasures | --sync-new-museums | --sync-photos-existing [--test-one]")
