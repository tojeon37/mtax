from zeep import Client  # pip install zeep 명령어로 패키지를 설치하세요.

client = Client("https://testws.baroservice.com/FAX.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/FAX.asmx?WSDL")  # 운영서버
# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/팩스전송-API#GetFaxMessagesEx2
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''

result = client.service.GetFaxMessageEx2(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey
)

print(result)
