from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/FAX.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/FAX.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/팩스전송-API#CancelReservedFaxMessage
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''

result = client.service.CancelReservedFaxMessage(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
