#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
二十馆「自托管」馆藏补充（2026-09-20）：
  1) 云南省博物馆      2) 新疆维吾尔自治区博物馆  3) 内蒙古博物院   4) 西藏博物馆
  5) 青海省博物馆      6) 黑龙江省博物馆          7) 吉林省博物院   8) 广西壮族自治区博物馆
  9) 海南省博物馆     10) 福建博物院             11) 重庆中国三峡博物馆 12) 西安博物院
 13) 成都金沙遗址博物馆 14) 洛阳博物馆           15) 荆州博物馆   16) 徐州博物馆
 17) 扬州博物馆      18) 景德镇中国陶瓷博物馆    19) 青岛市博物馆 20) 宁波博物馆

研究结论与如实缺省（重要，勿"补齐"成假数据）：
  - 青岛市博物馆：Commons 只有外景照（StefanTsingtauer / 无知的路人），**无任何自由授权藏品图**
    （北魏石佛造像/明版道藏等均无自由图）→ 本轮只补馆照，藏品如实缺省。
  - 海南省博物馆：drs2biz 的「王子午鼎」「西汉武士俑」虽在 Category:Hainan Museum，
    但王子午鼎系**河南博物院藏器**（借展），不可计作海南馆藏 → 只保留确证馆藏的
    「朱庐执刲」银印 1 件。
  - 新疆维吾尔自治区博物馆：Commons 藏品覆盖极薄，「镇墓兽」原图仅 376x503（可接受下限）。
  - 吉林省博物院：苏轼《洞庭春色赋》卷、张瑀《文姬归汉图》均无自由图，以同馆金代文物替代。
  - 扬州博物馆：国宝元代霁蓝釉白龙纹梅瓶无自由图，以同馆元青花/东汉铜卡尺/西汉铜釭灯替代。
  - 黑龙江省博物馆：「汝窑杯」Commons 原描述为**元代**（哈尔滨幸福乡水田村出土，非北宋汝窑），
    已按元代著录，勿写成北宋。
  - 景德镇中国陶瓷博物馆：EditQ/沈澄心 两组图均无器物名，经逐张看图识别出展签文字后取三件
    （乾隆绿地粉彩八宝纹贲巴瓶 / 民国潘匋宇粉彩四方瓶 / 现代无光白釉白求恩雕塑）。

流程：Commons 下载 → maybe_resize(≤900KB) → /image/upload(409 幂等) → 四端落库 → 重生成 meta.js。
"""
import json, sys, time, os, urllib.request, urllib.parse, urllib.error

BASE = "https://museumcheck.cn"
KV_ENDPOINT = "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
YEAR = 2026
UA = {"User-Agent": "MuseumCheckBot/1.0 (contact: admin@museumcheck.cn)"}
IMG_RIGHTS_NOTE = "图片版权归原作者所有；本服务仅提供信息检索与整理，不包含图片版权授权。"
COMMONS_WIKI = "https://commons.wikimedia.org/wiki/"

CC = lambda h, lic: {"license": lic, "holder": h, "attr": f"{h} / {lic}, via Wikimedia Commons"}
BARE = lambda h: {"license": "Public domain", "holder": h, "attr": f"{h} / Public domain, via Wikimedia Commons"}

MUSEUMS = [
    {
        "mid": "yunnan-museum", "meta_name": "云南省博物馆", "mysql_name": "云南省博物馆",
        "prov": "云南省", "location": "昆明",
        "photo": {"commons": "File:The new Yunnan Provincial Museum.jpg",
                  "filename": "yunnan-museum-photo-v1.jpg", **CC("Zhangmoon618", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "牛虎铜案", "dynasty": "战国", "category": "青铜器",
             "commons": "File:云南省博物馆-战国-江川李家山-牛虎铜案.jpg",
             "filename": "yunnan-museum-t1-v1.jpg",
             "description": "1972年江川李家山墓地出土，以牛为案、虎噬牛尾，滇国青铜文明的标志性重器。",
             **CC("Zhangmoon618", "CC BY-SA 4.0")},
            {"name": "银鎏金镶珠金翅鸟", "dynasty": "大理国", "category": "金银器",
             "commons": "File:大理崇圣寺千寻塔出土-银鎏金镶珠金翅鸟-大理国-云南省博物馆 2025-09-18 02.jpg",
             "filename": "yunnan-museum-t2-v1.jpg",
             "description": "大理崇圣寺千寻塔出土，银质鎏金并嵌珠，大理国佛教艺术的巅峰之作。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "金镶红蓝宝石冠", "dynasty": "明", "category": "金银器",
             "commons": "File:金镶红蓝宝石冠 俯视.jpg",
             "filename": "yunnan-museum-t3-v1.jpg",
             "description": "明代金冠，累丝镶嵌红蓝宝石，出自云南沐氏家族墓葬，金银细工与宝石工艺的合璧。",
             **CC("Cangminzho", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "xinjiang-museum", "meta_name": "新疆维吾尔自治区博物馆", "mysql_name": "新疆维吾尔自治区博物馆",
        "prov": "新疆维吾尔自治区", "location": "乌鲁木齐",
        "photo": {"commons": "File:Xinjiang Uygur Autonomous Region Museum Urumqi Xinjiang China 新疆 乌鲁木齐 "
                             "新疆维吾尔自治区博物馆 - panoramio.jpg",
                  "filename": "xinjiang-museum-photo-v1.jpg", **CC("Hiroki Ogawa", "CC BY 3.0")},
        "treasures": [
            {"name": "“五星出东方利中国”锦护膊", "dynasty": "汉", "category": "纺织品",
             "commons": "File:“五星出东方利中国”护膊.jpg",
             "filename": "xinjiang-museum-t1-v1.jpg",
             "description": "1995年民丰尼雅遗址出土，汉代蜀锦护膊，织有“五星出东方利中国”吉语，首批禁止出境展览文物。",
             **CC("HaziiDozen", "CC BY-SA 4.0")},
            {"name": "伏羲女娲图", "dynasty": "唐", "category": "书画",
             "commons": "File:Anonymous-Fuxi and Nüwa.jpg",
             "filename": "xinjiang-museum-t2-v1.jpg",
             "description": "吐鲁番阿斯塔那古墓出土唐代绢画，人首蛇身的伏羲女娲交尾相拥，丝路多元文化交融的见证。",
             **BARE("anonymous")},
            {"name": "彩绘镇墓兽", "dynasty": "唐", "category": "陶器",
             "commons": "File:镇墓兽 新疆维吾尔自治区博物馆.jpg",
             "filename": "xinjiang-museum-t3-v1.jpg",
             "description": "唐代彩绘泥塑镇墓兽，怒目獠牙、背生双翼，唐代丧葬明器中守护墓主的神兽。",
             **CC("Baomi", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "inner-mongolia-museum", "meta_name": "内蒙古博物院", "mysql_name": "内蒙古博物院",
        "prov": "内蒙古自治区", "location": "呼和浩特",
        "photo": {"commons": "File:20230608 Inner Mongolia Museum and Wulanqiate.jpg",
                  "filename": "inner-mongolia-museum-photo-v1.jpg", **CC("Yumeto", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "匈奴王金冠", "dynasty": "战国", "category": "金银器",
             "commons": "File:匈奴王金冠.jpg",
             "filename": "inner-mongolia-museum-t1-v1.jpg",
             "description": "杭锦旗阿鲁柴登出土，战国匈奴金冠饰，鹰立冠顶、狼羊纹饰带成套，草原文明的巅峰之作。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "钧窑香炉", "dynasty": "元", "category": "瓷器",
             "commons": "File:Inner Mongolia Museum Jun ware incense burner.jpg",
             "filename": "inner-mongolia-museum-t2-v1.jpg",
             "description": "元代钧窑香炉，天蓝釉上晕散紫红斑，钧窑“入窑一色、出窑万彩”的代表作。",
             **CC("BabelStone", "CC BY-SA 3.0")},
            {"name": "四系龙纹壶", "dynasty": "元", "category": "瓷器",
             "commons": "File:Inner Mongolia Museum four-handled pot with dragon decoration.jpg",
             "filename": "inner-mongolia-museum-t3-v1.jpg",
             "description": "2003年乌兰察布集宁路古城遗址出土，元代四系龙纹瓷壶，见证草原丝路的商贸网络。",
             **CC("BabelStone", "CC BY-SA 3.0")},
        ],
    },
    {
        "mid": "tibet-museum", "meta_name": "西藏博物馆", "mysql_name": "西藏博物馆",
        "prov": "西藏自治区", "location": "拉萨",
        "photo": {"commons": "File:Tibet Museum1.jpg",
                  "filename": "tibet-museum-photo-v1.jpg", **CC("Gongfu King", "CC BY-SA 2.0")},
        "treasures": [
            {"name": "嵌宝金嘎乌", "dynasty": "清", "category": "金银器",
             "commons": "File:嘎乌.jpg",
             "filename": "tibet-museum-t1-v1.jpg",
             "description": "藏传佛教随身佩带的嘎乌（护身佛盒），金质嵌松石、珊瑚与宝石，西藏博物馆藏。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "水晶嵌宝佛塔", "dynasty": "民国", "category": "法器",
             "commons": "File:水晶嵌宝佛塔.jpg",
             "filename": "tibet-museum-t2-v1.jpg",
             "description": "民国时期铜鎏金、水晶与宝石合制的藏式佛塔，玲珑剔透，嵌宝工艺的极致体现。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "绿度母坐像", "dynasty": "明（15—16世纪）", "category": "造像",
             "commons": "File:绿度母坐像1.jpg",
             "filename": "tibet-museum-t3-v1.jpg",
             "description": "15—16世纪铜鎏金、泥金彩绘绿度母坐像，藏传佛教中救度众生的女尊造像。",
             **CC("三猎", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "qinghai-museum", "meta_name": "青海省博物馆", "mysql_name": "青海省博物馆",
        "prov": "青海省", "location": "西宁",
        "photo": {"commons": "File:202606 Qinghai Provincial Museum 01.jpg",
                  "filename": "qinghai-museum-photo-v1.jpg", **CC("Jonashtand", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "鹿纹彩陶瓮", "dynasty": "辛店文化（距今约3200年）", "category": "陶器",
             "commons": "File:Painted Pottery Urn With Deer Pattern - Xindian Culture (3200 BP).jpg",
             "filename": "qinghai-museum-t1-v1.jpg",
             "description": "辛店文化彩陶瓮，肩腹以黑彩绘鹿纹，青海河湟地区史前彩陶的代表作。",
             **CC("Byrnzie500", "CC BY-SA 2.0")},
            {"name": "鸟形铜铃", "dynasty": "卡约文化（距今约3200年）", "category": "青铜器",
             "commons": "File:Bird-shaped Bronze Bell. Unearthed in Zhongzhuang tomb of Dahua of "
                        "Huangyuan County. Kayue Culture (3200 BP).jpg",
             "filename": "qinghai-museum-t2-v1.jpg",
             "description": "湟源大华中庄卡约文化墓葬出土的鸟形青铜铃，青海早期青铜文化的珍品。",
             **CC("Byrnzie500", "CC BY-SA 2.0")},
            {"name": "铜矛", "dynasty": "齐家文化（距今约4000年）", "category": "青铜器",
             "commons": "File:Bronze Spear. Unearthed at Shenna, site of Xining. Qijia Culture (4000 BP).jpg",
             "filename": "qinghai-museum-t3-v1.jpg",
             "description": "西宁沈那遗址齐家文化墓葬出土的铜矛，研究中国早期铜器起源的重要实物。",
             **CC("Byrnzie500", "CC BY-SA 2.0")},
        ],
    },
    {
        "mid": "heilongjiang-museum", "meta_name": "黑龙江省博物馆", "mysql_name": "黑龙江省博物馆",
        "prov": "黑龙江省", "location": "哈尔滨",
        "photo": {"commons": "File:黑龙江省博物馆入口2017.jpg",
                  "filename": "heilongjiang-museum-photo-v1.jpg", **CC("Amarespeco", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "金代铜坐龙", "dynasty": "金", "category": "青铜器",
             "commons": "File:铜坐龙-4.jpg",
             "filename": "heilongjiang-museum-t1-v1.jpg",
             "description": "哈尔滨阿城金上京会宁府遗址出土，金代一级文物，龙作蹲坐昂首之姿，黑龙江省博物馆镇馆之宝。",
             **CC("Huanokinhejo", "CC BY-SA 4.0")},
            {"name": "汝窑杯", "dynasty": "元", "category": "瓷器",
             "commons": "File:汝窑杯 黑博.jpg",
             "filename": "heilongjiang-museum-t2-v1.jpg",
             "description": "哈尔滨幸福乡水田村出土的汝窑青釉杯，传世汝窑器极罕，为黑龙江省博物馆藏瓷重器。",
             **CC("Huanokinhejo", "CC BY-SA 4.0")},
            {"name": "渤海国鎏金铜鱼", "dynasty": "唐（渤海国）", "category": "金银器",
             "commons": "File:鎏金铜鱼 唐渤海.jpg",
             "filename": "heilongjiang-museum-t3-v1.jpg",
             "description": "宁安渤海上京城官衙址西南出土，唐代渤海国鎏金铜鱼，渔猎文明的生动写照。",
             **CC("Huanokinhejo", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "jilin-museum", "meta_name": "吉林省博物院", "mysql_name": "吉林省博物院",
        "prov": "吉林省", "location": "长春",
        "photo": {"commons": "File:吉林省博物院新院2017.jpg",
                  "filename": "jilin-museum-photo-v1.jpg", **CC("Amarespeco", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "定窑白釉梅瓶", "dynasty": "金", "category": "瓷器",
             "commons": "File:定窑白釉梅瓶.jpg",
             "filename": "jilin-museum-t1-v1.jpg",
             "description": "金代定窑白釉梅瓶，釉色莹润、器形挺拔，反映金代对定窑白瓷工艺的延续。",
             **{"license": "CC0", "holder": "H2v5o68z", "attr": "H2v5o68z / CC0, via Wikimedia Commons"}},
            {"name": "陶凤鸟", "dynasty": "金", "category": "陶器",
             "commons": "File:金国陶凤鸟.jpg",
             "filename": "jilin-museum-t2-v1.jpg",
             "description": "金代陶塑凤鸟，造型朴拙生动，女真族生活与信仰的实物见证。",
             **{"license": "CC0", "holder": "H2v5o68z", "attr": "H2v5o68z / CC0, via Wikimedia Commons"}},
            {"name": "东夏铁面具", "dynasty": "金末（东夏）", "category": "铁器",
             "commons": "File:东夏铁面具.jpg",
             "filename": "jilin-museum-t3-v1.jpg",
             "description": "东夏国（金末蒲鲜万奴政权）铁面具，研究东夏历史的罕见实物。",
             **{"license": "CC0", "holder": "H2v5o68z", "attr": "H2v5o68z / CC0, via Wikimedia Commons"}},
        ],
    },
    {
        "mid": "nanning-museum", "meta_name": "广西壮族自治区博物馆", "mysql_name": "广西壮族自治区博物馆",
        "prov": "广西壮族自治区", "location": "南宁",
        "photo": {"commons": "File:Guangxi Museum.jpg",
                  "filename": "nanning-museum-photo-v1.jpg", **CC("EditQ", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "翔鹭纹铜鼓", "dynasty": "西汉", "category": "青铜器",
             "commons": "File:翔鹭铜纹鼓.JPG",
             "filename": "nanning-museum-t1-v1.jpg",
             "description": "1976年贵县罗泊湾1号墓出土，鼓身遍布翔鹭与羽人纹，骆越青铜文化的标志物。",
             **CC("Davidzdh", "CC BY-SA 3.0")},
            {"name": "弦纹玻璃杯", "dynasty": "西汉", "category": "玻璃器",
             "commons": "File:弦纹玻璃杯 亮.JPG",
             "filename": "nanning-museum-t2-v1.jpg",
             "description": "1987年合浦文昌塔70号墓出土，西汉弦纹玻璃杯，海上丝绸之路早期交流的直接物证。",
             **CC("Davidzdh", "CC BY-SA 3.0")},
            {"name": "方耳盘口铜鼎", "dynasty": "战国", "category": "青铜器",
             "commons": "File:广西桂林平乐银山岭71号墓-方耳盘口铜鼎-战国-广西壮族自治区博物馆.jpg",
             "filename": "nanning-museum-t3-v1.jpg",
             "description": "桂林平乐银山岭71号墓出土的战国越式青铜鼎，岭南与中原青铜文化交融的见证。",
             **CC("Kcx36", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "haikou-museum", "meta_name": "海南省博物馆", "mysql_name": "海南省博物馆",
        "prov": "海南省", "location": "海口",
        "photo": {"commons": "File:Hainan Museum 01.jpg",
                  "filename": "haikou-museum-photo-v1.jpg",
                  **{"license": "CC0", "holder": "Anna Frodesiak", "attr": "Anna Frodesiak / CC0, via Wikimedia Commons"}},
        "treasures": [
            {"name": "“朱庐执刲”银印", "dynasty": "西汉", "category": "印章",
             "commons": "File:“朱庐执刲”银印.JPG",
             "filename": "haikou-museum-t1-v1.jpg",
             "description": "西汉“朱庐执刲”银印，海南首次发现的汉代官印，中央王朝对海南行使管辖的重要物证。",
             **CC("Davidzdh", "CC BY-SA 3.0")},
        ],
    },
    {
        "mid": "fuzhou-museum", "meta_name": "福建博物院", "mysql_name": "福建博物院",
        "prov": "福建省", "location": "福州",
        "photo": {"commons": "File:福建博物院 02.jpg",
                  "filename": "fuzhou-museum-photo-v1.jpg", **CC("FradonStar", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "林觉民《与妻书》原件", "dynasty": "清（1911年）", "category": "书画",
             "commons": "File:与妻书原件.jpg",
             "filename": "fuzhou-museum-t1-v1.jpg",
             "description": "黄花岗烈士林觉民就义前写给妻子陈意映的绝笔信，字字泣血，福建博物院镇馆之宝。",
             **CC("向史公哲曰", "CC BY-SA 4.0")},
            {"name": "朱熹石刻画像", "dynasty": "清", "category": "石刻",
             "commons": "File:唯一可靠的朱熹画像.jpg",
             "filename": "fuzhou-museum-t2-v1.jpg",
             "description": "清代朱子石刻像，被公认为朱熹唯一可靠的写实肖像，福建博物院藏。",
             **CC("向史公哲曰", "CC BY-SA 4.0")},
            {"name": "西汉独木舟", "dynasty": "西汉", "category": "木器",
             "commons": "File:Western Han Canoe (33295866270).jpg",
             "filename": "fuzhou-museum-t3-v1.jpg",
             "description": "福建出土的西汉独木舟，整木刳成，见证两千年前闽地的水上交通与造船技艺。",
             **{"license": "CC0", "holder": "Gary Todd", "attr": "Gary Todd / CC0, via Wikimedia Commons"}},
        ],
    },
    {
        "mid": "chongqing-three-gorges-museum", "meta_name": "重庆中国三峡博物馆",
        "mysql_name": "重庆中国三峡博物馆", "prov": "重庆市", "location": "重庆",
        "photo": {"commons": "File:重庆中国三峡博物馆 - panoramio.jpg",
                  "filename": "chongqing-three-gorges-museum-photo-v1.jpg", **CC("Nyx Ning", "CC BY-SA 3.0")},
        "treasures": [
            {"name": "三羊铜尊", "dynasty": "商", "category": "青铜器",
             "commons": "File:重庆巫山李家滩-三羊铜尊-商代-重庆中国三峡博物馆.jpg",
             "filename": "chongqing-three-gorges-museum-t1-v1.jpg",
             "description": "巫山李家滩出土的商代三羊铜尊，巴渝地区罕见的商代青铜礼器重器。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "乌杨阙", "dynasty": "东汉", "category": "石阙",
             "commons": "File:Wuyang Que, 2017-09-21 04.jpg",
             "filename": "chongqing-three-gorges-museum-t2-v1.jpg",
             "description": "忠县乌杨镇出土的东汉石阙，我国现存最完整的汉代石阙之一，三峡博物馆镇馆之宝。",
             **CC("Siyuwj", "CC BY-SA 4.0")},
            {"name": "蟠螭纹提梁带盖铜壶", "dynasty": "战国", "category": "青铜器",
             "commons": "File:重庆云阳李家坝-蟠螭纹提梁带盖铜壶-战国-重庆中国三峡博物馆.jpg",
             "filename": "chongqing-three-gorges-museum-t3-v1.jpg",
             "description": "云阳李家坝出土的战国蟠螭纹提梁铜壶，巴文化青铜铸造工艺的代表。",
             **CC("Kcx36", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "xian-museum", "meta_name": "西安博物院", "mysql_name": "西安博物院",
        "prov": "陕西省", "location": "西安",
        "photo": {"commons": "File:西安博物院.jpg",
                  "filename": "xian-museum-photo-v1.jpg", **CC("Sarahshine", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "云纹玉高足杯", "dynasty": "秦", "category": "玉器",
             "commons": "File:20230923 Jade Cup with Cloud Pattern of Qin Dynasty.jpg",
             "filename": "xian-museum-t1-v1.jpg",
             "description": "秦代云纹玉高足杯，玉质温润、杯身饰云纹，西安博物院镇馆之宝。",
             **CC("Windmemories", "CC BY-SA 4.0")},
            {"name": "双耳铜鍪", "dynasty": "西汉", "category": "青铜器",
             "commons": "File:双耳鍪-西汉（前202-25）-西安博物馆藏 2024-10-31.jpg",
             "filename": "xian-museum-t2-v1.jpg",
             "description": "西汉双耳铜鍪，巴蜀地区特有的炊具形制，西安博物院藏。",
             **CC("Kcx36", "CC BY-SA 4.0")},
            {"name": "元驮物马俑", "dynasty": "元", "category": "陶俑",
             "commons": "File:元驮物马俑.jpg",
             "filename": "xian-museum-t3-v1.jpg",
             "description": "西安曲江溪水园王世英墓出土，元代驮物马俑，再现元代驿路运输的日常。",
             **CC("三猎", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "chengdu-jinsha-museum", "meta_name": "成都金沙遗址博物馆",
        "mysql_name": "成都金沙遗址博物馆", "prov": "四川省", "location": "成都",
        "photo": {"commons": "File:金沙遗址博物馆 Jinsha Site Museum 5.jpg",
                  "filename": "chengdu-jinsha-museum-photo-v1.jpg", **CC("xiquinhosilva", "CC BY 2.0")},
        "treasures": [
            {"name": "太阳神鸟金饰", "dynasty": "商周", "category": "金器",
             "commons": "File:太阳神鸟金饰.JPG",
             "filename": "chengdu-jinsha-museum-t1-v1.jpg",
             "description": "金沙遗址出土的商周太阳神鸟金饰，四鸟绕日、十二道光芒，中国文化遗产标志原型。",
             **BARE("Zhangmoon618")},
            {"name": "金面具", "dynasty": "商周", "category": "金器",
             "commons": "File:Golden Mask in Jinsha Site Museum.jpg",
             "filename": "chengdu-jinsha-museum-t2-v1.jpg",
             "description": "金沙遗址出土的商周金面具，捶揲成形，与三星堆金面具一脉相承，古蜀王权与神权的象征。",
             **CC("shenzhuxi", "CC BY-SA 3.0")},
            {"name": "象牙", "dynasty": "商周", "category": "骨器",
             "commons": "File:An ivory tusk in Jinsha Site Museum.jpg",
             "filename": "chengdu-jinsha-museum-t3-v1.jpg",
             "description": "金沙遗址祭祀区出土的成堆象牙，数量以千计，是古蜀人隆重祭祀活动的直接证据。",
             **CC("Yang2018", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "luoyang-museum", "meta_name": "洛阳博物馆", "mysql_name": "洛阳博物馆",
        "prov": "河南省", "location": "洛阳",
        "photo": {"commons": "File:Exterior, Luoyang Museum 20240929.jpg",
                  "filename": "luoyang-museum-photo-v1.jpg", **CC("Tim Wu", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "三彩马", "dynasty": "唐", "category": "陶器",
             "commons": "File:20251026 Sancai-glazed Pottery Horse from Guanlin.jpg",
             "filename": "luoyang-museum-t1-v1.jpg",
             "description": "洛阳关林出土的唐代三彩马，膘肥体健、釉色斑斓，唐三彩中的上乘之作。",
             **CC("Windmemories", "CC BY-SA 4.0")},
            {"name": "商代铜爵", "dynasty": "商", "category": "青铜器",
             "commons": "File:Shang Bronze Jue, Luoyang.jpg",
             "filename": "luoyang-museum-t2-v1.jpg",
             "description": "洛阳出土的商代青铜爵，三足流尾、鋬下铸铭，是商代饮酒礼器的典型形制。",
             **{"license": "CC0", "holder": "Gary Todd", "attr": "Gary Todd / CC0, via Wikimedia Commons"}},
            {"name": "错金银铜鼎", "dynasty": "战国", "category": "青铜器",
             "commons": "File:Warring States Bronze Ding with Gold & Silver Inlay.jpg",
             "filename": "luoyang-museum-t3-v1.jpg",
             "description": "战国错金银铜鼎，器表以金丝银线错嵌纹饰，东周青铜细工工艺的杰作。",
             **{"license": "CC0", "holder": "Gary Todd", "attr": "Gary Todd / CC0, via Wikimedia Commons"}},
        ],
    },
    {
        "mid": "jingzhou-museum", "meta_name": "荆州博物馆", "mysql_name": "荆州博物馆",
        "prov": "湖北省", "location": "荆州",
        "photo": {"commons": "File:Jingzhou Museum.jpg",
                  "filename": "jingzhou-museum-photo-v1.jpg", **CC("Doris Antony", "CC BY-SA 3.0")},
        "treasures": [
            {"name": "越王州句剑", "dynasty": "战国", "category": "青铜器",
             "commons": "File:越王州句剑 01.jpg",
             "filename": "jingzhou-museum-t1-v1.jpg",
             "description": "荆州出土的战国越王州句剑，剑身满布菱形暗格纹并铸鸟篆铭文，荆州博物馆镇馆之宝。",
             **CC("AriaKoi", "CC BY 4.0")},
            {"name": "虎座鸟架鼓", "dynasty": "战国", "category": "漆木器",
             "commons": "File:虎座鸟架鼓（天星观二号墓）.jpg",
             "filename": "jingzhou-museum-t2-v1.jpg",
             "description": "天星观二号楚墓出土的战国虎座鸟架鼓，以双虎为座、凤鸟为架，楚式漆器的巅峰。",
             **CC("三十三画生", "CC BY-SA 4.0")},
            {"name": "彩绘漆木蟾座凤鸟羽人", "dynasty": "战国", "category": "漆木器",
             "commons": "File:彩绘漆木蟾座凤鸟羽人.jpg",
             "filename": "jingzhou-museum-t3-v1.jpg",
             "description": "战国彩绘漆木蟾座凤鸟羽人，人首鸟身立于蟾背，楚人神仙信仰的奇特造像。",
             **CC("三十三画生", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "xuzhou-museum", "meta_name": "徐州博物馆", "mysql_name": "徐州博物馆",
        "prov": "江苏省", "location": "徐州",
        "photo": {"commons": "File:Xuzhou Museum building.jpg",
                  "filename": "xuzhou-museum-photo-v1.jpg", **CC("Huanokinhejo", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "金缕玉衣", "dynasty": "西汉", "category": "玉器",
             "commons": "File:金缕玉衣 狮子山汉墓.jpg",
             "filename": "xuzhou-museum-t1-v1.jpg",
             "description": "1995年狮子山西汉楚王墓出土，用玉片4248片、金丝约1600克连缀，修复后长175厘米，中国出土年代最早、玉片最多的金缕玉衣。",
             **CC("白色瑰宝", "CC BY-SA 4.0")},
            {"name": "S形玉龙佩", "dynasty": "西汉", "category": "玉器",
             "commons": "File:S形玉龙佩.jpg",
             "filename": "xuzhou-museum-t2-v1.jpg",
             "description": "狮子山楚王墓出土的西汉S形玉龙佩，线条流畅矫健，汉代玉雕的杰作与汉代玉龙的经典形象。",
             **CC("白色瑰宝", "CC BY-SA 4.0")},
            {"name": "镶玉漆棺", "dynasty": "西汉", "category": "漆木器",
             "commons": "File:Lacquered Wood Coffin Inlaid with Jade, Shizishan.jpg",
             "filename": "xuzhou-museum-t3-v1.jpg",
             "description": "狮子山楚王墓出土的西汉镶玉漆棺，木胎髹漆并满嵌玉片，汉代最高等级葬具的罕见实物。",
             **CC("Huanokinhejo", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "yangzhou-museum", "meta_name": "扬州博物馆", "mysql_name": "扬州博物馆",
        "prov": "江苏省", "location": "扬州",
        "photo": {"commons": "File:扬州双博馆.jpg",
                  "filename": "yangzhou-museum-photo-v1.jpg", **CC("三猎", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "元青花月影梅纹蒜头瓶", "dynasty": "元", "category": "瓷器",
             "commons": "File:元青花月影梅纹蒜头瓶.jpg",
             "filename": "yangzhou-museum-t1-v1.jpg",
             "description": "元代青花月影梅纹蒜头瓶，青花发色浓艳、纹样疏朗，元代景德镇外销与内销瓷的精品。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "东汉铜卡尺", "dynasty": "东汉", "category": "青铜器",
             "commons": "File:东汉铜卡尺.jpg",
             "filename": "yangzhou-museum-t2-v1.jpg",
             "description": "扬州出土的东汉铜卡尺，由固定尺与滑动尺构成，被誉为世界上最早的游标卡尺之一。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "西汉铜釭灯", "dynasty": "西汉", "category": "铜器",
             "commons": "File:西汉铜釭灯.jpg",
             "filename": "yangzhou-museum-t3-v1.jpg",
             "description": "扬州出土的西汉铜釭灯，带烟管将烟尘导入灯体溶解，体现汉代先进的环保设计智慧。",
             **CC("三猎", "CC BY-SA 4.0")},
        ],
    },
    {
        "mid": "jingdezhen-museum", "meta_name": "景德镇中国陶瓷博物馆",
        "mysql_name": "景德镇中国陶瓷博物馆", "prov": "江西省", "location": "景德镇",
        "photo": {"commons": "File:中国陶瓷博物馆入口.jpg",
                  "filename": "jingdezhen-museum-photo-v1.jpg", **CC("EditQ", "CC BY-SA 4.0")},
        "treasures": [
            {"name": "绿地粉彩八宝纹贲巴瓶", "dynasty": "清乾隆", "category": "瓷器",
             "commons": "File:Jingdezhen China Ceramics Museum 20231020 20.jpg",
             "filename": "jingdezhen-museum-t1-v1.jpg",
             "description": "清乾隆绿地粉彩八宝纹贲巴瓶，器形仿藏式宝瓶、通体绘八吉祥纹，宫廷粉彩的繁丽代表。",
             **{"license": "CC0", "holder": "沈澄心", "attr": "沈澄心 / CC0, via Wikimedia Commons"}},
            {"name": "粉彩花鸟草虫人物图四方瓶", "dynasty": "民国", "category": "瓷器",
             "commons": "File:Jingdezhen China Ceramics Museum 20231020 24.jpg",
             "filename": "jingdezhen-museum-t2-v1.jpg",
             "description": "民国潘匋宇作粉彩四方瓶，一面绘白鹦鹉栖枝、一面题诗，文人瓷画的典型面貌。",
             **{"license": "CC0", "holder": "沈澄心", "attr": "沈澄心 / CC0, via Wikimedia Commons"}},
            {"name": "无光白釉白求恩雕塑", "dynasty": "现代", "category": "瓷塑",
             "commons": "File:Jingdezhen China Ceramics Museum 20231020 36.jpg",
             "filename": "jingdezhen-museum-t3-v1.jpg",
             "description": "现代无光白釉白求恩瓷塑，以景德镇瓷塑语言塑造国际主义战士形象，瓷都现代雕塑的代表。",
             **{"license": "CC0", "holder": "沈澄心", "attr": "沈澄心 / CC0, via Wikimedia Commons"}},
        ],
    },
    {
        "mid": "qingdao-museum", "meta_name": "青岛市博物馆", "mysql_name": "青岛市博物馆",
        "prov": "山东省", "location": "青岛",
        "photo": {"commons": "File:青岛市博物馆正门.jpg",
                  "filename": "qingdao-museum-photo-v1.jpg", **CC("无知的路人", "CC BY-SA 4.0")},
        "treasures": [],   # 如实缺省：Commons 无该馆自由授权藏品图
    },
    {
        "mid": "ningbo-museum", "meta_name": "宁波博物馆", "mysql_name": "宁波博物馆",
        "prov": "浙江省", "location": "宁波",
        "photo": {"commons": "File:宁波博物馆入口.jpg",
                  "filename": "ningbo-museum-photo-v1.jpg",
                  **{"license": "CC BY-SA 4.0", "holder": "User:CatOnMars",
                     "attr": "User:CatOnMars / CC BY-SA 4.0, via Wikimedia Commons"}},
        "treasures": [
            {"name": "战国羽人划舟纹铜钺", "dynasty": "战国", "category": "青铜器",
             "commons": "File:战国羽人划舟纹铜钺.jpg",
             "filename": "ningbo-museum-t1-v1.jpg",
             "description": "宁波出土的战国羽人划舟纹铜钺，器身铸头戴羽冠的划舟人像，宁波博物馆镇馆之宝。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "南宋“绍兴十四年”铭银塔", "dynasty": "南宋", "category": "金银器",
             "commons": "File:南宋“绍兴十四年”铭银塔.jpg",
             "filename": "ningbo-museum-t2-v1.jpg",
             "description": "宁波天封塔地宫出土，塔身铭“绍兴十四年”，南宋金银细工与佛教供养的珍贵实物。",
             **CC("三猎", "CC BY-SA 4.0")},
            {"name": "唐长沙窑褐绿彩奔鹿纹执壶", "dynasty": "唐", "category": "瓷器",
             "commons": "File:唐长沙窑褐绿彩奔鹿纹执壶.jpg",
             "filename": "ningbo-museum-t3-v1.jpg",
             "description": "唐代长沙窑褐绿彩执壶，壶身绘奔鹿纹，是明州港外销瓷贸易的生动见证。",
             **CC("三猎", "CC BY-SA 4.0")},
        ],
    },
]

# —— 以下为通用流程（与既有补馆脚本一致）————————————————————


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


def rights_type(lic):
    return "CC0" if str(lic).lower() in ("cc0", "cc0 1.0", "public domain") else "CC"


def src_url(commons):
    return COMMONS_WIKI + urllib.parse.quote(commons.replace(" ", "_"), safe=":()_,-!~*'")


def patch_meta(m):
    """只补 image / collections，不动既有 name/location/tags/level"""
    meta = json.load(open("data/museums-meta.json", encoding="utf-8"))
    entry = next((x for x in meta if x.get("id") == m["mid"]), None)
    if not entry:
        print("  !! meta.json 无该馆条目，跳过：", m["mid"]); return False
    img = m.get("_img")
    if img:
        entry["image"] = img
        ph = m["photo"]
        entry["imageSourceType"] = "commons-cc"
        entry["imageLicense"] = ph["license"]
        entry["imageCopyrightHolder"] = ph["holder"]
        entry["imageAttribution"] = ph["attr"]
        entry["imageSourceUrl"] = src_url(ph["commons"])
    colls = []
    for t in m["treasures"]:
        colls.append({
            "name": t["name"], "dynasty": t["dynasty"], "category": t["category"],
            "imageUrl": t["imageUrl"], "description": t["description"],
            "sourceUrl": src_url(t["commons"]),
            "rightsType": rights_type(t["license"]),
            "license": t["license"],
            "copyrightHolder": t["holder"],     # 注意：dict 键是 holder/attr
            "attribution": t["attr"],
            "sourceType": "commons-cc",
        })
    if colls:
        entry["hasCollections"] = True
        entry["collections"] = colls
    json.dump(meta, open("data/museums-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"  meta.json 已更新 {m['mid']}（collections={len(colls)}）")
    return True


def write_kv(m):
    existing = kv_get(f"museum-data-{m['mid']}") or {}
    old_cols = existing.get("collections") or []
    user_added = [c for c in old_cols if c.get("isUserAdded")]
    cols = [dict(t, imageRightsNote=IMG_RIGHTS_NOTE) for t in m["treasures"]] + user_added
    if user_added:
        print(f"  (KV 保留 {len(user_added)} 件用户添加藏品: {[c.get('name') for c in user_added]})")
    kv_data = {"id": m["mid"], "name": m["meta_name"], "location": m["location"],
               "tags": existing.get("tags") or [], "image": m.get("_img"), "level": "一级",
               "hasCollections": True, "collections": cols,
               "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    st, _ = kv_post(f"museum-data-{m['mid']}", "museum", kv_data)
    return st == 200


def mysql_photo(m):
    st0, d = http_json(f"{BASE}/api/museums?year={YEAR}&q={urllib.parse.quote(m['mysql_name'])}&limit=5")
    rows = d.get("museums", [])
    row = next((x for x in rows if x.get("name") == m["mysql_name"]), None)
    if not row:
        row = next((x for x in rows if m["mysql_name"] in str(x.get("name", ""))), None)
    if not row:
        print("  ! MySQL row not found for", m["mysql_name"], "| candidates:", [r.get("name") for r in rows])
        return False, None
    real_name = row.get("name")
    vc = row.get("visitorCount"); inv = None
    if vc is not None:
        a = int(str(vc).replace(",", "")); inv = a / 10000.0
        if round(inv * 10000) != a:
            print(f"  ! visitorCount round-trip unsafe ({vc}); 跳过补照"); return False, real_name
    rec = dict(row); rec["imageUrl"] = m.get("_img"); rec["visitorCount"] = inv
    st, body = http_json(f"{BASE}/api/museums/ingest",
                         data=json.dumps({"year": YEAR, "records": [rec]}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200, real_name


def mysql_treasures(m, real_name):
    if not m["treasures"]:
        return True
    dedup = f"{m['prov']}_{real_name}"      # 显式 dedupe key，防孤儿行
    records = [{"museumName": real_name, "name": t["name"], "dynasty": t["dynasty"],
                "category": t["category"], "description": t["description"], "imageUrl": t["imageUrl"],
                "sourceUrl": src_url(t["commons"]), "rightsType": rights_type(t["license"]),
                "license": t["license"], "copyrightHolder": t["holder"], "attribution": t["attr"],
                "imageRightsNote": IMG_RIGHTS_NOTE, "museumDedupeKey": dedup} for t in m["treasures"]]
    st, body = http_json(f"{BASE}/api/museums/treasures",
                         data=json.dumps({"records": records}).encode(),
                         headers={"Content-Type": "application/json"}, method="POST")
    return st == 200


def process(m):
    print("\n################", m["meta_name"], "################")
    tmp = "/tmp/_mcheck_" + m["mid"]
    os.makedirs(tmp, exist_ok=True)
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
    print(f"=== 镇馆之宝（{len(m['treasures'])} 件）===")
    for t in m["treasures"]:
        tp = os.path.join(tmp, t["filename"])
        if not download_commons(t["commons"], tp, width=960):
            print(f"  ABORT {t['name']} 下载失败"); return False
        maybe_resize(tp)
        uu = upload_image(tp, t["filename"])
        if not uu or not verify_public(uu):
            print(f"  ABORT {t['name']} 上传/验证失败"); return False
        t["imageUrl"] = uu
        print(f"  {t['name']}: {uu}")
    print("=== meta.json ==="); patch_meta(m)
    print("=== KV ==="); print("  OK" if write_kv(m) else "  FAIL")
    okp, real_name = mysql_photo(m)
    print("=== MySQL photo ===", "OK" if okp else "FAIL", "real_name=", real_name)
    if not okp: return False
    print("=== MySQL treasures ===", "OK" if mysql_treasures(m, real_name) else "FAIL")
    return True


def main():
    os.chdir(os.path.expanduser("~/MuseumCheck"))
    only = sys.argv[1:] or None
    ok_all = True
    for m in MUSEUMS:
        if only and m["mid"] not in only:
            continue
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
