#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把南京博物院里 2 行"更早 seed 会话留下的 Wikimedia 热链" treasures 迁移为自托管。
下载其当前 hotlink 图重传到 museumcheck.cn/images/，再按 (dedupe_key, name) upsert 回写。
（同馆另有 2 行空 URL 遗留行——釉里红岁寒三友纹梅瓶/错银铜牛灯，因 Commons 无自由图无法补，非热链，留库不处理。）
"""
import json, os, urllib.request, urllib.parse, tempfile, time

BASE = "https://museumcheck.cn"
KV = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
DEDUP = "江苏省_南京博物院"

# 2 件热链：下载其 hotlink 重传，生成新 slug
DOWNLOAD = {
    "坤舆万国全图": "nanjing-museum-legacy-kunyu-v1.jpg",
    "银缕玉衣": "nanjing-museum-legacy-yinyu-v1.jpg",
}


def download(url, dest, tries=4):
    cands = [url, "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(url.split("/")[-1]) + "?width=960"]
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
    boundary = "----NJfix%d" % int(time.time() * 1000)
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
    q = urllib.parse.urlencode({"museumName": "南京博物院", "province": "江苏省", "limit": 20})
    req = urllib.request.Request(f"{BASE}/api/museums/treasures?{q}", headers={"Origin": "https://museumcheck.cn"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode())
    return [t for t in (d.get("treasures") or [])
            if (t.get("imageUrl") or "").startswith("http") and "museumcheck.cn" not in t.get("imageUrl")]


def upsert(name, url):
    rec = {"museumDedupeKey": DEDUP, "museumName": "南京博物院", "name": name, "imageUrl": url}
    req = urllib.request.Request(f"{BASE}/api/museums/treasures",
        data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    rows = get_legacy_hotlinks()
    print(f"legacy hotlink rows: {len(rows)}")
    tmp = tempfile.mkdtemp(prefix="nj_fix_")
    for t in rows:
        name = t["name"]; hot = t["imageUrl"]
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
