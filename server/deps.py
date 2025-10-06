from fastapi import Depends
from .db.session import get_session

def db_session(dep=Depends):
    with get_session() as s:
        yield s
