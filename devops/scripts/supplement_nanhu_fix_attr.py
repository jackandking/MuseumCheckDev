#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
南湖革命纪念馆补充 + 修复嘉兴4馆 meta.json 署名 bug (2026-09-19)
- fix_existing_attr: 修正 jiaxing/pinghu/haining/haiyan 的 collections 署名
  (原脚本 patch_or_add_meta 误把 holder/attr 读成 copyrightHolder/attribution，导致写成 "CC")
- NANHU: 新增南湖革命纪念馆（馆照 + 红船/烟雨楼/湖心岛 三大打卡坐标），四端落库
复用 supplement_jiaxing_museums.py 的 download_commons / maybe_resize / upload_image(409幂等)
/ kv_post / mysql_photo / mysql_treasures（已修映射）。
"""
import importlib.util, os, json, sys

SCRIPT = os.path.expanduser("~/MuseumCheck/devops/scripts/supplement_jiaxing_museums.py")
spec = importlib.util.spec_from_file_location("jx", SCRIPT)
J = importlib.util.module_from_spec(spec)
spec.loader.exec_module(J)

REPO = os.path.expanduser("~/MuseumCheck")
os.chdir(REPO)


def fix_existing_attr():
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    lookup = {}
    for m in J.MUSEUMS:
        for t in m["treasures"]:
            lookup[(m["mid"], t["name"])] = (t.get("holder"), t.get("attr"))
    fixed = 0
    for entry in meta:
        mid = entry.get("id")
        if mid not in ("jiaxing-museum", "pinghu-museum", "haining-museum", "haiyan-museum"):
            continue
        for c in entry.get("collections", []):
            key = (mid, c.get("name"))
            if key in lookup:
                h, a = lookup[key]
                if c.get("copyrightHolder") != h or c.get("attribution") != a:
                    c["copyrightHolder"] = h
                    c["attribution"] = a
                    fixed += 1
    json.dump(meta, open("data/museums-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[fix] 修正 {fixed} 处署名 (嘉兴4馆: jiaxing/pinghu/haining/haiyan)")
    return fixed


NANHU = {
    "mid": "nanhu-revolution-museum",
    "meta_name": "南湖革命纪念馆",
    "mysql_name": "南湖革命纪念馆（红船精神研究院）",
    "prov": "浙江省", "location": "嘉兴", "level": "一级",
    "tags": ["嘉兴", "南湖", "红船", "中共一大", "革命纪念", "亲子"],
    "photo": {"commons": "File:南湖革命纪念馆新馆.jpg", "filename": "nanhu-museum-photo-v1.jpg",
              "license": "CC BY 4.0", "holder": "James2026CN",
              "attr": "James2026CN / CC BY 4.0, via Wikimedia Commons"},
    "treasures": [
        {"name": "南湖红船（纪念船）", "dynasty": "1921年（中共一大闭幕地）", "category": "革命纪念船",
         "commons": "File:南湖红船.jpg", "filename": "nanhu-museum-t1-v1.jpg",
         "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E5%8D%97%E6%B9%96%E7%BA%A2%E8%88%B9.jpg",
         "description": "1921年中共一大在上海开幕，后移至嘉兴南湖一艘画舫上继续举行并闭幕，这艘船被誉为“母亲船”。停泊于湖心岛畔的纪念船是红船精神发源地，带孩子来能直观感受建党历史。",
         "license": "CC BY-SA 4.0", "holder": "Njzjz", "attr": "Njzjz / CC BY-SA 4.0, via Wikimedia Commons"},
        {"name": "烟雨楼", "dynasty": "始建于五代（现存为清代重建）", "category": "江南名楼",
         "commons": "File:嘉兴南湖烟雨楼 - panoramio - 2007-01-01.jpg", "filename": "nanhu-museum-t2-v1.jpg",
         "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E5%98%89%E5%85%B4%E5%8D%97%E6%B9%96%E7%83%9F%E9%9B%A8%E6%A5%BC_-_panoramio_-_2007-01-01.jpg",
         "description": "南湖湖心岛上的江南名楼，乾隆六下江南曾八次登临赋诗。1921年中共一大代表正是在烟雨楼下船、登上红船继续会议，是南湖革命历史空间的核心坐标。",
         "license": "CC BY 3.0", "holder": "江上清风1961", "attr": "江上清风1961 / CC BY 3.0, via Wikimedia Commons"},
        {"name": "南湖湖心岛", "dynasty": "南湖核心景区", "category": "革命历史空间",
         "commons": "File:Jiaxing Lake island嘉兴湖心岛.jpg", "filename": "nanhu-museum-t3-v1.jpg",
         "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jiaxing_Lake_island%E5%98%89%E5%85%B4%E6%B9%96%E5%BF%83%E5%B2%9B.jpg",
         "description": "红船停泊、烟雨楼所在的南湖湖心岛，是中共一大南湖会议的历史现场。登岛漫步，红船与烟雨楼尽收眼底，是亲子红色研学的重要一站。",
         "license": "CC BY-SA 4.0", "holder": "Ddccxl", "attr": "Ddccxl / CC BY-SA 4.0, via Wikimedia Commons"},
    ],
}


def main():
    fix_existing_attr()
    ok = J.process(NANHU)
    print("\n=== 重生成 js/museums-meta.js ===")
    os.system("node devops/tools/generate-museums-meta-js.js")
    print("\n=== 南湖结果:", "OK" if ok else "FAIL ===")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
