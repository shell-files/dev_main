import mariadb
from settings import settings

# ------------------
# 연결방식1
# ------------------
# 이 방식을 mariadb가 못 읽어서 연결방식2 체택함
# def getConn():
#   try:
#     conn = mariadb.connect(settings.maria_db_url)
#     if conn == None:
#         return None
#     return conn
#   except mariadb.Error as e:
#     print(f"접속 오류 : {e}")
#     return None
  
# ------------------
# 연결방식2
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
#   '''DB 연결'''
#   try:
#     with mariadb.connect(**conn_params) as conn:
#       if conn == None:
#         return None
#       return conn
#   except mariadb.Error as e:
#     print(f"접속 오류 : {e}")
#     return None
  try:
    conn = mariadb.connect(**conn_params)
    if conn == None:
        return None
    return conn
  except mariadb.Error as e:
    print(f"접속 오류 : {e}")
    return None


# --------------------------
# 연결방식3 SQLAlchemy -> ORM 방식 안 쓰기로 해서 기각함
# --------------------------
# from sqlalchemy import create_password_url, create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base

# --------------------------
# 하나만 불러오기
# --------------------------
def findOne(sql):
  '''DB에서 단일 행 조회'''
  result = None
  try:
    conn = getConn()
    if conn:
      cur = conn.cursor()
      cur.execute(sql)
      row = cur.fetchone()
      columns = [desc[0] for desc in cur.description]
      cur.close()
      conn.close()
      result = dict(zip(columns, row)) if row else None
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 모두 불러오기
# --------------------------
def findAll(sql):
  '''DB에서 여러 행 조회'''
  result = []
  try:
    conn = getConn()
    if conn:
      cur = conn.cursor()
      cur.execute(sql)
      rows = cur.fetchall()
      columns = [desc[0] for desc in cur.description]
      cur.close()
      conn.close()
      result = [dict(zip(columns, row)) for row in rows]
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# DB에 저장하기
# --------------------------
def save(sql):
  '''DB에 단일 값 저장'''
  result = False
  try:
    conn = getConn()
    if conn:
      cur = conn.cursor()
      cur.execute(sql)
      conn.commit()
      cur.close()
      conn.close()
      result = True
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 여러 값 저장하기
# --------------------------
def saveMany(sql2: str, values):
  """DB에 여러 값 한번에 저장"""
  result = False
  try:
    conn = getConn()
    if conn:
      cur = conn.cursor()
    #   cur.execute(sql1)
      cur.executemany(sql2, values)
      conn.commit()
      cur.close()
      conn.close()
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
def add_key(sql):
  """DB에 직전에 생성한 키값 불러오기"""
  result = [False, 0]
  try:
    conn = getConn()
    if conn:
      cur = conn.cursor(dictionary=True)
      cur.execute(sql)
      sql2 = "SELECT LAST_INSERT_ID() as no"
      cur.execute(sql2)
      row = cur.fetchone()
      columns = [desc[0] for desc in cur.description]
      data = dict(zip(columns, row)) if row else None      
      conn.commit()
      cur.close()
      conn.close()
      result[0] = True
      if data:
        result[1] = data["no"]
  except mariadb.Error as e:
    print(f"MariaDB Error : {e}")
  return result

# --------------------------
# 데이터 존재 여부 확인
# --------------------------
def exists(sql, params):
    '''DB에서 데이터 존재 여부 체크'''
    result = False
    try:
        conn = getConn()
        if conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            # 결과가 0보다 크면 존재하는 것
            count = cur.fetchone()[0]
            result = True if count > 0 else False
            cur.close()
            conn.close()
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
def getPageList(sql, limit, offset):
    '''DB에서 페이지네이션 목록 조회'''
    result = {"total": 0, "list": []}
    try:
        conn = getConn()
        if conn:
            cur = conn.cursor(dictionary=True)
            # 1. 전체 개수 파악 (페이지 번호 계산용)
            count_sql = f"SELECT COUNT(*) as cnt FROM ({sql}) as temp"
            cur.execute(count_sql)
            result["total"] = cur.fetchone()["cnt"]
            
            # 2. 실제 페이지 데이터 조회
            paging_sql = sql + " LIMIT %s OFFSET %s"
            cur.execute(paging_sql, (limit, offset))
            result["list"] = cur.fetchall()
            cur.close()
            conn.close()
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
    sql = "SELECT COUNT(*) FROM USER WHERE email = ?"
    # data = findAll(sql)
    # data = exists(sql, ("test@gmail.com",))
    return {
            # "findAll 결과": data, 
            # "findOne 결과": findOne(sql), 
            "exists 결과": exists(sql, ("test@gmail.com",))
            }