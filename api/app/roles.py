from typing import Annotated

from fastapi import Depends, HTTPException, status

from .auth import get_current_user
from .profiles import fetch_profile
from .schemas import CurrentUser, Role


def require_role(role: Role):
    """Build a dependency that returns the user only if their profile has `role`."""

    def dependency(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        profile = fetch_profile(user.id)
        if profile is None or profile.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: {role} role required",
            )
        return user

    return dependency


StudentUser = Annotated[CurrentUser, Depends(require_role("student"))]
TeacherUser = Annotated[CurrentUser, Depends(require_role("teacher"))]
