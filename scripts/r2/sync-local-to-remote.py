import argparse
import re
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Iterable, List, Tuple
from urllib.request import Request, urlopen
from urllib.error import HTTPError


CONFIG_PATH = Path("workers/herawalla-email-atelier/wrangler.toml")
R2_STATE_DIR = Path(".wrangler/state/v3/v3/r2")
R2_DB_DIR = R2_STATE_DIR / "miniflare-R2BucketObject"
R2_BLOBS_DIR = R2_STATE_DIR / "heerawalla-products" / "blobs"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"


def load_config() -> Tuple[str, str]:
    text = CONFIG_PATH.read_text(encoding="utf-8")
    base_match = re.search(r'MEDIA_PUBLIC_BASE_URL\s*=\s*"([^"]+)"', text)
    bucket_match = re.search(r'bucket_name\s*=\s*"([^"]+)"', text)
    if not base_match or not bucket_match:
        raise RuntimeError("Missing MEDIA_PUBLIC_BASE_URL or bucket_name in wrangler.toml.")
    base_url = base_match.group(1).strip().rstrip("/")
    bucket = bucket_match.group(1).strip()
    return base_url, bucket


def find_sqlite_db() -> Path:
    if not R2_DB_DIR.exists():
        raise RuntimeError(f"Missing local R2 sqlite dir: {R2_DB_DIR}")
    matches = list(R2_DB_DIR.glob("*.sqlite"))
    if not matches:
        raise RuntimeError(f"No sqlite db found in {R2_DB_DIR}")
    # Use the newest sqlite file if multiple are present.
    matches.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return matches[0]


def load_keys(db_path: Path, prefix: str) -> List[Tuple[str, str]]:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    if prefix:
        cur.execute("SELECT key, blob_id FROM _mf_objects WHERE key LIKE ?", (f"{prefix}%",))
    else:
        cur.execute("SELECT key, blob_id FROM _mf_objects")
    rows = cur.fetchall()
    conn.close()
    return [(str(key), str(blob_id)) for key, blob_id in rows]


def remote_exists(base_url: str, key: str) -> bool:
    url = f"{base_url}/{key}"
    req = Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except HTTPError as exc:
        if exc.code == 404:
            return False
        # Treat other statuses as unknown/exists to avoid overwrites.
        return True
    except Exception:
        return True


def chunked(items: Iterable[Tuple[str, str]], size: int) -> Iterable[List[Tuple[str, str]]]:
    batch: List[Tuple[str, str]] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def run_upload(bucket: str, key: str, blob_path: Path) -> bool:
    cmd = [
        "npx.cmd",
        "wrangler",
        "r2",
        "object",
        "put",
        f"{bucket}/{key}",
        "--file",
        str(blob_path),
        "--cache-control",
        "public, max-age=31536000, immutable",
        "--remote",
        "--config",
        str(CONFIG_PATH),
    ]
    result = subprocess.run(cmd)
    return result.returncode == 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync local miniflare R2 objects to remote.")
    parser.add_argument("--prefix", default="", help="Only sync keys with this prefix.")
    parser.add_argument("--dry-run", action="store_true", help="List missing keys without uploading.")
    parser.add_argument("--force", action="store_true", help="Upload all matching keys.")
    parser.add_argument("--batch", type=int, default=0, help="Limit to first N keys.")
    args = parser.parse_args()

    base_url, bucket = load_config()
    db_path = find_sqlite_db()
    if not R2_BLOBS_DIR.exists():
        raise RuntimeError(f"Missing local R2 blobs dir: {R2_BLOBS_DIR}")

    rows = load_keys(db_path, args.prefix)
    if args.batch and args.batch > 0:
        rows = rows[: args.batch]

    missing = []
    if args.force:
        missing = rows
    else:
        for key, blob_id in rows:
            if not remote_exists(base_url, key):
                missing.append((key, blob_id))

    print(f"Local objects: {len(rows)}")
    print(f"Missing on remote: {len(missing)}")

    if args.dry_run:
        for key, _ in missing[:10]:
            print(f"Missing: {key}")
        return

    uploaded = 0
    for key, blob_id in missing:
        blob_path = R2_BLOBS_DIR / blob_id
        if not blob_path.exists():
            print(f"Missing blob for {key}: {blob_id}")
            continue
        print(f"Uploading {key}")
        if run_upload(bucket, key, blob_path):
            uploaded += 1

    print(f"Uploaded: {uploaded}")


if __name__ == "__main__":
    main()
