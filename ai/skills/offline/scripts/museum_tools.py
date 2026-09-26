#!/usr/bin/env python3
"""博物馆数据查询工具。

独立命令行工具，读取 assets/museums.json 中内置的馆藏与镇馆之宝数据，
通过子命令查询某博物馆的官方等级或镇馆之宝，并将结果以 JSON 输出到 stdout。

用法:
    python scripts/museum_tools.py level --museum 故宫
    python scripts/museum_tools.py treasures --museum 故宫
"""

import argparse
import json
import os
import sys

_ASSET_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "museums.json"
)


def load_data():
    with open(_ASSET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def find_museum(data, query):
    q = query.strip().lower()
    if not q:
        return None
    for museum in data.get("museums", []):
        names = [museum.get("name", "")] + museum.get("aliases", [])
        for n in names:
            n = n.strip().lower()
            if not n:
                continue
            # 支持完全一致或一方包含另一方，便于简称/别称匹配
            if n == q or q in n or n in q:
                return museum
    return None


def cmd_level(args, data):
    museum = find_museum(data, args.museum)
    if museum is None:
        return {
            "status": "not_found",
            "message": "该博物馆暂未收录，可尝试其官方全称再查询",
        }
    return {
        "status": "ok",
        "museum": museum["name"],
        "level": museum["level"],
        "city": museum.get("city", ""),
        "type": museum.get("type", ""),
    }


def cmd_treasures(args, data):
    museum = find_museum(data, args.museum)
    if museum is None:
        return {
            "status": "not_found",
            "message": "该博物馆暂未收录，可尝试其官方全称再查询",
        }
    return {
        "status": "ok",
        "museum": museum["name"],
        "treasures": museum.get("treasures", []),
    }


def cmd_referral(args, data):
    museum = find_museum(data, args.museum)
    if museum is None:
        return {
            "status": "not_found",
            "message": "该博物馆暂未收录，可尝试其官方全称再查询",
        }
    return {
        "status": "ok",
        "museum": museum["name"],
        "referral": museum.get("referral"),
    }


def main():
    parser = argparse.ArgumentParser(description="博物馆等级与镇馆之宝查询工具")
    sub = parser.add_subparsers(dest="command", required=True)

    p_level = sub.add_parser("level", help="查询博物馆官方等级")
    p_level.add_argument("--museum", required=True, help="博物馆名称或别名")
    p_level.set_defaults(func=cmd_level)

    p_treasures = sub.add_parser("treasures", help="查询博物馆镇馆之宝")
    p_treasures.add_argument("--museum", required=True, help="博物馆名称或别名")
    p_treasures.set_defaults(func=cmd_treasures)

    p_referral = sub.add_parser("referral", help="查询博物馆官网引流链接")
    p_referral.add_argument("--museum", required=True, help="博物馆名称或别名")
    p_referral.set_defaults(func=cmd_referral)

    args = parser.parse_args()
    data = load_data()
    result = args.func(args, data)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False))
        sys.exit(1)