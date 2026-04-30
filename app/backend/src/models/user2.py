from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from src.utils.db import findAll, save
from src.models.model import responseModel

class duplicateCheckModel(BaseModel):
  """ user2.py get email,사업자 등록 번호 중복 체크 인증 모델 """
  # 이메일: 형식 검증은 EmailStr이 담당, 설명 추가
  email: Optional[EmailStr] =  Field(
      None,
      description="회원가입에서 사용되는 이메일 모델"
      )
  # 사업자 번호: 10자리 숫자 패턴 검증 및 길이 제한, 설명 추가
  businessNumber: Optional[str] = Field(
      None,
      min_length=10, 
      max_length=10,
      pattern=r"^\d{10}$",  # 숫자 10자리 정규표현식
      description="회원가입에서 사용되는 사업자 등록 번호 모델"
      )

def duplicateCheckProcess(duplicateCheckModel):
    """ 
    1. DB에서 이메일 중복 체크
    2. DB에서 사업자 등록 번호 중복 체크
     - 이메일과 사업자 등록 번호는 둘 다 중복이 없어야 회원가입 가능
    """
    try:
        # 1. 이메일 중복 체크
        if duplicateCheckModel.email:
            sql = """
                SELECT `email` FROM `USER` WHERE email = ?;
            """
            params = (duplicateCheckModel.email,)
            result = findAll(sql, params)
            
            is_available = len(result) == 0
            message = "사용 가능한 이메일입니다." if is_available else "이미 가입된 이메일입니다."
            
            return responseModel(True, message, {
                "type": "email",
                "available": is_available
            })

        # 2. 사업자 등록 번호 중복 체크
        if duplicateCheckModel.businessNumber:
            sql = """
                SELECT `business_number` FROM `COMPANY` WHERE business_number = ?;
            """
            params = (duplicateCheckModel.businessNumber,)
            result = findAll(sql, params)
            
            is_available = len(result) == 0
            message = "사용 가능한 사업자 번호입니다." if is_available else "이미 등록된 사업자 번호입니다."
            
            return responseModel(True, message, {
                "type": "businessNumber",
                "available": is_available
            })

        return responseModel(False, "검증할 값이 누락되었습니다.")

    except Exception as e:
        print(f"Error: {e}")
        return responseModel(False, f"서버 오류가 발생했습니다: {str(e)}")
    
class UserUpdateModel(BaseModel):
    """ 회원 수정 페이지 전용 모델 (화면 항목: 새 비밀번호, 확인, 이름) """
    name: Optional[str] = Field(None, description="변경할 이름")
    newPassword: Optional[str] = Field(None, description="변경할 비밀번호")
    newPasswordConfirm: Optional[str] = Field(None, description="변경할 비밀번호 확인")

    # Pydantic 라이브러리에서 정의한 이름이라 카멜케이스 안 됨
    @model_validator(mode='after')
    def checkPasswordsMatch(self) -> 'UserUpdateModel':
        # 비밀번호 변경 값이 들어온 경우에만 두 값이 일치하는지 검증
        if self.newPassword or self.newPasswordConfirm:
            if self.newPassword != self.newPasswordConfirm:
                raise ValueError("변경할 비밀번호가 서로 일치하지 않습니다.")
        return self

def updateUserProcess(userId: int, data: UserUpdateModel):
    """ 
    1. 이름 변경 체크
    2. 비밀번호 변경 체크
    3. 변경할 내용이 없는 경우 처리
    4. 변경 값 DB에 업데이트
     - 이름과 비밀번호는 둘 중 하나 또는 둘 다 변경 가능
    """
    try:
        updateFields = []
        params = []

        # 1. 이름 변경 체크
        if data.name:
            updateFields.append("name = ?")
            params.append(data.name)

        # 2. 비밀번호 변경 체크
        if data.newPassword:
            updateFields.append("password = ?")
            params.append(data.newPassword) 

        # 3. 변경할 내용이 없는 경우 처리
        if not updateFields:
            return responseModel(False, "변경할 내용이 없습니다.")

        # 4. 변경 값 DB에 업데이트
        sql = f"""
            UPDATE `USER` 
            SET {', '.join(updateFields)} 
            WHERE id = ? AND delete_yn = 0;
        """
        params.append(userId)
        
        save(sql, tuple(params))

        return responseModel(True, "회원 정보가 수정되었습니다.")

    except Exception as e:
        print(f"Update Error: {e}")
        return responseModel(False, f"수정 중 오류 발생: {str(e)}")