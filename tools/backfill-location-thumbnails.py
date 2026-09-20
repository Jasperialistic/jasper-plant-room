"""Create only the missing location thumbnails; never update or delete objects."""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
SUPABASE_URL = re.search(r"const SUPABASE_URL='([^']+)'", INDEX).group(1)
PUBLISHABLE_KEY = re.search(r"const SUPABASE_KEY='([^']+)'", INDEX).group(1)
BUCKET = "plant-media"
PUBLIC_PREFIX = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/"


def request(url: str, *, method: str = "GET", headers=None, data=None):
    return urllib.request.urlopen(
        urllib.request.Request(url, method=method, headers=headers or {}, data=data),
        timeout=90,
    )


def storage_path(public_url: str) -> str | None:
    if not str(public_url or "").startswith(PUBLIC_PREFIX):
        return None
    return urllib.parse.unquote(str(public_url)[len(PUBLIC_PREFIX) :])


def thumbnail_path(original_path: str | None) -> str | None:
    if not original_path:
        return None
    directory, filename = original_path.rsplit("/", 1)
    stem = filename.rsplit(".", 1)[0]
    return f"{directory}/thumbs/{stem}.thumb.jpg"


def object_exists(path: str) -> bool:
    try:
        request(PUBLIC_PREFIX + urllib.parse.quote(path, safe="/"), method="HEAD").close()
        return True
    except urllib.error.HTTPError as error:
        # Supabase Storage currently returns 400 (not 404) for some missing
        # public objects when probed with HEAD.
        if error.code in (400, 404):
            return False
        raise


def load_plan() -> list[dict]:
    query = "select=id,name,photo_asset_path&photo_asset_path=not.is.null&order=name"
    url = f"{SUPABASE_URL}/rest/v1/grow_zones?{query}"
    with request(url, headers={"apikey": PUBLISHABLE_KEY}) as response:
        zones = json.load(response)
    plan = []
    for zone in zones:
        original = storage_path(zone["photo_asset_path"])
        target = thumbnail_path(original)
        if not original or not target:
            raise RuntimeError(f"Unsupported location URL for {zone['name']}")
        plan.append(
            {
                "zone_id": zone["id"],
                "zone_name": zone["name"],
                "original_path": original,
                "thumbnail_path": target,
                "thumbnail_already_exists": object_exists(target),
            }
        )
    return plan


def make_thumbnail(original_path: str) -> bytes:
    url = PUBLIC_PREFIX + urllib.parse.quote(original_path, safe="/")
    with request(url) as response:
        source = response.read()
    with Image.open(io.BytesIO(source)) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((640, 640), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=72, optimize=True)
        return output.getvalue()


def upload_create_only(path: str, body: bytes, token: str) -> None:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/" + urllib.parse.quote(path, safe="/")
    headers = {
        "apikey": PUBLISHABLE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "image/jpeg",
        "cache-control": "max-age=31536000",
        "x-upsert": "false",
    }
    try:
        with request(url, method="POST", headers=headers, data=body) as response:
            if response.status not in (200, 201):
                raise RuntimeError(f"Upload returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"Upload returned HTTP {error.code}: {detail}") from error


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--expected-count", type=int, default=10)
    args = parser.parse_args()

    plan = load_plan()
    missing = [item for item in plan if not item["thumbnail_already_exists"]]
    print(json.dumps({"mode": "execute" if args.execute else "dry-run", "plan": plan}, indent=2))
    if not args.execute:
        return 0
    if len(plan) != args.expected_count or len(missing) != args.expected_count:
        raise RuntimeError(
            f"Safety stop: expected exactly {args.expected_count} total and missing targets; "
            f"found {len(plan)} total and {len(missing)} missing."
        )

    token = os.environ.get("PLANT_SUPABASE_STORAGE_TOKEN") or PUBLISHABLE_KEY
    completed = []
    for item in missing:
        if object_exists(item["thumbnail_path"]):
            raise RuntimeError(f"Safety stop: target appeared during run: {item['thumbnail_path']}")
        thumbnail = make_thumbnail(item["original_path"])
        upload_create_only(item["thumbnail_path"], thumbnail, token)
        if not object_exists(item["thumbnail_path"]):
            raise RuntimeError(f"Upload could not be verified: {item['thumbnail_path']}")
        completed.append({**item, "thumbnail_bytes": len(thumbnail)})
        print(f"created {len(completed)}/{len(missing)} {item['thumbnail_path']}", flush=True)

    print(json.dumps({"created": len(completed), "results": completed}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"backfill failed: {error}", file=sys.stderr)
        raise
