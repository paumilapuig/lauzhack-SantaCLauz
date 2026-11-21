from typing import Annotated

from fastapi import Depends, HTTPException, status

from .auth import AuthenticatedUser
from .profiles import fetch_profile
from .schemas import CurrentUser


def require_teacher(user: AuthenticatedUser) -> CurrentUser:
    """Allow only users whose profile role is `teacher`."""
    profile = fetch_profile(user.id)
    if profile is None or profile.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher role required")
    return user


TeacherUser = Annotated[CurrentUser, Depends(require_teacher)]
