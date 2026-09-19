#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
十大省级博物馆「自托管」补充（2026-09-20）：
  1) 苏州博物馆 ★一级（2件：Commons 无第3件自由图镇馆之宝，如实缺省）
  2) 浙江省博物馆 ★一级（2件：彩凤鸣岐琴无自由图）
  3) 广东省博物馆 ★一级
  4) 四川博物院 ★一级
  5) 辽宁省博物馆 ★一级
  6) 山西博物院 ★一级
  7) 首都博物馆 ★一级（KV 已有 3 件 isUserAdded，官方藏品追加在后并保留用户条目）
  8) 安徽博物院 ★一级（KV 已有 3 件 isUserAdded，同上保留）
  9) 江西省博物馆 ★一级（馆照为旧馆外景，新馆 2020 启用，Commons 暂无新馆照）
 10) 贵州省博物馆 ★一级
研究结论备注（可换回项）：
  - 山东博物馆本轮放弃：亚醜钺 Commons 图实为国博藏品（Category:Bronze in the National
    Museum of China），颂簋/九旒冕/红陶兽形壶均无自由图，仅蛋壳黑陶杯有图（单件不成席）。
  - 亚醜钺、鄂君启金节（03699 图为国博）、弋射收获砖（拓片、馆藏不明）均经文件页核验后否决。
流程：Commons 下载 → maybe_resize(≤900KB) → /image/upload(409 幂等) → 四端落库 → 重生成 meta.js。
"""
import json, sys, time, os, urllib.request, urllib.parse, urllib.error

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"

CC = lambda h, lic: {"license": lic, "holder": h, "attr": f"{h} / {lic}, via Wikimedia Commons"}

MUSEUMS = [
    {
        "mid": "suzhou-museum", "meta_name": "苏州博物馆", "mysql_name": "苏州博物馆",
        "prov": "江苏省", "location": "苏州", "level": "一级",
        "tags": ["艺术", "建筑", "江南文化"],
        "photo": {"commons": "File:Suzhou Mesuem Garden & Pool.jpg",
                  "filename": "suzhou-museum-photo-v1.jpg", **CC("CatOnMars", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "真珠舍利宝幢", "dynasty": "北宋", "category": "佛教文物",
             "commons": "File:瑞光寺塔出土真珠舍利宝幢.jpg", "filename": "suzhou-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:瑞光寺塔出土真珠舍利宝幢.jpg",
             "description": "1978年苏州瑞光寺塔第三层天宫出土，楠木雕成、缀珍珠近四万颗，苏博镇馆之宝。",
             **CC("Siyuwj", "CC BY-SA 4.0")},
            {"name": "秘色瓷莲花碗", "dynasty": "五代", "category": "瓷器",
             "commons": "File:虎丘出土五代越窑莲花式托盏.jpg", "filename": "suzhou-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:虎丘出土五代越窑莲花式托盏.jpg",
             "description": "1957年虎丘云岩寺塔天宫出土，越窑秘色瓷代表作，碗与托如盛开的莲花。",
             **CC("Siyuwj", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "zhejiang-museum", "meta_name": "浙江省博物馆", "mysql_name": "浙江省博物馆",
        "prov": "浙江省", "location": "杭州", "level": "一级",
        "tags": ["历史", "文化", "江南"],
        "photo": {"commons": "File:Zhejiang Provincial Museum 72.jpg",
                  "filename": "zhejiang-museum-photo-v1.jpg", **CC("Huandy618", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "富春山居图（剩山图卷）", "dynasty": "元", "category": "书画",
             "commons": "File:Dwelling in the Fuchun Mountains (first half).JPG",
             "filename": "zhejiang-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dwelling_in_the_Fuchun_Mountains_(first_half).JPG",
             "description": "黄公望传世名作《富春山居图》前段，火殉劫余之首，与台北《无用师卷》隔海相望。",
             **CC("Huang Gongwang", "Public domain")},
            {"name": "鎏金纯银阿育王塔", "dynasty": "五代（吴越国）", "category": "金银器",
             "commons": "File:Relics Unearthed from Leifeng Pagoda Site 03 2017-12.jpg",
             "filename": "zhejiang-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Relics_Unearthed_from_Leifeng_Pagoda_Site_03_2017-12.jpg",
             "description": "2001年雷峰塔地宫出土，纯银鎏金佛塔，吴越国崇佛巅峰之作，浙博十大镇馆之宝。",
             **CC("猫猫的日记本", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "guangdong-museum", "meta_name": "广东省博物馆", "mysql_name": "广东省博物馆",
        "prov": "广东省", "location": "广州", "level": "一级",
        "tags": ["岭南文化", "海丝", "文物"],
        "photo": {"commons": "File:Guangzhou Tianhe Guangdong Sheng Bowuguan 2024-06-22 13.28.57.jpg",
                  "filename": "guangdong-museum-photo-v1.jpg", **CC("古海岸遗址", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "千金猴王砚", "dynasty": "清", "category": "端砚",
             "commons": "File:千金猴王砚04899.jpg", "filename": "guangdong-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:千金猴王砚04899.jpg",
             "description": "清末三大名砚之首，端石天然纹理酷似灵猴踞坐，粤博半山出土藏品的镇馆之宝。",
             **CC("Augusthaiho", "CC0")},
            {"name": "楼阁式陶屋", "dynasty": "东汉", "category": "陶器",
             "commons": "File:Guangzhou Tianhe Guangdong Sheng Bowuguan 2024-01-31 16.46.32.jpg",
             "filename": "guangdong-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Guangzhou_Tianhe_Guangdong_Sheng_Bowuguan_2024-01-31_16.46.32.jpg",
             "description": "南海平洲出土的东汉干栏式楼阁陶屋，再现两千年前的岭南民居与生活方式。",
             **CC("古海岸遗址", "CC BY-SA 4.0")},
            {"name": "红陶母鸡", "dynasty": "东汉", "category": "陶器",
             "commons": "File:Guangzhou Tianhe Guangdong Sheng Bowuguan 2024-01-31 16.46.51.jpg",
             "filename": "guangdong-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Guangzhou_Tianhe_Guangdong_Sheng_Bowuguan_2024-01-31_16.46.51.jpg",
             "description": "佛山澜石出土的东汉红陶母鸡，憨态可掬的农家禽畜塑像，岭南陶塑的代表。",
             **CC("古海岸遗址", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "sichuan-museum", "meta_name": "四川博物院", "mysql_name": "四川博物院",
        "prov": "四川省", "location": "成都", "level": "一级",
        "tags": ["巴蜀文化", "历史", "民俗"],
        "photo": {"commons": "File:四川博物院 2024-10-17 02.jpg",
                  "filename": "sichuan-museum-photo-v1.jpg", **CC("Kcx36", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "七盘舞杂技画像砖", "dynasty": "东汉", "category": "画像砖",
             "commons": "File:四川川省彭州市太平乡出土-七盘舞杂技画像砖-东汉（25-220）-四川博物院藏 2024-10-31.jpg",
             "filename": "sichuan-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:四川川省彭州市太平乡出土-七盘舞杂技画像砖-东汉（25-220）-四川博物院藏_2024-10-31.jpg",
             "description": "彭州太平乡出土的东汉画像砖，七盘置地、乐舞倒立其上，再现汉代宴乐百戏。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "涡纹铜罍", "dynasty": "西周", "category": "青铜器",
             "commons": "File:四川省彭县（今彭州市）竹瓦街窖藏出土-涡纹铜罍-西周（前1046-前771）-四川博物院藏 2024-10-31.jpg",
             "filename": "sichuan-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:四川省彭县（今彭州市）竹瓦街窖藏出土-涡纹铜罍-西周（前1046-前771）-四川博物院藏_2024-10-31.jpg",
             "description": "1959年彭县竹瓦街窖藏出土，蜀地罕见的西周青铜礼器重器。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "牛首纹铜钺", "dynasty": "西周", "category": "青铜器",
             "commons": "File:四川彭州濛阳竹瓦街窖藏-牛首纹铜钺-西周-四川博物院.jpg",
             "filename": "sichuan-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:四川彭州濛阳竹瓦街窖藏-牛首纹铜钺-西周-四川博物院.jpg",
             "description": "彭州濛阳竹瓦街窖藏出土，牛首纹青铜钺，古蜀兵仪之器，造型威严。",
             **CC("Kcx36", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "liaoning-museum", "meta_name": "辽宁省博物馆", "mysql_name": "辽宁省博物馆",
        "prov": "辽宁省", "location": "沈阳", "level": "一级",
        "tags": ["东北文化", "考古", "历史"],
        "photo": {"commons": "File:辽宁省博物馆新馆.jpg",
                  "filename": "liaoning-museum-photo-v1.jpg", **CC("Tonyxy1992", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "簪花仕女图", "dynasty": "唐", "category": "书画",
             "commons": "File:Zhou Fang. Court Ladies Wearing Flowered Headdresses. (46x180) Liaoning Provincial Museum, Shenyang..jpg",
             "filename": "liaoning-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Zhou_Fang._Court_Ladies_Wearing_Flowered_Headdresses._(46x180)_Liaoning_Provincial_Museum,_Shenyang..jpg",
             "description": "传为周昉所作的唐代仕女画孤品，六位簪花仕女游园，中国仕女画的典范。",
             **CC("Zhou Fang", "Public domain")},
            {"name": "瑞鹤图", "dynasty": "北宋", "category": "书画",
             "commons": "File:瑞鹤图（亮版）.jpg", "filename": "liaoning-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:瑞鹤图（亮版）.jpg",
             "description": "政和二年上元次夕群鹤盘旋宣德门，宋徽宗亲绘并题诗，诗书画三绝。",
             **CC("Emperor Huizong of Song", "Public domain")},
            {"name": "姑苏繁华图", "dynasty": "清", "category": "书画",
             "commons": "File:Prosperous Suzhou.jpg", "filename": "liaoning-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Prosperous_Suzhou.jpg",
             "description": "乾隆年间徐扬所绘《姑苏繁华图》，十二米长卷记录清代苏州市井繁华。",
             **CC("Xu Yang", "Public domain")},
        ],
    },
    {
        "mid": "taiyuan-museum", "meta_name": "山西博物院", "mysql_name": "山西博物院",
        "prov": "山西省", "location": "太原", "level": "一级",
        "tags": ["晋文化", "青铜器", "古建筑"],
        "photo": {"commons": "File:Shanxi Museum 2025.jpg",
                  "filename": "taiyuan-museum-photo-v1.jpg", **CC("1969社论", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "晋侯鸟尊", "dynasty": "西周", "category": "青铜器",
             "commons": "File:Shanxi Museum - bird-shaped zun.JPG", "filename": "taiyuan-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Shanxi_Museum_-_bird-shaped_zun.JPG",
             "description": "曲沃北赵晋侯墓地114号墓出土，凤鸟回眸、象尾为鋬，山西博物院院徽原型。",
             **CC("Underbar dk", "CC BY-SA 4.0")},
            {"name": "龙形觥", "dynasty": "商", "category": "青铜器",
             "commons": "File:Shanxi Museum - dragon-shaped gong.jpg", "filename": "taiyuan-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Shanxi_Museum_-_dragon-shaped_gong.jpg",
             "description": "1959年石楼桃花庄出土，龙首昂起、鼍纹饰身，商代方国青铜酒器珍品。",
             **CC("Underbar dk", "CC BY-SA 4.0")},
            {"name": "彩绘雁鱼铜灯", "dynasty": "西汉", "category": "青铜器",
             "commons": "File:Shanxi Museum 2009 Taiyuan 869.jpg", "filename": "taiyuan-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Shanxi_Museum_2009_Taiyuan_869.jpg",
             "description": "朔州出土，鸿雁衔鱼造型的环保灯，烟气导入雁腹不染居室。",
             **CC("G41rn8", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "beijing-capital-museum", "meta_name": "首都博物馆", "mysql_name": "首都博物馆",
        "prov": "北京市", "location": "北京", "level": "一级",
        "tags": ["北京历史", "古都文化", "民俗"],
        "photo": {"commons": "File:Capital Museum (20200821160736).jpg",
                  "filename": "beijing-capital-museum-photo-v1.jpg", **CC("N509FZ", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "伯矩鬲", "dynasty": "西周", "category": "青铜器",
             "commons": "File:伯矩鬲.jpg", "filename": "beijing-capital-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:伯矩鬲.jpg",
             "description": "房山琉璃河燕国墓地出土，周身七个牛首，西周燕国青铜器的代表作。",
             **CC("钉钉", "CC BY-SA 4.0")},
            {"name": "青白釉水月观音菩萨像", "dynasty": "元", "category": "瓷塑",
             "commons": "File:青白釉水月觀音菩薩像.JPG", "filename": "beijing-capital-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:青白釉水月觀音菩薩像.JPG",
             "description": "景德镇窑青白釉水月观音，衣纹如真丝垂落，元代瓷塑的巅峰之作。",
             **CC("S M Lee", "Public domain")},
            {"name": "董鼎", "dynasty": "西周早期", "category": "青铜器",
             "commons": "File:首都博物馆藏董鼎.jpg", "filename": "beijing-capital-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:首都博物馆藏董鼎.jpg",
             "description": "房山琉璃河M253出土，通高62厘米，北京地区出土最大最重的青铜礼器，燕都历史之源的见证。",
             **CC("狼狼君", "CC0")},
        ],
    },
    {
        "mid": "hefei-museum", "meta_name": "安徽博物院", "mysql_name": "安徽博物院",
        "prov": "安徽省", "location": "合肥", "level": "一级",
        "tags": ["徽文化", "安徽历史", "新安文化"],
        "photo": {"commons": "File:2012 Anhui Provincial History Museum 3.jpg",
                  "filename": "hefei-museum-photo-v1.jpg", **CC("Gary Lee Todd, Ph.D.", "CC0")},
        "treasures": [
            {"name": "铸客大鼎", "dynasty": "战国（楚）", "category": "青铜器",
             "commons": "File:铸客大鼎1.jpg", "filename": "hefei-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:铸客大鼎1.jpg",
             "description": "1933年寿县李三孤堆楚幽王墓出土，通高113厘米，现存东周第一大铜鼎，俗称楚大鼎。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "金边玛瑙碗", "dynasty": "北宋", "category": "玉石器",
             "commons": "File:北宋金边玛瑙碗.jpg", "filename": "hefei-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:北宋金边玛瑙碗.jpg",
             "description": "宋代玛瑙琢磨珍品，碗口镶金边，安徽博物院镇馆之宝。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "葵花形金盏", "dynasty": "南宋", "category": "金银器",
             "commons": "File:南宋葵花形金盏.jpg", "filename": "hefei-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:南宋葵花形金盏.jpg",
             "description": "南宋六瓣葵花形金盏，锤揲成型、錾刻细腻的饮器精品。",
             **CC("三猎", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "nanchang-museum", "meta_name": "江西省博物馆", "mysql_name": "江西省博物馆",
        "prov": "江西省", "location": "南昌", "level": "一级",
        "tags": ["赣文化", "江西历史", "青铜器"],
        # Commons 暂无 2020 启用的新馆照，先用旧馆外景（待新馆照后换 v2）
        "photo": {"commons": "File:Jiangxi Sheng Bowuguan 20120627-01.jpg",
                  "filename": "nanchang-museum-photo-v1.jpg", **CC("Zhangzhugang", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "伏鸟双尾青铜虎", "dynasty": "商", "category": "青铜器",
             "commons": "File:Jiangxi Provincial Museum 2018.01.20 15-26-29.jpg",
             "filename": "nanchang-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jiangxi_Provincial_Museum_2018.01.20_15-26-29.jpg",
             "description": "1989年新干大洋洲商墓出土，双尾垂地、背上伏鸟的青铜虎王，赣地青铜文明图腾。",
             **CC("Zhangzhugang", "CC BY-SA 4.0")},
            {"name": "双面神人青铜头像", "dynasty": "商", "category": "青铜器",
             "commons": "File:双面神人青铜头像.jpg", "filename": "nanchang-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:双面神人青铜头像.jpg",
             "description": "新干大洋洲出土，中空双面人首，半人半神，全国仅见的商代双面青铜头像。",
             **CC("RoundNoName", "CC BY 4.0")},
            {"name": "兽面纹青铜胄", "dynasty": "商", "category": "青铜器",
             "commons": "File:Jiangxi Provincial Museum 2018.01.20 15-25-00.jpg",
             "filename": "nanchang-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jiangxi_Provincial_Museum_2018.01.20_15-25-00.jpg",
             "description": "新干大洋洲出土的商代铜胄，兽面纹威武狞厉，存世极罕的青铜头盔。",
             **CC("Zhangzhugang", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "guiyang-museum", "meta_name": "贵州省博物馆", "mysql_name": "贵州省博物馆",
        "prov": "贵州省", "location": "贵阳", "level": "一级",
        "tags": ["多民族文化", "贵州历史", "青铜器"],
        "photo": {"commons": "File:贵州省博物馆.jpg",
                  "filename": "guiyang-museum-photo-v1.jpg", **CC("Lkjidm", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "东汉铜车马", "dynasty": "东汉", "category": "青铜器",
             "commons": "File:贵州省博物馆铜车马.jpg", "filename": "guiyang-museum-t1-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:贵州省博物馆铜车马.jpg",
             "description": "兴义万屯汉墓出土，贵州出土最完整的汉代铜车马，“夜郎道”交通文明的实证。",
             **CC("Ycxr2007", "CC BY-SA 4.0")},
            {"name": "虎钮铜錞于", "dynasty": "战国", "category": "青铜器",
             "commons": "File:贵州铜仁松桃木树-虎钮铜錞于-战国-贵州省博物馆.jpg",
             "filename": "guiyang-museum-t2-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:贵州铜仁松桃木树-虎钮铜錞于-战国-贵州省博物馆.jpg",
             "description": "1962年铜仁松桃出土，虎钮錞于是巴人军中乐器，黔地巴文化遗珍。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "长松泉石图", "dynasty": "明", "category": "书画",
             "commons": "File:唐寅《长松泉石图》（局部）.jpg", "filename": "guiyang-museum-t3-v1.jpg",
             "sourceUrl": "https://commons.wikimedia.org/wiki/File:唐寅《长松泉石图》（局部）.jpg",
             "description": "唐寅真迹《长松泉石图》，贵州省博物馆书画类镇馆藏品。",
             **CC("Tang Yin", "Public domain")},
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
                    if ii.get("url"): candidates.append(ii["url"])       # 原图直连优先（/thumb/ 不稳）
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
    boundary = "----McheckBoundary%d" % int(time.time() * 1000)
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


def kv_get(key):
    try:
        st, d = http_json(f"{KV_ENDPOINT}?key={urllib.parse.quote(key)}&sortKey=museum")
        v = d.get("value") if isinstance(d, dict) else None
        if isinstance(v, str):
            v = json.loads(v)
        return v
    except Exception:
        return None


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
            "copyrightHolder": t.get("holder"),   # 修复：dict 键是 holder/attr
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
    # 保留 KV 里已有的用户打卡添加藏品（isUserAdded），官方藏品排后追加
    existing = kv_get(f"museum-data-{m['mid']}") or {}
    old_cols = existing.get("collections") or []
    user_added = [c for c in old_cols if c.get("isUserAdded")]
    cols = [dict(t, imageRightsNote=IMG_RIGHTS_NOTE) for t in m["treasures"]] + user_added
    if user_added:
        print(f"  (KV 保留 {len(user_added)} 件用户添加藏品: {[c.get('name') for c in user_added]})")
    kv_data = {"id": m["mid"], "name": m["meta_name"], "location": m["location"], "tags": m["tags"],
               "image": m.get("_img"), "level": m["level"], "hasCollections": True,
               "collections": cols, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    st, _ = kv_post(f"museum-data-{m['mid']}", "museum", kv_data)
    return st == 200


def mysql_photo(m):
    st0, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(m['mysql_name'])}&limit=5")
    row = next((x for x in d.get("museums", []) if x.get("name") == m["mysql_name"]), None)
    if not row:
        # 全称变体兜底：取搜索结果第一行，人工确认日志
        rows = d.get("museums", [])
        if rows and m["mysql_name"] in str(rows[0].get("name", "")):
            row = rows[0]
        else:
            print("  ! MySQL row not found for", m["mysql_name"],
                  "| candidates:", [r.get("name") for r in rows]); return False, None
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
    dedup = f"{m['prov']}_{real_name}"   # 显式 dedupe key，防孤儿行
    records = []
    for t in m["treasures"]:
        records.append({"museumName": real_name, "name": t["name"], "dynasty": t["dynasty"],
                        "category": t["category"], "description": t["description"], "imageUrl": t["imageUrl"],
                        "sourceUrl": t["sourceUrl"], "rightsType": t.get("rightsType", "CC"), "license": t["license"],
                        "copyrightHolder": t["holder"], "attribution": t["attr"], "imageRightsNote": IMG_RIGHTS_NOTE,
                        "museumDedupeKey": dedup})
    st, body = http_json(f"{BASE}/api/museums/treasures", data=json.dumps({"records": records}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def process(m):
    print("\n################", m["meta_name"], "################")
    tmp = "/tmp/_mcheck_" + m["mid"]
    os.makedirs(tmp, exist_ok=True)
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
        print("=== 馆照：无 Commons 图，留空 ==="); m["_img"] = None
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
    print("=== meta.json ==="); patch_or_add_meta(m)
    print("=== KV ==="); print("  OK" if write_kv(m) else "  FAIL")
    okp, real_name = mysql_photo(m)
    print("=== MySQL photo ===", "OK" if okp else "FAIL", "real_name=", real_name)
    if not okp: return False
    print("=== MySQL treasures ==="); print("  OK" if mysql_treasures(m, real_name) else "  FAIL")
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
