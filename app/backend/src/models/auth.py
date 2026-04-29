from src.utils.db import findOne, save
from src.utils.tokenset import createUserTokens
from src.utils.rediscl import setRedis
from src.models.model import responseModel


def loginProcess(loginModel):
    """ 
    1. DB에서 사용자 검증.
    2. access token 생성
    3. refresh token DB 저장
    4. accessToken redis 저장
    
    """
    # 1. DB에서 사용자 검증
    try:
        loginSql="""
            SELECT id
                FROM USER
                WHERE email = ? 
                AND password = ? 
                AND delete_yn = 0
            """
        loginParams = (loginModel.email, loginModel.password)
        loginResult = findOne(loginSql, loginParams)
        if not loginResult:
            return {"status": False}
        
        # 2. access token 생성
        token = createUserTokens(loginResult["id"])
        accessToken = token[0]
        refreshToken = token[1]
        tokenUuid = token[2]

        # 3. refresh token DB 저장
        refreshTokenSql="""
                    INSERT INTO TOKEN (`user_id`,`refresh_token`,`uuid`)
                    VALUES (?,?,?)
                    """
        tokenParams = (loginResult["id"],refreshToken,tokenUuid)
        save(refreshTokenSql,tokenParams)

        # 4. accessToken redis 저장
        setRedis(tokenUuid,accessToken)

    except Exception as e:
        return 
     

