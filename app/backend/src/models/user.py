# models/user.py
# ────────────────────────────────────────────────────────────────────────────
# [역할]
#  1. Pydantic v2 Request/Response 모델 정의
#  2. 회원가입 비즈니스 로직 및 SQL 실행
#
# [ERD FK 흐름]
#  USER.id          ──→ COMPANY.user_id
#  USER.id          ──→ USER_ROLE.user_id
#  COMPANY.id       ──→ USER_ROLE.company_id
#  COMPANY.id       ──→ INDUSTRY_DETAIL.company_id
#  INDUSTRY_CODE.id ──→ INDUSTRY_DETAIL.industry_id
#  ROLE.id          ──→ USER_ROLE.role_id
# ────────────────────────────────────────────────────────────────────────────

from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, Union, List
from src.utils.db import signUpTransaction, saveMany
from src.models.model import responseModel


# ============================================================
# ■ Pydantic 모델 정의
# ============================================================

class SignUpModel(BaseModel):
  """user.py 회원가입 통합 요청 모델"""

  # ── USER 테이블 필드
  email: EmailStr                          = Field(...,  description="USER.email")
  password: str                            = Field(...,  description="USER.password")
  userName: str                            = Field(...,  description="USER.name")
  agreed: bool                             = Field(...,  description="개인정보 수집 및 이용 동의 여부")
  
  # ── COMPANY 테이블 필드
  licensefileId: int                       = Field(...,  description="COMPANY.license_file_id")
  businessNumber: int                      = Field(...,  description="COMPANY.business_number")
  companyName: str                         = Field(...,  description="COMPANY.company_name")
  ceoName: str                             = Field(...,  description="COMPANY.ceo_name")
  openingDate: Optional[Union[str, date]]  = Field(None, description="COMPANY.company_establishment 'YYYY-MM-DD'")
  corporateNumber: int                     = Field(...,  description="COMPANY.corporate_number")
  headOffice: str                          = Field(...,  description="COMPANY.company_address")
  taxName: str                             = Field(...,  description="COMPANY.tax_name")
  issueDate: Optional[Union[str, date]]    = Field(None, description="COMPANY.issue_date 'YYYY-MM-DD'")
  companySize: Optional[str]               = Field(None, description="COMPANY.company_size")
  
  # ── INDUSTRY_DETAIL 테이블 필드
  # [FK] industry_id → INDUSTRY_CODE.id (배열 수신 → saveMany 일괄 INSERT)
  # [FK] company_id  → COMPANY.id       (signUpProcess 내부 주입)
  industryList: List[str]                 = Field(...,  description="INDUSTRY_DETAIL.industry_id 배열")
  
  # ── USER_ROLE 테이블 필드
  # [FK] role_id → ROLE.id
  roleId: int                              = Field(2,    description="USER_ROLE.role_id (기본값: 2)")
  
  
class SignUpResponse(BaseModel):
  """user.py 회원가입 응답 모델"""
  status: bool
  message: str
  data: Optional[dict] = None
  
  
# ============================================================
# ■ 비즈니스 로직
# ============================================================

def signUpProcess(signUpModel: SignUpModel) -> dict:
  """
  회원가입 통합 처리 함수
  
  [처리 순서]
  ┌─ Step 1-1. USER INSERT
  ├─ Step 1-2. COMPANY INSERT     → user_id FK 자동 주입
  ├─ Step 1-3. USER_ROLE INSERT   → user_id + company_id FK 자동 주입
  └─ Step 2.   INDUSTRY_DETAIL    → industryCodes 배열 saveMany() 일괄 INSERT
  """
  try:
    # ── Step 1-1. USER INSERT SQL
    # [저장 컬럼] email, password, name
    userSql = """
      INSERT INTO `USER` (email, password, name)
      VALUES (?, ?, ?)
    """
    userParams = (
      signUpModel.email,
      signUpModel.password,
      signUpModel.userName,   # SignUpModel.userName → USER.name
    )
    
    # ── Step 1-2. COMPANY INSERT SQL
    # [FK] user_id → USER.id ※ signUpTransaction 내부에서 마지막에 자동 주입
    # ※ SQL 컬럼 순서와 companyParams 튜플 순서를 반드시 일치시켜야 합니다
    companySql = """
      INSERT INTO `COMPANY` (
        license_file_id,
        business_number,
        company_name,
        ceo_name,
        company_establishment,
        corporate_number,
        company_address,
        tax_name,
        issue_date,
        company_size,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    # ✅ 수정: SQL 컬럼 순서와 params 순서 일치
    companyParams = (
      signUpModel.licensefileId,      # COMPANY.license_file_id
      signUpModel.businessNumber,     # COMPANY.business_number
      signUpModel.companyName,        # COMPANY.company_name
      signUpModel.ceoName,            # COMPANY.ceo_name
      signUpModel.openingDate,        # COMPANY.company_establishment
      signUpModel.corporateNumber,    # COMPANY.corporate_number
      signUpModel.headOffice,         # COMPANY.company_address
      signUpModel.taxName,            # COMPANY.tax_name
      signUpModel.issueDate,          # COMPANY.issue_date
      signUpModel.companySize,        # COMPANY.company_size
      # user_id → signUpTransaction 내부에서 마지막 인자로 자동 주입
    )
    
    # ── Step 1-3. USER_ROLE INSERT SQL
    # [FK] user_id    → USER.id    ※ signUpTransaction 첫 번째 ? 자동 주입
    # [FK] company_id → COMPANY.id ※ signUpTransaction 두 번째 ? 자동 주입
    # [FK] role_id    → ROLE.id
    userRoleSql = """
      INSERT INTO `USER_ROLE` (user_id, company_id, role_id)
      VALUES (?, ?, ?)
    """
    userRoleParams = (
      signUpModel.roleId,     # FK → ROLE.id
    )
    
    # ── Step 1-4. 트랜잭션 실행 (USER → COMPANY → USER_ROLE 원자적 처리)
    # 반환값 → [True,  {"user_id": int, "company_id": int}]
    #         [False, {}] (실패 시 자동 ROLLBACK)
    success, ids = signUpTransaction(
      userSql=userSql,
      userParams=userParams,
      companySql=companySql,
      companyParams=companyParams,
      userRoleSql=userRoleSql,
      userRoleParams=userRoleParams,
    )
    
    if not success:
      return responseModel(False, "회원가입 트랜잭션 처리 중 오류가 발생했습니다.")
    
    # ── Step 2. INDUSTRY_DETAIL 배열 일괄 INSERT
    # [FK] industry_id → INDUSTRY_CODE.id (industryList 각 원소)
    # [FK] company_id  → COMPANY.id       (Step 1-4 ids["company_id"] 주입)
    # industryList → [(industry_id, company_id), ...] 튜플 배열로 변환 후 saveMany() 실행
    industryDetailSql = """
      INSERT INTO `INDUSTRY_DETAIL` (industry_id, company_id)
      VALUES (?, ?)
    """
    industryDetailParams = [
      (industryId, ids["company_id"])
      for industryId in signUpModel.industryList
    ]
    saveMany(industryDetailSql, industryDetailParams)
    
    return responseModel(True, "회원가입이 완료되었습니다.", data={
      "user_id": ids["user_id"],
      "company_id": ids["company_id"],
    })
  
  except Exception as e:
    err_msg = str(e)    # ✅ Python 3 스코프 이슈 방지: e를 먼저 str로 저장
    print(f"[signUpProcess ERROR] {err_msg}")
    return responseModel(False, f"오류 발생 : {err_msg}")