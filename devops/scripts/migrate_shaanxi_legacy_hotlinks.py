#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把陕西历史博物馆里 6 行"更早 seed 会话留下的 Wikimedia 热链" treasures 迁移为自托管。
复用已上传图（同名近重复：三彩载乐骆驼俑->t2、兽首玛瑙杯->t1），其余 4 件下载其
当前 hotlink 图重传到 museumcheck.cn/images/，再按 (dedupe_key, name) upsert 回写。
"""
import json, os, urllib.request, urllib.parse, tempfile, time

BASE = "https://museumcheck.cn"
KV = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
DEDUP = "陕西省_陕西历史博物馆"

# 已上传、可直接复用的图（近重复行）
REUSE = {
    "三彩载乐骆驼俑": "https://museumcheck.cn/images/shaanxi-history-t2-v1.jpg",
    "兽首玛瑙杯": "https://museumcheck.cn/images/shaanxi-history-t1-v1.jpg",
}
# 其余 4 件：下载其 hotlink 重传，生成新 slug
DOWNLOAD = {
    "杜虎符": "shaanxi-history-legacy-duhufu-v1.jpg",
    "鎏金舞马衔杯纹银壶": "shaanxi-history-legacy-wuma-v1.jpg",
    "鎏金铁芯铜龙": "shaanxi-history-legacy-tonglong-v1.jpg",
    "青釉提梁倒注壶": "shaanxi-history-legacy-daozhuhu-v1.jpg",
}


def commons_file_from_url(url):
    if "/thumb/" in url:
        seg = url.split("/thumb/", 1)[1].split("/")[-1]
        return urllib.parse.unquote(seg.split("960px-", 1)[1] if seg.startswith("960px-") else seg)
    return urllib.parse.unquote(url.split("/")[-1])


def download(url, dest, tries=4):
    fname = commons_file_from_url(url)
    cands = [url, "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname) + "?width=960"]
    for i in range(tries):
        for c in cands:
            try:
                req = urllib.request.Request(c, headers=UA)
                with urllib.request.urlopen(req, timeout=25) as r:
                    data = r.read()
                if data and len(data) > 100:
                    open(dest, "wb").write(data); return True
            except Exception:
                continue
        time.sleep(1 + i)
    return False


def upload(local, filename, tries=3):
    boundary = "----SXfix%d" % int(time.time() * 1000)
    body = b"\r\n".join([("--" + boundary).encode(),
        ('Content-Disposition: form-data; name="file"; filename="%s"' % filename).encode(),
        b"Content-Type: image/jpeg", b"", open(local, "rb").read()])
    payload = b"\r\n" + body + b"\r\n--" + boundary.encode() + b"--\r\n"
    for i in range(tries):
        try:
            req = urllib.request.Request(BASE + "/image/upload", data=payload,
                headers={"Content-Type": "multipart/form-data; boundary=" + boundary}, method="POST")
            with urllib.request.urlopen(req, timeout=30) as r:
                resp = json.loads(r.read().decode())
            if resp.get("success"):
                return "https://museumcheck.cn/" + resp.get("path")
        except Exception:
            if i < tries - 1: time.sleep(2); continue
    return None


def get_legacy_hotlinks():
    q = urllib.parse.urlencode({"museumName": "陕西历史博物馆", "province": "陕西省", "limit": 20})
    req = urllib.request.Request(f"{BASE}/api/museums/treasures?{q}", headers={"Origin": "https://museumcheck.cn"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode())
    return [t for t in (d.get("treasures") or [])
            if (t.get("imageUrl") or "").startswith("http")
            and "museumcheck.cn" not in t.get("imageUrl")]


def upsert(name, url):
    rec = {"museumDedupeKey": DEDUP, "museumName": "陕西历史博物馆", "name": name, "imageUrl": url}
    req = urllib.request.Request(f"{BASE}/api/museums/treasures",
        data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    rows = get_legacy_hotlinks()
    print(f"legacy hotlink rows: {len(rows)}")
    tmp = tempfile.mkdtemp(prefix="sx_fix_")
    for t in rows:
        name = t["name"]; hot = t["imageUrl"]
        if name in REUSE:
            new = REUSE[name]; print(f"  reuse  {name} -> {new}")
        else:
            slug = DOWNLOAD.get(name)
            if not slug:
                print(f"  ! 跳过（无映射）{name}"); continue
            p = os.path.join(tmp, slug)
            if not download(hot, p):
                print(f"  ! 下载失败 {name}，跳过"); continue
            new = upload(p, slug)
            if not new:
                print(f"  ! 上传失败 {name}，跳过"); continue
            print(f"  upload {name} -> {new}")
        resp = upsert(name, new)
        print(f"    upsert: success={resp.get('success')} upserted={resp.get('upserted')}")


if __name__ == "__main__":
    main()
