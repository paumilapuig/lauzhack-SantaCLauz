from .db import get_supabase
from .schemas import Profile


def fetch_profile(user_id: str) -> Profile | None:
    """Read display_name and role for a user; None when no profile row exists."""
    response = (
        get_supabase()
        .table("profiles")
        .select("display_name, role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if response is None or response.data is None:
        return None
    return Profile(**response.data)
