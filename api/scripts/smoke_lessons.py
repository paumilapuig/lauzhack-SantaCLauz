"""End-to-end drill for POST /api/lessons: real login, real API, real LLM, real DB.

Usage (from api/, with the API running on API_URL):
    uv run python -m scripts.smoke_lessons [--file PATH] [--keep]

Environment (never read from .env files by this script, set them in the shell):
    SUPABASE_PUBLISHABLE_KEY  publishable/anon key (same value as web's NEXT_PUBLIC_SUPABASE_ANON_KEY)
    DEMO_TEACHER_EMAIL        default prof-demo@demo.lauzhack
    DEMO_TEACHER_PASSWORD     from the private team chat
    API_URL                   default http://localhost:8000
Without --keep, the lesson created by the drill is deleted afterwards (shared DB).
"""

import argparse
import mimetypes
import os
import sys
import time
from pathlib import Path

import httpx

from app.config import get_settings
from app.db import get_supabase

DEMO_TEXT = Path(__file__).resolve().parents[2] / "docs" / "demo" / "lesson-respiration.md"


def sign_in(http: httpx.Client, supabase_url: str, publishable_key: str, email: str, password: str) -> str:
    response = http.post(
        f"{supabase_url}/auth/v1/token",
        params={"grant_type": "password"},
        headers={"apikey": publishable_key},
        json={"email": email, "password": password},
    )
    if response.status_code != 200:
        raise SystemExit(f"Login failed ({response.status_code}): check email/password/publishable key")
    return response.json()["access_token"]


def post_lesson(http: httpx.Client, api_url: str, token: str, file: Path | None) -> httpx.Response:
    headers = {"Authorization": f"Bearer {token}"}
    meta = {"title": "Simulacre — respiration", "subject": "Biologie", "lesson_date": "2026-11-22"}
    if file is None:
        body = {**meta, "source_text": DEMO_TEXT.read_text(encoding="utf-8")}
        return http.post(f"{api_url}/api/lessons", headers=headers, json=body)
    content_type = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
    files = {"file": (file.name, file.read_bytes(), content_type)}
    return http.post(f"{api_url}/api/lessons", headers=headers, data=meta, files=files)


def count_saved_terms(lesson_id: str) -> int:
    rows = get_supabase().table("lesson_terms").select("id").eq("lesson_id", lesson_id).execute().data
    return len(rows)


def delete_lesson(lesson_id: str) -> None:
    get_supabase().table("lessons").delete().eq("id", lesson_id).execute()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="End-to-end drill for POST /api/lessons")
    parser.add_argument("--file", type=Path, help="txt / pdf / png / jpg (default: demo lesson text as JSON)")
    parser.add_argument("--keep", action="store_true", help="keep the created lesson in the DB")
    args = parser.parse_args(argv)

    publishable_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    password = os.environ.get("DEMO_TEACHER_PASSWORD")
    if not publishable_key or not password:
        raise SystemExit("Set SUPABASE_PUBLISHABLE_KEY and DEMO_TEACHER_PASSWORD in the shell first")
    email = os.environ.get("DEMO_TEACHER_EMAIL", "prof-demo@demo.lauzhack")
    api_url = os.environ.get("API_URL", "http://localhost:8000")

    with httpx.Client(timeout=180) as http:
        token = sign_in(http, get_settings().supabase_url, publishable_key, email, password)
        print(f"1. login as {email}: OK")
        started = time.monotonic()
        response = post_lesson(http, api_url, token, args.file)
    seconds = time.monotonic() - started
    if response.status_code != 200:
        raise SystemExit(f"2. POST /api/lessons failed ({response.status_code}): {response.text[:300]}")

    body = response.json()
    terms = body["terms"]
    green = sum(term["transparent"] for term in terms)
    print(f"2. POST /api/lessons: 200 in {seconds:.1f}s, {len(terms)} terms ({green} green, {len(terms) - green} yellow)")
    for term in terms:
        print(f"     {'G' if term['transparent'] else 'Y'} {term['lemma']:<24} -> {term['translation_es']}")
    saved = count_saved_terms(body["lesson_id"])
    print(f"3. Supabase: lesson {body['lesson_id']} has {saved} lesson_terms rows")
    if args.keep:
        print("4. kept (--keep)")
    else:
        delete_lesson(body["lesson_id"])
        print("4. drill lesson deleted (use --keep to keep it)")
    sys.exit(0 if saved == len(terms) else 1)


if __name__ == "__main__":
    main()
