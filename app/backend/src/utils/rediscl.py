from src.utils.settings import settings
import redis

# --------------------------
# redis client로 설정
# --------------------------
client = redis.Redis(
  host=settings.redis_host,
  port=settings.redis_port,
  db=settings.redis_db,
  decode_responses=True
)

# --------------------------
# setRedis: Redis에 값을 저장하는 함수
# --------------------------
def setRedis(uuid: str, token: str):
    """Redis에 uuid를 키로, accessToken을 값으로 저장"""
    try:
        # set(key, value)
        client.set(uuid, token)
        print(f"Success: Set Redis - uuid: {uuid}")
        return {"status": True}
    except Exception as e:
        print(f"Error setting Redis keys: {e}")
        return {"status": False}

# --------------------------
# getRedis: Redis에서 저장된 값을 가져오는 함수
# --------------------------
def getRedis(uuid: str):
    """uuid로 accessToken 조회"""
    try:
        result = client.get(uuid)
        if result:
            return {"status": True, "uuid": uuid, "accessToken": result}
        return {"status": False, "message": "Key not found"}
    except Exception as e:
        print(f"Error getting Redis value: {e}")
        return {"status": False}

# --------------------------
# delRedis: Redis에 저장된 값을 삭제하는 함수
# --------------------------
def delRedis(uuid: str):
    """특정 uuid 키 삭제"""
    try:
        client.delete(uuid)
        return {"status": True}
    except Exception as e:
        print(f"Error deleting Redis key: {e}")
        return {"status": False}