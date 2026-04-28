import uuid
from datetime import datetime, timedelta
from jwcrypto import jwk, jwe  # jwcrypto 라이브러리 사용 가정
import json
from .settings import settings

# --------------------------
# 공통 복호화/암호화 로직: 데이터를 JWE로 암호화 (AES-GCM)
# --------------------------
def encryptToJwe(payload: dict):
    """ 공통 복호화/암호화 로직: 데이터를 JWE로 암호화 (AES-GCM)"""
    payloadStr = json.dumps(payload)
    # settings에서 가져온 키를 바탕으로 JWK 객체 생성
    key = jwk.JWK(k=settings.secret_key, kty='oct')
    
    # A256KW(키 암호화) + A256GCM(데이터 암호화) 조합, add_recipient는 반드시 스네이크 형식이어야 함(jwcrypto 라이브러리 제작자가 함수 이름을 add_recipient라고 지어놓았기 때문).
    jwetoken = jwe.JWE(payloadStr.encode('utf-8'),
                       json.dumps({"alg": "A256KW", "enc": "A256GCM"}))
    jwetoken.add_recipient(key)
    return jwetoken.serialize(compact=True)

# --------------------------
# 복호화 함수: JWE 토큰을 해독하여 파이썬 딕셔너리로 반환
# --------------------------
def decryptFromJwe(token: str):
    """ 복호화 함수: JWE 토큰을 해독하여 파이썬 딕셔너리로 반환"""
    try:
        key = jwk.JWK(k=settings.secret_key, kty='oct')
        jwetoken = jwe.JWE()
        jwetoken.deserialize(token)
        jwetoken.decrypt(key)
        return json.loads(jwetoken.payload.decode('utf-8'))
    except Exception:
        return None
# --------------------------
# 액세스 토큰과 UUID 생성 함수 (공통 모듈)
# --------------------------
def generateAccessWithUuid(userId: str):
    """ 액세스 토큰과 UUID 생성 함수 (공통 모듈)"""
    tokenUuid = str(uuid.uuid4())
    payload = {
        "sub": userId,
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)).timestamp())
        
    }
    # JWE로 암호화하여 반환
    accessToken = encryptToJwe(payload)
    return accessToken, tokenUuid
# --------------------------
# 로그인 시 호출: JWE 액세스/리프레시 토큰 및 UUID 생성
# --------------------------
def createUserTokens(userId: str):
    """ 로그인 시 호출: JWE 액세스/리프레시 토큰 및 UUID 생성"""
    # 액세스 토큰 및 UUID 생성 
    accessToken, tokenUuid = generateAccessWithUuid(userId)
    
    # 리프레시 토큰 생성 (30일)
    refreshPayload = {
        "sub": userId,
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)).timestamp())
        
    }
    refreshToken = encryptToJwe(refreshPayload)
    
    return accessToken, refreshToken, tokenUuid

# --------------------------
# 토큰 재발급: 리프레시 토큰 검증 후 새로운 UUID와 액세스 토큰 생성
# --------------------------
def refreshAccessToken(refreshToken: str):
    """ 토큰 재발급: 리프레시 토큰 검증 후 새로운 UUID와 액세스 토큰 생성"""
    # 1. JWE 복호화 및 유효성 검사
    payload = decryptFromJwe(refreshToken)
    
    if not payload:
        return None # 해독 실패 또는 변조
        
    userId = payload.get("sub")
    
    # 2. 새로운 액세스 토큰과 UUID 생성 
    newAccessToken, newUuid = generateAccessWithUuid(userId)
    
    return newAccessToken, newUuid
