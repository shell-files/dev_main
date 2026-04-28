import mariadb
from settings import settings

# ------------------
# DB 연결
# ------------------

# env 관리
conn_params = {
  "user": settings.maria_db_user,
  "password": settings.maria_db_password,
  "host": settings.maria_db_host,
  "database" : settings.maria_db_database,
  "port" : int(settings.maria_db_port)
}

def getConn():
  '''DB 연결'''
  try:
    conn = mariadb.connect(**conn_params)
    if conn == None:
        return None
    return conn
  except mariadb.Error as e:
    print(f"접속 오류 : {e}")
    return None

# --------------------------
# 하나만 불러오기
# --------------------------
def findOne(sql, params: None):
  '''DB에서 단일 행 조회'''
  result = None
  try:
    with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            result = cur.fetchone()
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 모두 불러오기
# --------------------------
def findAll(sql, params: None):
  '''DB에서 여러 행 조회'''
  result = []
  try:
     with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            result = cur.fetchall()
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# DB에 저장하기
# --------------------------
def save(sql, params: None):
  '''DB에 단일 값 저장'''
  result = False
  try:
     with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            conn.commit()
            result = True
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 여러 값 저장하기
# --------------------------
def saveMany(sql: str, params: None):
  """DB에 여러 값 한번에 저장"""
  result = False
  try:
     with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.executemany(sql, params)
            conn.commit()
            result = True
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result
# 사용 예시
"""
sql = "INSERT INTO students (name, score) VALUES (?, ?)"
data_values = [
    ('최수아', 99),
    ('이현서', 00),
    ('최윤우', 98)
]
result = saveMany(sql, data_values)
"""

# --------------------------
# 직전에 넣은 키값 불러오기
# --------------------------
def add_key(sql, params: None):
  """DB에 직전에 생성한 키값 불러오기"""
  result = [False, 0]
  try:
    with getConn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            sql2 = "SELECT LAST_INSERT_ID() as id"
            cur.execute(sql2)
            data = cur.fetchone()  
            conn.commit()
            result[0] = True
            if data:
                result[1] = data["id"]
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 데이터 존재 여부 확인
# --------------------------
def exists(sql, params: None):
    '''DB에서 데이터 존재 여부 체크'''
    result = False
    try:
         with getConn() as conn:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(sql, params)
                # 결과가 0보다 크면 존재하는 것
                row = cur.fetchone()
                count = list(row.values())[0] if row else 0
                result = True if count > 0 else False
    except mariadb.Error as e:
        print(f"MariaDB Error : {e}")
    return result

# 사용 예시
'''
is_joined = exists("SELECT COUNT(*) FROM users WHERE email = ?", ("test@test.com",))
if is_joined:
    print("이미 가입된 이메일입니다.")
'''

# --------------------------
# 페이지네이션 목록
# --------------------------
def getPageList(sql, parmas=None):
    '''DB에서 페이지네이션 목록 조회'''
    result = {"total": 0, "list": []}
    try:
        with getConn() as conn:
            with conn.cursor(dictionary=True) as cur:
                # 1. 전체 개수 파악 (페이지 번호 계산용)
                count_sql = f"SELECT COUNT(*) as cnt FROM ({sql}) as temp"
                cur.execute(count_sql)
                result["total"] = cur.fetchone()["cnt"]
                # 2. 실제 페이지 데이터 조회
                paging_sql = sql + " LIMIT ? OFFSET ?"
                cur.execute(paging_sql, parmas)
                result["list"] = cur.fetchall()
    except mariadb.Error as e:
        print(f"MariaDB Error : {e}")
    return result
# limit = 보여줄 개수, offset = 건너뛸 개수

## 공통화 할 수 있는 부분 체크, 함수화 할 수 있는지 체크해서 수정하기

# 테스트용 코드, 삭제 예정

from fastapi import FastAPI
app = FastAPI()

@app.get("/test")
def test():
    return {
            "findAll 결과": findAll("SELECT * FROM USER WHERE email = ?", ("test5@gmail.com",))
            # "findOne 결과": findOne("SELECT * FROM USER WHERE email = ?", ("test6@gmail.com",)),
            # "exists 결과": exists("SELECT COUNT(*) FROM USER WHERE email = ?", ("test7@gmail.com",))
# "add_key 결과": add_key("INSERT INTO USER (email, password, name) VALUES (?,?,?)", ("test8@gmail.com", "1234","최수아"))
# "getPageList 결과": getPageList("SELECT * FROM USER", (3, 0))
# "saveMany 결과": saveMany("INSERT INTO USER (email, password, name) VALUES (?,?,?)", [("test6@gmail.com", "1234","최수아"), ("test7@gmail.com", "1234","최수아")])
# "save 결과": save("INSERT INTO categories (category_id, category_name) VALUES (?, ?)", (4, "TV"))
            }