import os
import time
from datetime import timedelta
from jose import jwt

def test_jwt_smoke():
    secret = os.environ.get("AUTH_SECRET_KEY", "testsecret")
    algo = os.environ.get("AUTH_ALGO", "HS256")
    now = int(time.time())
    token = jwt.encode({"sub":"smoke","iat":now,"exp":now+60}, secret, algorithm=algo)
    payload = jwt.decode(token, secret, algorithms=[algo])
    assert payload["sub"] == "smoke"
