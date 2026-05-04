import mariadb
from src.utils.settings import settings

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
def findOne(sql:str, params=None):
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
def findAll(sql:str, params=None):
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
def save(sql:str, params=None):
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
def saveMany(sql:str, params=None):
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

# --------------------------
# 직전에 넣은 키값 불러오기
# --------------------------
def addKey(sql:str, params=None):
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
def exists(sql:str, params=None):
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

# --------------------------
# 페이지네이션 목록
# --------------------------
def getPageList(sql:str, parmas=None):
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

# db.py 하단에 추가
# --------------------------
# 회원가입 전용 트랜잭션
# --------------------------
def signUpTransaction(userSql, userParams, companySql, companyParams, userRoleSql, userRoleParams):
    """
    [역할] USER → COMPANY → USER_ROLE 3개 테이블을 단일 트랜잭션으로 원자적 저장.
           하나라도 실패 시 전체 ROLLBACK 보장.

    [ERD FK 흐름]
      USER.id ──────→ COMPANY.user_id        (Step1 → Step2에 주입)
      USER.id ──────→ USER_ROLE.user_id      (Step1 → Step3에 주입)
      COMPANY.id ───→ USER_ROLE.company_id   (Step2 → Step3에 주입)
      ROLE.id ──────→ USER_ROLE.role_id      (호출 시 외부에서 주입)

    반환값: [성공여부(bool), {"user_id": int, "company_id": int}]
    """
    result = [False, {}]
    try:
        with getConn() as conn:
            conn.autocommit = False  # 트랜잭션 수동 제어 시작
            with conn.cursor(dictionary=True) as cur:

                # ── Step 1. USER INSERT → user_id 획득
                cur.execute(userSql, userParams)
                cur.execute("SELECT LAST_INSERT_ID() as id")
                userId = cur.fetchone()["id"]  # USER.id (AUTO_INCREMENT)

                # ── Step 2. COMPANY INSERT (user_id FK 주입) → company_id 획득
                # companyParams 튜플 내 user_id 자리에 userId 삽입 후 실행
                cur.execute(companySql, (*companyParams, userId))
                cur.execute("SELECT LAST_INSERT_ID() as id")
                companyId = cur.fetchone()["id"]  # COMPANY.id (AUTO_INCREMENT)

                # ── Step 3. USER_ROLE INSERT (user_id + company_id FK 주입)
                cur.execute(userRoleSql, (userId, companyId, *userRoleParams))

                conn.commit()  # ── 전체 성공 시 커밋
                result[0] = True
                result[1] = {"user_id": userId, "company_id": companyId}

    except mariadb.Error as e:
        print(f"[signUpTransaction ROLLBACK] MariaDB Error: {e}")
        # conn.rollback()은 with 블록 종료 시 autocommit=False 상태에서 자동 처리
    return result