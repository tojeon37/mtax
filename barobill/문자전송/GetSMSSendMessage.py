from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/SMS.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/SMS.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/문자전송-API#GetSMSSendMessage
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''

result = client.service.GetSMSSendMessage(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey,
)

if result.SendState < 0:  # 호출 실패
    print(result.SendState)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
