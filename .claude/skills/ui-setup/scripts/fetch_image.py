#!/usr/bin/env python3
"""
获取配图工具 - 供 Claude Code 在开发中需要图片时调用。

优先使用 Pexels API 获取真实高清图片，无 API Key 时 fallback 到 Lorem Picsum。

用法：
    python fetch_image.py --query "technology" --count 3 --width 800 --height 400
    python fetch_image.py --width 400 --height 300  # 无 query 则直接返回 Picsum URL
"""

import argparse
import json
import os
import sys

def get_pexels_key():
    """从 ui-config.json 或 api-config.json 读取 Pexels API Key"""
    # 优先从项目根目录的 ui-config.json 读取
    if os.path.exists("ui-config.json"):
        with open("ui-config.json", "r", encoding="utf-8") as f:
            config = json.load(f)
            key = config.get("imageService", {}).get("pexels_key", "")
            if key:
                return key

    # 其次从 skill 目录的 api-config.json 读取
    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_config_path = os.path.join(script_dir, "..", "api-config.json")
    if os.path.exists(api_config_path):
        with open(api_config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            key = config.get("pexels_key", "")
            if key:
                return key

    return ""

def fetch_pexels(query, count, width, height, api_key):
    """调用 Pexels API 获取图片 URL 列表"""
    try:
        import requests
    except ImportError:
        print("Warning: requests 库未安装，fallback 到 Lorem Picsum", file=sys.stderr)
        return None

    headers = {"Authorization": api_key}
    params = {
        "query": query,
        "per_page": count,
        "size": "medium"
    }

    try:
        response = requests.get(
            "https://api.pexels.com/v1/search",
            headers=headers,
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        photos = data.get("photos", [])

        urls = []
        for photo in photos:
            src = photo.get("src", {})
            # 根据请求尺寸选择合适的图片大小
            if width > 940:
                url = src.get("large2x", src.get("original", ""))
            elif width > 350:
                url = src.get("large", src.get("medium", ""))
            else:
                url = src.get("medium", src.get("small", ""))
            if url:
                urls.append(url)

        return urls if urls else None
    except Exception as e:
        print(f"Warning: Pexels API 调用失败: {e}，fallback 到 Lorem Picsum", file=sys.stderr)
        return None

def get_picsum_urls(count, width, height):
    """生成 Lorem Picsum 占位图 URL 列表"""
    urls = []
    for i in range(count):
        # 用 seed 确保同一请求每次返回相同图片
        urls.append(f"https://picsum.photos/seed/{i + 1}/{width}/{height}")
    return urls

def main():
    parser = argparse.ArgumentParser(description="获取配图 URL")
    parser.add_argument("--query", type=str, default="", help="搜索关键词（Pexels）")
    parser.add_argument("--count", type=int, default=1, help="图片数量（默认 1）")
    parser.add_argument("--width", type=int, default=800, help="图片宽度（默认 800）")
    parser.add_argument("--height", type=int, default=400, help="图片高度（默认 400）")
    args = parser.parse_args()

    api_key = get_pexels_key()

    urls = None

    # 有 API Key 且有搜索词时尝试 Pexels
    if api_key and args.query:
        urls = fetch_pexels(args.query, args.count, args.width, args.height, api_key)

    # Fallback 到 Lorem Picsum
    if not urls:
        urls = get_picsum_urls(args.count, args.width, args.height)

    # 输出结果
    result = {
        "source": "pexels" if (api_key and args.query and urls and "picsum" not in urls[0]) else "picsum",
        "urls": urls
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
