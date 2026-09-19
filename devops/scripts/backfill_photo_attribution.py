#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
回填 17 个自托管馆照的版权署名到 data/museums-meta.json（馆条目顶层）+ 藏品 sourceType。

来源：各 supplement_*.py 记录的 MUSEUM_PHOTO_COMMONS / photo.commons 文件名，
经 Commons API extmetadata 查询真实 LicenseShortName / Artist / LicenseUrl。

白名单（与既定政策一致）：CC0 / CC BY / CC BY-SA（任意版本）；CC BY-NC* / 无许可一律跳过并报告。
岳阳馆（yueyang-museum）馆照无 Commons 来源记录 → 不标注，单独报告待处理。

字段约定：
  馆条目顶层: imageSourceType / imageLicense / imageCopyrightHolder / imageAttribution / imageSourceUrl
  藏品项:     sourceType = "commons-cc"（仅当 license 通过白名单）

运行：cd ~/MuseumCheck && python3 devops/scripts/backfill_photo_attribution.py
"""
import json, re, sys, time, urllib.parse, urllib.request

META = "data/museums-meta.json"
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}

# museum id -> Commons File title（来自各补馆脚本，2026-09-19 整理）
PHOTO_COMMONS = {
    "forbidden-city": "File:Sunset of the Forbidden City 2006.JPG",
    "national-museum": "File:中国国家博物馆.JPG",
    "shanghai-museum": "File:上海博物馆东馆 161003.jpg",
    "terracotta-warriors": "File:Emperor Qinshihuang's Mausoleum Site Museum.jpg",
    "nanjing-museum": "File:Nanjing Museum big.jpg",
    "hubei-museum": "File:Hubei Provincial Museum.JPG",
    "shaanxi-history": "File:陕西历史博物馆.jpg",
    "henan-museum": "File:20210220 Henan Museum - main hall 01.jpg",
    "shanghai-science-technology-museum": "File:Shanghai Science and Technology Museum glass sphere 20260418.jpg",
    "jiaxing-museum": "File:嘉兴博物馆163043.jpg",
    "pinghu-museum": "File:Pinghu Museum 01 2014-06.JPG",
    "haining-museum": "File:Haining Museum 01 2014-08.JPG",
    "nanhu-revolution-museum": "File:南湖革命纪念馆新馆.jpg",
    "zhenjiang-museum": "File:Zhenjiang Museum 01 2011-10.JPG",
    "lanzhou-museum": "File:Gansu Provincial Museum - 甘肃省博物馆 (17143542340).jpg",
    "shijiazhuang-museum": "File:20250118 Hebei Museum.jpg",
    # "yueyang-museum": 无 Commons 来源记录，馆照 building.jpg 来源不明 → 不回填，见报告
}

ALLOWED = re.compile(r"^CC (0|BY(?:-SA)?)( [\d.]+)?$", re.I)  # CC0 / CC BY x / CC BY-SA x


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def normalize_license(name):
    """Commons 返回形如 'CC BY-SA 4.0' / 'CC0' / 'Public domain'。"""
    return (name or "").strip()


def license_ok(name):
    n = normalize_license(name)
    if re.match(r"^CC0( [\d.]+)?$", n, re.I):  # CC0 / CC0 1.0
        return True
    return bool(ALLOWED.match(n))


def commons_extmeta(titles):
    """一次查询多个 File 的 extmetadata。返回 {title: {license, artist, licenseUrl}}"""
    out = {}
    base = "https://commons.wikimedia.org/w/api.php"
    for i in range(0, len(titles), 10):
        batch = titles[i:i + 10]
        params = {
            "action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "extmetadata", "titles": "|".join(batch),
        }
        url = base + "?" + urllib.parse.urlencode(params)
        data = None
        last_err = None
        for attempt in range(5):  # Commons 抖动已知：多试 + 退避
            try:
                req = urllib.request.Request(url, headers=UA)
                with urllib.request.urlopen(req, timeout=40) as r:
                    data = json.loads(r.read().decode())
                break
            except Exception as e:
                last_err = e
                time.sleep(2 + attempt * 2)
        if data is None:
            raise RuntimeError(f"Commons API 重试 5 次仍失败: {last_err}")
        for pid, page in (data.get("query", {}).get("pages") or {}).items():
            title = page.get("title")
            ii = (page.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata") or {}
            lic = strip_html((em.get("LicenseShortName") or {}).get("value", ""))
            artist = strip_html((em.get("Artist") or {}).get("value", "")).replace("\n", " ")[:120]
            lic_url = strip_html((em.get("LicenseUrl") or {}).get("value", ""))
            out[title] = {"license": lic, "artist": artist, "licenseUrl": lic_url}
        time.sleep(0.5)
    return out


def file_page_url(title):
    return "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))


def main():
    ms = json.load(open(META))
    by_id = {m["id"]: m for m in ms}

    # 1. 查询全部馆照 extmetadata
    infos = commons_extmeta(list(PHOTO_COMMONS.values()))
    # Commons title 规范化差异（下划线/空格），建反向索引
    norm = {t.replace("_", " ").lower(): v for t, v in infos.items()}

    problems, ok_cnt = [], 0
    for mid, title in PHOTO_COMMONS.items():
        m = by_id.get(mid)
        if not m:
            problems.append(f"{mid}: meta 中无此馆"); continue
        if not (isinstance(m.get("image"), str) and m["image"].startswith("https://museumcheck.cn/images/")):
            problems.append(f"{mid}: 馆照非自托管，跳过"); continue
        info = norm.get(title.replace("_", " ").lower())
        if not info:
            problems.append(f"{mid}: Commons 查无 {title}"); continue
        lic = info["license"]
        if not license_ok(lic):
            problems.append(f"{mid}: 许可「{lic}」不在白名单，拒绝标注"); continue
        artist = info["artist"] or "Wikimedia Commons"
        attribution = f"{lic}, via Wikimedia Commons" if artist.lower() in ("wikimedia commons", "") \
            else f"{artist} / {lic}, via Wikimedia Commons"
        m["imageSourceType"] = "commons-cc"
        m["imageLicense"] = lic
        m["imageCopyrightHolder"] = artist
        m["imageAttribution"] = attribution
        m["imageSourceUrl"] = file_page_url(title)
        ok_cnt += 1
        print(f"  ✓ {mid}: {lic} | {artist[:40]}")

    # 2. 藏品 sourceType：仅当已有 license 且过白名单
    t_ok = t_skip = 0
    for m in ms:
        for c in (m.get("collections") or []):
            lic = c.get("license") or ""
            if license_ok(lic) or lic.lower() == "public domain":
                c["sourceType"] = "commons-cc"
                t_ok += 1
            else:
                t_skip += 1
                problems.append(f"{m['id']}/{c.get('name')}: 藏品许可「{lic}」未过白名单，未标 sourceType")

    json.dump(ms, open(META, "w"), ensure_ascii=False, indent=2)
    print(f"\n馆照署名回填: {ok_cnt}/{len(PHOTO_COMMONS)}；藏品 sourceType: {t_ok} 标注 / {t_skip} 跳过")
    if problems:
        print("\n需人工处理:")
        for p in problems:
            print("  ⚠ " + p)
    print("\n下一步: node devops/tools/generate-museums-meta-js.js")


if __name__ == "__main__":
    main()
