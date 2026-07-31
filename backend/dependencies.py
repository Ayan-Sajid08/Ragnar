from fastapi import HTTPException, Header
from database import supabase

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    token = authorization.split(" ")[1]
    response = supabase.auth.get_user(token)
    
    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return response.user