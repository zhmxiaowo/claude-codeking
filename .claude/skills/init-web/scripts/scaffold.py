#!/usr/bin/env python3
"""
Web project scaffold for Tier T1/T2/T3/TB.

Usage:
    python scaffold.py --tier T1 --name my-app
    python scaffold.py --tier T3 --backend --name my-saas
    python scaffold.py --tier TB --name my-api
    python scaffold.py --tier T2 --backend --name my-fullstack

Tier matrix:
    T1 = Vite + Vue 3 + TS + Tailwind v4 (static single-page)
    T2 = T1 + vue-router (content site / small SPA)
    T3 = T2 + pinia + shadcn-vue (admin / SaaS dashboard)
    TB = FastAPI + uv + SQLModel + pydantic-settings (backend only)

Emits JSON summary to stdout (last line) for the caller to parse.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = SCRIPT_DIR / "templates"


@dataclass
class ScaffoldResult:
    tier: str
    project_name: str
    frontend_path: str | None = None
    backend_path: str | None = None
    frontend_deps: list[str] = field(default_factory=list)
    backend_deps: list[str] = field(default_factory=list)
    next_steps: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def run(cmd: list[str] | str, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    shell = isinstance(cmd, str)
    log(f"$ {cmd if shell else ' '.join(cmd)}  (cwd={cwd or os.getcwd()})")
    return subprocess.run(cmd, cwd=cwd, shell=shell, check=check, text=True)


def log(msg: str) -> None:
    print(f"[init-web] {msg}", file=sys.stderr, flush=True)


def render_template(template_path: Path, target_path: Path, vars: dict[str, str]) -> None:
    content = template_path.read_text(encoding="utf-8")
    for key, value in vars.items():
        content = content.replace("{{" + key + "}}", value)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(content, encoding="utf-8")


def ensure_command(cmd: str) -> None:
    if shutil.which(cmd) is None:
        raise SystemExit(f"required command not found on PATH: {cmd}")


def patch_tsconfig_paths(tsconfig_path: Path) -> None:
    """Add baseUrl/paths to tsconfig.app.json compilerOptions (non-destructive)."""
    import re

    text = tsconfig_path.read_text(encoding="utf-8")
    # Strip comments so json.loads works (Vite templates sometimes include them)
    cleaned = re.sub(r"//.*", "", text)
    cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        log(f"WARN: failed to parse {tsconfig_path}, skipping paths patch")
        return
    opts = data.setdefault("compilerOptions", {})
    opts["baseUrl"] = "."
    opts.setdefault("paths", {})["@/*"] = ["src/*"]
    tsconfig_path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def scaffold_frontend(tier: str, project_name: str, project_root: Path, vars: dict[str, str]) -> dict:
    ensure_command("npm")
    frontend_dir = project_root / "frontend"
    if frontend_dir.exists():
        raise SystemExit(f"frontend/ already exists at {frontend_dir}, aborting")

    run(["npm", "create", "vite@latest", "frontend", "--", "--template", "vue-ts"], cwd=project_root)
    run(["npm", "install"], cwd=frontend_dir)
    run(["npm", "install", "-D", "tailwindcss", "@tailwindcss/vite"], cwd=frontend_dir)

    render_template(
        TEMPLATES_DIR / "frontend" / "vite.config.ts.tmpl",
        frontend_dir / "vite.config.ts",
        vars,
    )
    render_template(
        TEMPLATES_DIR / "frontend" / "style.css.tmpl",
        frontend_dir / "src" / "style.css",
        vars,
    )

    tsconfig = frontend_dir / "tsconfig.app.json"
    if tsconfig.exists():
        patch_tsconfig_paths(tsconfig)

    deps = ["vue", "vite", "typescript", "tailwindcss", "@tailwindcss/vite"]

    if tier == "T1":
        run(["npm", "install", "@iconify/vue", "@vueuse/core"], cwd=frontend_dir)
        deps += ["@iconify/vue", "@vueuse/core"]
        render_template(
            TEMPLATES_DIR / "frontend" / "main.ts.t1.tmpl",
            frontend_dir / "src" / "main.ts",
            vars,
        )

    elif tier == "T2":
        run(["npm", "install", "vue-router@4", "pinia", "@vueuse/core", "@iconify/vue"], cwd=frontend_dir)
        deps += ["vue-router", "pinia", "@vueuse/core", "@iconify/vue"]
        _create_router_and_views(frontend_dir, vars)
        render_template(
            TEMPLATES_DIR / "frontend" / "main.ts.t2.tmpl",
            frontend_dir / "src" / "main.ts",
            vars,
        )

    elif tier == "T3":
        run(["npm", "install", "vue-router@4", "pinia", "@vueuse/core", "@iconify/vue"], cwd=frontend_dir)
        deps += ["vue-router", "pinia", "@vueuse/core", "@iconify/vue", "shadcn-vue", "lucide-vue-next"]
        _create_router_and_views(frontend_dir, vars)
        render_template(
            TEMPLATES_DIR / "frontend" / "main.ts.t3.tmpl",
            frontend_dir / "src" / "main.ts",
            vars,
        )
        log("shadcn-vue init + add button/card/input must be run by the caller interactively (requires TTY).")

    else:
        raise SystemExit(f"unsupported frontend tier: {tier}")

    # Ensure stable directory layout
    for sub in ["components", "composables", "lib", "types", "stores", "services"]:
        (frontend_dir / "src" / sub).mkdir(parents=True, exist_ok=True)

    return {"path": str(frontend_dir), "deps": deps}


def _create_router_and_views(frontend_dir: Path, vars: dict[str, str]) -> None:
    render_template(
        TEMPLATES_DIR / "frontend" / "router.index.ts.tmpl",
        frontend_dir / "src" / "router" / "index.ts",
        vars,
    )
    render_template(
        TEMPLATES_DIR / "frontend" / "home.view.vue.tmpl",
        frontend_dir / "src" / "views" / "HomeView.vue",
        vars,
    )
    render_template(
        TEMPLATES_DIR / "frontend" / "about.view.vue.tmpl",
        frontend_dir / "src" / "views" / "AboutView.vue",
        vars,
    )


def scaffold_backend(project_name: str, project_root: Path, vars: dict[str, str]) -> dict:
    ensure_command("uv")
    backend_dir = project_root / "backend"
    if backend_dir.exists():
        raise SystemExit(f"backend/ already exists at {backend_dir}, aborting")

    run(["uv", "init", "backend", "--app"], cwd=project_root)
    # Remove default hello/main.py placeholder if present
    for stray in ("hello.py", "main.py"):
        p = backend_dir / stray
        if p.exists():
            p.unlink()

    run(["uv", "add", "fastapi[standard]", "sqlmodel", "pydantic-settings"], cwd=backend_dir)

    app_dir = backend_dir / "app"
    (app_dir / "__init__.py").parent.mkdir(parents=True, exist_ok=True)
    for sub in ("api/v1", "core", "models", "schemas", "services", "db"):
        (app_dir / sub).mkdir(parents=True, exist_ok=True)
        (app_dir / sub / "__init__.py").touch()
    (app_dir / "__init__.py").touch()
    (app_dir / "api" / "__init__.py").touch()

    render_template(TEMPLATES_DIR / "backend" / "config.py.tmpl", app_dir / "core" / "config.py", vars)
    render_template(TEMPLATES_DIR / "backend" / "session.py.tmpl", app_dir / "db" / "session.py", vars)
    render_template(TEMPLATES_DIR / "backend" / "main.py.tmpl", app_dir / "main.py", vars)
    render_template(
        TEMPLATES_DIR / "backend" / "api_v1_health.py.tmpl",
        app_dir / "api" / "v1" / "health.py",
        vars,
    )
    render_template(TEMPLATES_DIR / "backend" / "env.example.tmpl", backend_dir / ".env.example", vars)

    # Ensure .env is gitignored inside backend
    gitignore = backend_dir / ".gitignore"
    ignore_line = ".env\n"
    if gitignore.exists():
        existing = gitignore.read_text(encoding="utf-8")
        if ".env" not in existing.splitlines():
            gitignore.write_text(existing.rstrip() + "\n" + ignore_line, encoding="utf-8")
    else:
        gitignore.write_text(ignore_line, encoding="utf-8")

    return {
        "path": str(backend_dir),
        "deps": ["fastapi", "sqlmodel", "pydantic-settings"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a web project at the given Tier.")
    parser.add_argument("--tier", required=True, choices=["T1", "T2", "T3", "TB"])
    parser.add_argument("--name", required=True, help="project name (used for app title / CORS / branding)")
    parser.add_argument("--backend", action="store_true", help="also scaffold backend/ (FastAPI + uv)")
    parser.add_argument("--root", default=".", help="project root (default: cwd)")
    args = parser.parse_args()

    project_root = Path(args.root).resolve()
    project_root.mkdir(parents=True, exist_ok=True)

    vars = {
        "PROJECT_NAME": args.name,
    }

    result = ScaffoldResult(tier=args.tier, project_name=args.name)

    if args.tier in ("T1", "T2", "T3"):
        fe = scaffold_frontend(args.tier, args.name, project_root, vars)
        result.frontend_path = fe["path"]
        result.frontend_deps = fe["deps"]
        result.next_steps.append("cd frontend && npm run dev")
        if args.tier == "T3":
            result.next_steps.append("cd frontend && npx shadcn-vue@latest init && npx shadcn-vue@latest add button card input")

    if args.tier == "TB" or args.backend:
        be = scaffold_backend(args.name, project_root, vars)
        result.backend_path = be["path"]
        result.backend_deps = be["deps"]
        result.next_steps.append("cp backend/.env.example backend/.env")
        result.next_steps.append("cd backend && uv run fastapi dev app/main.py")

    # Final JSON summary on stdout (last line)
    print(json.dumps(asdict(result), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
