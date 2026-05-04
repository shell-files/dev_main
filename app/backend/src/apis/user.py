# apis/user.py
# ────────────────────────────────────────────────────────────────────────────
# [역할] HTTP 요청 수신 후 models/user.py의 비즈니스 로직에 위임.
#        라우터는 요청/응답 처리만 담당, SQL 로직 포함하지 않음.
# [변경점] schemas/user.py 제거 → models/user.py에서 직접 import
# ────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter
from src.models.user import SignUpModel, SignUpResponse, signUpProcess  # ← 통합 import

router = APIRouter()

@router.put("",
    summary="회원가입 API",
    description="""
        ## 회원가입 및 기업 등록 통합 API

        **처리 순서 (단일 트랜잭션)**

        1. `USER` 테이블 — 사용자 계정 생성 (bcrypt 암호화)
        2. `COMPANY` 테이블 — 기업 정보 등록 (industry_code_id FK 검증)
        3. `USER_ROLE` 테이블 — 사용자/기업/권한 매핑
        4. `INDUSTRY_DETAIL` 테이블 — 기업별 산업 상세 정보 일괄 등록

        **호출 결과 반환 (회원가입과 로그인 통합 처리)** : loginProcess(signUpModel)
      """,
    response_model=SignUpResponse,
)
def signUp(signUpModel: SignUpModel):
    return signUpProcess(signUpModel)