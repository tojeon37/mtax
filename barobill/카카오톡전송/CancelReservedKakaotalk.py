from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#CancelReservedKakaotalk
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''

result = client.service.CancelReservedKakaotalk(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
