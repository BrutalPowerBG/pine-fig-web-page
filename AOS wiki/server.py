#!/usr/bin/env python3
"""Local codex server.

Serves the whole Pine Fig site (so the wiki and the studio page can link
to each other) and writes design files under data/.
A browser page cannot save into this folder by itself, so Save Draft
posts here. Bind is localhost only.

    python server.py
    python server.py 8765
"""
from __future__ import annotations

import base64
import functools
import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote, urlsplit

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(ROOT)
DATA = os.path.join(ROOT, "data")
MAX_BODY = 40 * 1024 * 1024

ALLOWED = re.compile(
    r"^data/(catalog|taxonomy|settings|setup)\.json$"
    r"|^data/heroes/[A-Za-z0-9][A-Za-z0-9_-]{0,80}\.json$"
    r"|^data/history/[A-Za-z0-9][A-Za-z0-9_-]{0,80}\.json$"
    r"|^data/history/[A-Za-z0-9][A-Za-z0-9_-]{0,80}/[0-9]+\.json$"
    r"|^data/images/[A-Za-z0-9][A-Za-z0-9_-]{0,80}\.(png|jpg|jpeg|webp|gif|svg)$"
)


def safe_path(rel: str) -> str:
    rel = str(rel or "").replace("\\", "/").lstrip("/")
    if not ALLOWED.match(rel):
        raise ValueError("Refusing to touch " + rel)
    full = os.path.normpath(os.path.join(ROOT, rel.replace("/", os.sep)))
    data_root = os.path.normpath(DATA)
    if full != data_root and not full.startswith(data_root + os.sep):
        raise ValueError("Refusing to touch " + rel)
    return full


def list_design_files() -> list[str]:
    found = []
    if not os.path.isdir(DATA):
        return found
    for dirpath, _, filenames in os.walk(DATA):
        for name in filenames:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT).replace("\\", "/")
            if ALLOWED.match(rel):
                found.append(rel)
    found.sort()
    return found


class CodexHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        clean = urlsplit(path).path
        return super().translate_path(clean)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        route = urlsplit(self.path).path
        if route == "/__codex/status":
            self.send_json({"ok": True})
            return
        if route == "/__codex/list":
            self.send_json({"ok": True, "files": list_design_files()})
            return
        super().do_GET()

    def do_POST(self) -> None:
        route = urlsplit(self.path).path
        if route != "/__codex/commit":
            self.send_json({"ok": False, "error": "Unknown request."}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json({"ok": False, "error": "Invalid upload size."}, 400)
            return
        if length < 0 or length > MAX_BODY:
            self.send_json({"ok": False, "error": "Upload is too large."}, 413)
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json({"ok": False, "error": "Commit body was not JSON."}, 400)
            return
        try:
            wrote, deleted = commit_payload(payload)
        except ValueError as err:
            self.send_json({"ok": False, "error": str(err)}, 400)
            return
        except OSError as err:
            self.send_json({"ok": False, "error": "Could not write the data folder. " + str(err)}, 500)
            return
        self.send_json({"ok": True, "wrote": wrote, "deleted": deleted})

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def commit_payload(payload: dict) -> tuple[int, int]:
    if not isinstance(payload, dict):
        raise ValueError("Commit body must be an object.")
    planned: list[tuple[str, bytes]] = []
    for item in payload.get("files") or []:
        if not isinstance(item, dict) or "json" not in item:
            raise ValueError("Each file needs a path and json.")
        path = safe_path(item.get("path"))
        text = json.dumps(item["json"], indent=2, ensure_ascii=False) + "\n"
        planned.append((path, text.encode("utf-8")))
    for item in payload.get("binaries") or []:
        if not isinstance(item, dict) or "base64" not in item:
            raise ValueError("Each image needs a path and base64.")
        path = safe_path(item.get("path"))
        try:
            data = base64.b64decode(item.get("base64") or "")
        except (ValueError, TypeError):
            raise ValueError("Image data for " + str(item.get("path")) + " is not valid base64.")
        planned.append((path, data))
    deletes = []
    for rel in payload.get("delete") or []:
        deletes.append(safe_path(rel))

    for path, data in planned:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "wb") as handle:
            handle.write(data)
        os.replace(tmp, path)
    deleted = 0
    for path in deletes:
        if os.path.isfile(path):
            os.remove(path)
            deleted += 1
        parent = os.path.dirname(path)
        data_root = os.path.normpath(DATA)
        if os.path.normpath(parent) != data_root and parent.startswith(data_root) and os.path.isdir(parent) and not os.listdir(parent):
            os.rmdir(parent)
    write_bundle()
    return len(planned), deleted


def write_bundle() -> None:
    """Snapshot design JSON into data/bundle.js so index.html can open as a file."""
    files = {}
    for rel in list_design_files():
        if not rel.endswith(".json"):
            continue
        with open(safe_path(rel), encoding="utf-8") as handle:
            files[rel] = json.load(handle)
    payload = json.dumps(files, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    path = os.path.join(DATA, "bundle.js")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("window.CodexFiles = " + payload + ";\n")
    os.replace(tmp, path)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    write_bundle()
    handler = functools.partial(CodexHandler, directory=SITE)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    wiki = quote(os.path.basename(ROOT))
    print("Codex server at http://127.0.0.1:%s/%s/" % (port, wiki), flush=True)
    print("Studio page at http://127.0.0.1:%s/" % port, flush=True)
    print("Design files are written under %s" % DATA, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
