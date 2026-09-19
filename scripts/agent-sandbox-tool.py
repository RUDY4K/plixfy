#!/usr/bin/env python3
"""Trusted, closed read-only tool used only inside the bubblewrap sandbox."""

import json
import os
from pathlib import Path
import re
import sys

WORKSPACE = Path("/workspace")


def safe_path(value: str) -> Path:
    candidate = (WORKSPACE / value).resolve()
    if candidate != WORKSPACE and WORKSPACE not in candidate.parents:
        raise ValueError("path escapes workspace")
    if not candidate.is_file():
        raise ValueError("path is not a regular file")
    return candidate


def list_files(args):
    prefix = args.get("prefix", "")
    base = (WORKSPACE / prefix).resolve()
    if base != WORKSPACE and WORKSPACE not in base.parents:
        raise ValueError("prefix escapes workspace")
    limit = min(int(args.get("limit", 200)), 1000)
    files = []
    if base.is_file():
        files = [str(base.relative_to(WORKSPACE))]
    elif base.is_dir():
        files = [str(p.relative_to(WORKSPACE)) for p in base.rglob("*") if p.is_file()]
    return {"files": sorted(files)[:limit], "truncated": len(files) > limit}


def read_file(args):
    path = safe_path(str(args["path"]))
    start = max(int(args.get("startLine", 1)), 1)
    max_lines = min(max(int(args.get("maxLines", 400)), 1), 2000)
    lines = path.read_text(encoding="utf-8").splitlines()
    selected = lines[start - 1 : start - 1 + max_lines]
    return {
        "path": str(path.relative_to(WORKSPACE)),
        "startLine": start,
        "endLine": start + len(selected) - 1,
        "totalLines": len(lines),
        "text": "\n".join(selected),
        "truncated": start - 1 + len(selected) < len(lines),
    }


def search_text(args):
    query = str(args["query"])
    if not query or len(query) > 200:
        raise ValueError("query length is invalid")
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    limit = min(max(int(args.get("limit", 100)), 1), 500)
    matches = []
    for path in WORKSPACE.rglob("*"):
        if not path.is_file():
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if pattern.search(line):
                matches.append({
                    "path": str(path.relative_to(WORKSPACE)),
                    "line": number,
                    "text": line[:500],
                })
                if len(matches) >= limit:
                    return {"matches": matches, "truncated": True}
    return {"matches": matches, "truncated": False}


def boundary_probe(_args):
    import socket

    write_blocked = False
    try:
        probe = next(WORKSPACE.rglob("*"))
        if probe.is_dir():
            probe = probe / "forbidden-write"
        with probe.open("a", encoding="utf-8") as stream:
            stream.write("forbidden")
    except (OSError, StopIteration):
        write_blocked = True

    network_blocked = False
    sock = socket.socket()
    sock.settimeout(0.5)
    try:
        sock.connect(("1.1.1.1", 53))
    except OSError:
        network_blocked = True
    finally:
        sock.close()

    return {
        "workspaceWriteBlocked": write_blocked,
        "windowsDriveHidden": not Path("/mnt/c").exists(),
        "networkBlocked": network_blocked,
        "environmentKeys": sorted(os.environ.keys()),
    }


ACTIONS = {
    "files.list": list_files,
    "file.read-range": read_file,
    "text.search": search_text,
    "boundary.probe": boundary_probe,
}


def main():
    request = json.loads(sys.stdin.read())
    action = request.get("action")
    if action not in ACTIONS:
        raise ValueError("unknown action")
    result = ACTIONS[action](request.get("args", {}))
    print(json.dumps({"ok": True, "action": action, "result": result}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        sys.exit(2)
