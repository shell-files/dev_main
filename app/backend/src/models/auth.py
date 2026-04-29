from src.utils.db import findOne, save, findAll
from src.utils.tokenset import createUserTokens
from src.utils.rediscl import setRedis
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
                u.email, 
                r.role_id, 
                c.id AS company_id, 
                c.company_name
            FROM `USER` AS u
            INNER JOIN `USER_ROLE` AS r ON u.id = r.user_id
            INNER JOIN `COMPANY` AS c ON r.company_id = c.id
            WHERE u.email = ? 
            AND u.password = ? 
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
     
