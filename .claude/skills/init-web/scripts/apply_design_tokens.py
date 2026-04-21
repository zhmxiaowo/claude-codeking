#!/usr/bin/env python3
"""
Parse the project-root DESIGN.md and write its design tokens into
frontend/src/style.css's @theme block (Tailwind v4 format).

Usage:
    python apply_design_tokens.py \\
        --design-md ./DESIGN.md \\
        --target frontend/src/style.css

DESIGN.md parsing is intentionally tolerant: we look for recognisable
fenced token lines or `name: #hex` style rows inside the Color Palette,
Typography, and Layout/Radius sections. Unparseable sections fall back
to the neutral defaults already present in style.css.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path


HEX_PATTERN = re.compile(r"#[0-9a-fA-F]{3,8}")
HEADING_PATTERN = re.compile(r"^#{1,4}\s+(.+?)\s*$")
TOKEN_ROW_PATTERN = re.compile(
    r"""
    ^\s*[-*]?\s*                    # optional list bullet
    \*{0,2}                         # optional bold
    (?P<name>[A-Za-z][\w\s/\-]*?)   # token name
    \*{0,2}
    \s*[:\|=]\s*                    # separator
    (?P<value>[^\n]+?)              # raw value
    \s*$
    """,
    re.VERBOSE,
)


@dataclass
class Tokens:
    colors: dict[str, str] = field(default_factory=dict)
    font_sans: str | None = None
    font_mono: str | None = None
    radius: str | None = None


def split_sections(md: str) -> dict[str, list[str]]:
    """Return {section_title_lower: [lines]}"""
    sections: dict[str, list[str]] = {"_preamble": []}
    current = "_preamble"
    for line in md.splitlines():
        m = HEADING_PATTERN.match(line)
        if m:
            current = m.group(1).strip().lower()
            sections.setdefault(current, [])
            continue
        sections[current].append(line)
    return sections


def extract_tokens(md: str) -> Tokens:
    tokens = Tokens()
    sections = split_sections(md)

    # Color section: anything whose heading mentions "color" or "palette"
    color_lines: list[str] = []
    for title, lines in sections.items():
        if "color" in title or "palette" in title:
            color_lines.extend(lines)
    for line in color_lines:
        m = TOKEN_ROW_PATTERN.match(line)
        if not m:
            continue
        name = m.group("name").strip().lower()
        value = m.group("value").strip()
        hex_match = HEX_PATTERN.search(value)
        if not hex_match:
            continue
        hex_value = hex_match.group(0)
        # Map common names to CSS var names
        key = _canonical_color_key(name)
        if key:
            tokens.colors[key] = hex_value

    # Typography
    typo_lines: list[str] = []
    for title, lines in sections.items():
        if "typograph" in title or "font" in title:
            typo_lines.extend(lines)
    for line in typo_lines:
        m = TOKEN_ROW_PATTERN.match(line)
        if not m:
            continue
        name = m.group("name").strip().lower()
        value = m.group("value").strip().strip("`").strip('"').strip("'")
        if any(k in name for k in ("body", "sans", "primary font", "base font")):
            if not tokens.font_sans:
                tokens.font_sans = value
        elif any(k in name for k in ("mono", "code")):
            if not tokens.font_mono:
                tokens.font_mono = value
        elif "font" in name and not tokens.font_sans:
            tokens.font_sans = value

    # Radius (may live under Layout / Effects / Depth)
    layout_lines: list[str] = []
    for title, lines in sections.items():
        if any(k in title for k in ("layout", "radius", "effect", "depth", "elevation")):
            layout_lines.extend(lines)
    for line in layout_lines:
        m = TOKEN_ROW_PATTERN.match(line)
        if not m:
            continue
        name = m.group("name").strip().lower()
        value = m.group("value").strip()
        if "radius" in name and not tokens.radius:
            radius_match = re.search(r"(\d+(\.\d+)?(px|rem|em))", value)
            if radius_match:
                tokens.radius = radius_match.group(1)

    return tokens


def _canonical_color_key(name: str) -> str | None:
    name = name.replace("_", "-")
    direct = {
        "primary": "primary",
        "secondary": "secondary",
        "accent": "accent",
        "background": "background",
        "bg": "background",
        "surface": "background",
        "foreground": "foreground",
        "text": "foreground",
        "muted": "muted",
        "muted foreground": "muted-foreground",
        "muted-foreground": "muted-foreground",
        "border": "border",
        "destructive": "destructive",
        "danger": "destructive",
        "success": "success",
        "warning": "warning",
        "info": "info",
    }
    n = name.strip().lower()
    if n in direct:
        return direct[n]
    # partial match fallback
    for key, mapped in direct.items():
        if key in n:
            return mapped
    return None


def render_theme_block(tokens: Tokens) -> str:
    lines = ["@theme {"]
    defaults = {
        "primary": "#0f172a",
        "background": "#ffffff",
        "foreground": "#0f172a",
        "muted": "#f1f5f9",
        "muted-foreground": "#64748b",
        "border": "#e2e8f0",
    }
    merged = {**defaults, **tokens.colors}
    for key, value in merged.items():
        lines.append(f"  --color-{key}: {value};")
    font_sans = tokens.font_sans or "Inter"
    font_mono = tokens.font_mono or "JetBrains Mono"
    lines.append(f'  --font-sans: "{font_sans}", ui-sans-serif, system-ui, sans-serif;')
    lines.append(f'  --font-mono: "{font_mono}", ui-monospace, monospace;')
    lines.append(f"  --radius: {tokens.radius or '0.5rem'};")
    lines.append("}")
    return "\n".join(lines)


def rewrite_style_css(target: Path, theme_block: str) -> None:
    if not target.exists():
        raise SystemExit(f"target stylesheet not found: {target}")
    text = target.read_text(encoding="utf-8")
    theme_re = re.compile(r"@theme\s*\{[^}]*\}", re.DOTALL)
    if theme_re.search(text):
        new_text = theme_re.sub(theme_block, text, count=1)
    else:
        # Append after the @import line, or at end
        if "@import" in text:
            parts = text.split("\n", 1)
            new_text = parts[0] + "\n\n" + theme_block + "\n\n" + (parts[1] if len(parts) > 1 else "")
        else:
            new_text = theme_block + "\n\n" + text
    target.write_text(new_text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply DESIGN.md tokens to Tailwind @theme block.")
    parser.add_argument("--design-md", required=True, help="path to project DESIGN.md")
    parser.add_argument("--target", required=True, help="path to frontend style.css")
    args = parser.parse_args()

    design_path = Path(args.design_md)
    if not design_path.exists():
        print(json.dumps({"ok": False, "error": f"DESIGN.md not found at {design_path}"}))
        return 1

    tokens = extract_tokens(design_path.read_text(encoding="utf-8"))
    theme_block = render_theme_block(tokens)
    rewrite_style_css(Path(args.target), theme_block)

    summary = {
        "ok": True,
        "applied_colors": list(tokens.colors.keys()),
        "font_sans": tokens.font_sans,
        "font_mono": tokens.font_mono,
        "radius": tokens.radius,
        "target": str(args.target),
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
