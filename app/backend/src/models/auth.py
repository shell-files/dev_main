from src.utils.db import findOne, save, findAll
from src.utils.tokenset import createUserTokens
from src.utils.rediscl import setTokenRedis, delTokenRedis, setPasswordRedis, getPasswordRedis, delPasswordRedis
from src.utils.kafkasv import sendToKafka
from src.models.model import responseModel
import random
import string

def loginProcess(loginModel):
    """ 
    1. 임시 비밀번호 redis에서 조회 (비밀번호 찾기 후 로그인 시도하는 경우)
    2. DB에서 사용자 검증 및 사용자 정보 추출
    3. access token 생성
    4. refresh token DB 저장
    5. accessToken redis 저장
    """
    try:
        tempLogin = False
        # 1. 임시 비밀번호 redis에서 조회 (비밀번호 찾기 후 로그인 시도하는 경우)
        tempPwdResult = getPasswordRedis(loginModel.password)
        if tempPwdResult["status"]:
            tempLogin = True
            # 임시 비밀번호 삭제
            delPasswordRedis(loginModel.password)  
    
        # 2. DB에서 사용자 검증 및 사용자 정보 추출 
        loginSql="""
            SELECT 
                u.id, 
                u.name,
                u.email, 
                ur.role_id,
                r.role,
                c.id AS company_id, 
                c.company_name
            FROM `USER` AS u
            INNER JOIN `USER_ROLE` AS ur ON u.id = ur.user_id
            INNER JOIN `COMPANY` AS c ON ur.company_id = c.id
            INNER JOIN `ROLE` AS r ON r.id = ur.role_id
            WHERE u.email = ?
            AND u.delete_yn = 0
            """
        
        loginParams = [loginModel.email]

        # 임시 로그인이 아닐 때만 비밀번호 조건 추가
        if not tempLogin:
            loginSql += 'AND u.password = ?'
            loginParams.append(loginModel.password)

        result = findAll(loginSql, tuple(loginParams))
        if len(result) == 0:
            return responseModel(False, "이메일 또는 비밀번호가 올바르지 않습니다.")
        
        # 3. access token 생성
        id = result[0]["id"]
        accessToken, refreshToken, tokenUuid = createUserTokens(id)     

        # 4. refresh token DB 저장
        refreshTokenSql="""
                    INSERT INTO TOKEN (`user_id`,`refresh_token`,`uuid`)
                    VALUES (?,?,?)
                    """
        tokenParams = (id,refreshToken,tokenUuid)
        save(refreshTokenSql,tokenParams)

        # 5. accessToken redis 저장
        setTokenRedis(tokenUuid,accessToken)

        return responseModel(True, "로그인에 성공했습니다.", {"uuid": tokenUuid, "companys": result, "tempLogin": tempLogin })
    except Exception as e:
        print(e)
     
def logoutProcess(logoutModel):
    """
    1. db에서 refresh token delete_yn 1으로 변경
    2. redis에서 uuid 삭제
    """
    uuidKey = logoutModel.uuid
  
    try:
        # 1. db에서 refresh token delete_yn 1으로 변경
        logoutSql="""
                UPDATE TOKEN
                    SET `delete_yn` = 1
                    WHERE uuid = ?;
                """
        logoutParams = (uuidKey,)
        save(logoutSql, logoutParams)

        # 2. redis에서 uuid 삭제
        delTokenRedis(uuidKey)
        
        return responseModel(True, "로그아웃 완료")        
    except Exception as e:
        return responseModel(False, f"오류 발생 : {e}")
    
def findPwdProcess(emailModel):
    """ 
    - 비밀번호 찾기
    1. db에서 이메일 체크 (id, email 조회)
    2. 임시 비밀번호 생성(12자리) / redis에 key(임시비밀번호):value(email)
    3. 임시 비밀번호 포함된 메일(kafka이용) 발송
    """
    try:
        # 1. db에서 이메일 확인
        emailCheckSql="""
                    SELECT id, email
                    FROM `USER`
                    WHERE email = ? AND delete_yn = 0;
                    """
        emailCheckParams = (emailModel.email,)
        user = findOne(emailCheckSql, emailCheckParams)
        if not user:
            return responseModel(False, "등록되지 않은 이메일이거나 탈퇴한 회원입니다.")
        
        # 2. 임시 비밀번호 생성(12자리) / redis에 key(임시비밀번호):value(email)
        characters = string.ascii_letters + string.digits
        tempPwd = ''.join(random.choice(characters) for i in range(12))
        # updatePwdSql = """
        #     UPDATE edu.USER 
        #     SET password = ?
        #     WHERE id = ?
        # """
        # updatePwdParams = (tempPwd, user["id"])
        # save(updatePwdSql, updatePwdParams)
        setPasswordRedis(tempPwd, user["email"])

        # 3. 임시 비밀번호 포함된 메일(kafka이용) 발송 
        kafkaData = {"type":4, "email": user["email"], "tempPwd": tempPwd}
        sendToKafka(kafkaData)      

        return responseModel(True, "임시 비밀번호가 메일로 발송 됐습니다.")
    except Exception as e:
        return responseModel(False, f"오류 발생 : {e}")
    


