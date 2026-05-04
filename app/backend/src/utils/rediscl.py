from src.utils.settings import settings
import redis

# --------------------------
# redis client로 설정
# --------------------------
client1 = redis.Redis(
  host=settings.redis_host,
  port=settings.redis_port,
  db=settings.redis_db1,
  decode_responses=True
)
client2 = redis.Redis(
  host=settings.redis_host,
  port=settings.redis_port,
  db=settings.redis_db2,
  decode_responses=True
)

# --------------------------
# setRedis: Token Redis에 값을 저장하는 함수
# --------------------------
def setTokenRedis(uuid: str, token: str):
    """Redis에 uuid를 키로, accessToken을 값으로 저장"""
    try:
        # set(key, value)
        client1.set(uuid, token)
        print(f"Success: Set Redis - uuid: {uuid}")
        return {"status": True}
    except Exception as e:
        print(f"Error setting Redis keys: {e}")
        return {"status": False}

# --------------------------
# getRedis: Token Redis에서 저장된 값을 가져오는 함수
# --------------------------
def getTokenRedis(uuid: str):
    """uuid로 accessToken 조회"""
    try:
        result = client1.get(uuid)
        if result:
            return {"status": True, "uuid": uuid, "accessToken": result}
        return {"status": False, "message": "Key not found"}
    except Exception as e:
        print(f"Error getting Redis value: {e}")
        return {"status": False}

# --------------------------
# delRedis: Token Redis에 저장된 값을 삭제하는 함수
# --------------------------
def delTokenRedis(uuid: str):
    """특정 uuid 키 삭제"""
    try:
        client1.delete(uuid)
        return {"status": True}
    except Exception as e:
        print(f"Error deleting Redis key: {e}")
        return {"status": False}
    
# --------------------------
# setRedis: Password Redis에 값을 저장하는 함수
# --------------------------
def setPasswordRedis(uuid: str, email: str):
    """Redis에 uuid를 키로, Email을 값으로 저장"""
    try:
        # set(key, value)
        client2.set(uuid, email)
        print(f"Success: Set Redis - uuid: {uuid}")
        return {"status": True}
    except Exception as e:
        print(f"Error setting Redis keys: {e}")
        return {"status": False}

# --------------------------
# getRedis: Password Redis에서 저장된 값을 가져오는 함수
# --------------------------
def getPasswordRedis(uuid: str):
    """uuid로 Email 조회"""
    try:
        result = client2.get(uuid)
        if result:
            return {"status": True, "uuid": uuid, "email": result}
        return {"status": False, "message": "Key not found"}
    except Exception as e:
        print(f"Error getting Redis value: {e}")
        return {"status": False}

# --------------------------
# delRedis: Password Redis에 저장된 값을 삭제하는 함수
# --------------------------
def delPasswordRedis(uuid: str):
    """특정 uuid 키 삭제"""
    try:
        client2.delete(uuid)
        return {"status": True}
    except Exception as e:
        print(f"Error deleting Redis key: {e}")
        return {"status": False}