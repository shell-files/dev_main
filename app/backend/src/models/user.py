# models/user.py
# ────────────────────────────────────────────────────────────────────────────
# [역할]
#   1. Pydantic v2 Request/Response 모델 정의
#   2. 회원가입 비즈니스 로직 및 SQL 실행
#
# [중복 체크]
#   이메일 중복      → checkEmailDuplicate()    (company.py에서 import)
#   사업자번호 중복  → checkBizNumDuplicate()   (company.py에서 import)
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
    email: EmailStr = Field(..., description="이메일")
    password: str = Field(..., description="비밀번호 저장")
    userName: str = Field(..., description="사용자 이름")
    agreed: bool = Field(..., description="개인정보 수집 및 이용 동의 여부")

    # ── COMPANY 테이블 필드
    licensefileId: int = Field(..., description="사업자등록증ID")
    businessNumber: int = Field(..., description="사업자등록번호 10자리")
    companyName: str = Field(..., description="기업명")
    ceoName: str = Field(..., description="대표자명")
    openingDate: Optional[Union[str, date]] = Field(None, description="기업 설립일 'YYYY-MM-DD'")
    corporateNumber: int = Field(..., description="법인등록번호")
    headOffice: str = Field(..., description="기업 주소")
    taxName: str = Field(..., description="발행처")
    issueDate: Optional[Union[str, date]] = Field(None, description="발행일 'YYYY-MM-DD'")
    companySize: Optional[Union[str, date]] = Field(None, description="기업 규모")

    # ── INDUSTRY_DETAIL 업종구분 테이블 필드
    industryCodes: List[int] = Field(None, description="업종 리스트")

    # ── ROLE 테이블 필드 (USER_ROLE에 저장)
    roleId: int = Field(2, description="역할 ID (기본값: 2 → ESG 담당자)")

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


    └─ 트랜잭션 저장
       ├─ USER INSERT        → USER.id 획득
       ├─ COMPANY INSERT     → user_id FK 자동 주입, COMPANY.id 획득
       └─ USER_ROLE INSERT   → user_id + company_id + role_id FK 자동 주입
    └─ INDUSTRY_DETAIL INSERT (업종 리스트 일괄 저장)
    """
    try:
        # ── Step 1-1. 유저 정보 저장
        userSql = """
            INSERT INTO `USER` (email, password, name)
            VALUES (?, ?, ?)
        """
        userParams = (
            signUpModel.email,
            signUpModel.password,
            signUpModel.userName,
        )

        # ── Step 1-2. 회사 정보 저장
        # [FK] industry_code_id → INDUSTRY_CODE.id
        # [FK] user_id          → USER.id  ※ signUpTransaction 내부에서 자동 주입
        companySql = """
            INSERT INTO `COMPANY` (
                license_file_id, business_number, company_name, ceo_name, 
                company_establishment, corporate_number, company_address,
                tax_name, issue_date, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        companyParams = (
            signUpModel.licensefileId,   # FK → INDUSTRY_CODE.id
            signUpModel.businessNumber,
            signUpModel.companyName,
            signUpModel.ceoName,
            signUpModel.corporateNumber,
            signUpModel.openingDate,
            signUpModel.headOffice,
            signUpModel.taxName,
            signUpModel.issueDate,
            # user_id → signUpTransaction 내부에서 마지막 인자로 자동 주입
        )

        # ── Step 1-3. USER_ROLE INSERT SQL
        # [FK] user_id    → USER.id    ※ signUpTransaction 내부 자동 주입 (첫 번째 ?)
        # [FK] company_id → COMPANY.id ※ signUpTransaction 내부 자동 주입 (두 번째 ?)
        # [FK] role_id    → ROLE.id
        userRoleSql = """
            INSERT INTO `USER_ROLE` (user_id, company_id, role_id)
            VALUES (?, ?, ?)
        """
        userRoleParams = (
            signUpModel.roleId,  # FK → ROLE.id (호출 시 외부에서 주입)
        )

        # ── Step 1-4. 트랜잭션 실행
        # 반환값 → [True, {"user_id": int, "company_id": int}]
        #           [False, {}] (실패/롤백)
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
        # [FK] industry_id → INDUSTRY_CODE.id (industryCodes 각 원소)
        # [FK] company_id  → COMPANY.id       (Step 1-4에서 획득한 ids["company_id"])
        # saveMany()를 사용해 industryCodes 배열을 한 번에 INSERT
        industryDetailSql = """
            INSERT INTO `INDUSTRY_DETAIL` (industry_id, company_id)
            VALUES (?, ?)
        """
        # industryCodes → [(industry_id, company_id), ...] 형태로 변환
        industryDetailParams = [
            (industryId, ids["company_id"])
            for industryId in signUpModel.industryCodes
        ]
        saveMany(industryDetailSql, industryDetailParams)

        return responseModel(True, "회원가입이 완료되었습니다.", data={
            "user_id": ids["user_id"],
            "company_id": ids["company_id"],
        })

    except Exception as e:
        return responseModel(False, f"오류 발생 : {e}")