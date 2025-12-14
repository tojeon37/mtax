from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#GetSendKakaotalkEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''

result = client.service.GetSendKakaotalkEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey,
)

if result.SendStatus < 0:  # 호출 실패
    print(result.SendStatus)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
