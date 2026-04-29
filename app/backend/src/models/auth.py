from src.utils.db import findOne, save, findAll
from src.utils.tokenset import createUserTokens
from src.utils.rediscl import setRedis, delRedis
from src.models.model import responseModel,emailModel


def loginProcess(loginModel):
    """ 
    1. DB에서 사용자 검증 및 사용자 정보 추출
    2. access token 생성
    3. refresh token DB 저장
    4. accessToken redis 저장
    """
    try:
        # 1. DB에서 사용자 검증 및 사용자 정보 추출 
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
            WHERE u.email = 'test@gmail.com' 
            AND u.password = '1234' 
            AND u.delete_yn = 0;
            """
        
        loginParams = (loginModel.email, loginModel.password)
        result = findAll(loginSql, loginParams)
        print(result,len(result))
        if len(result) == 0:
            return {"status": False}
        
        # 2. access token 생성
        id = result[0]["id"]
        accessToken, refreshToken, tokenUuid = createUserTokens(id)     

        # 3. refresh token DB 저장
        refreshTokenSql="""
                    INSERT INTO TOKEN (`user_id`,`refresh_token`,`uuid`)
                    VALUES (?,?,?)
                    """
        tokenParams = (id,refreshToken,tokenUuid)
        save(refreshTokenSql,tokenParams)

        # 4. accessToken redis 저장
        setRedis(tokenUuid,accessToken)

        return responseModel(True, "로그인에 성공했습니다.", {"uuid": tokenUuid, "companys": result })
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
                    WHERE uuid = ? AND `delete_yn` = 0;
                """
        logoutParams = (uuidKey,)
        save(logoutSql, logoutParams)

        # 2. redis에서 uuid 삭제
        delRedis(uuidKey)
        
        return responseModel(True, "로그아웃 완료")        
    except Exception as e:
        return responseModel(False, f"오류 발생 : {e}")
    