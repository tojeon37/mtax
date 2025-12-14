from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/FAX.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/FAX.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/팩스전송-API#GetFaxMessagesByRefKeyEx2
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
refKey = ''

result = client.service.GetFaxMessagesByRefKeyEx2(
    CERTKEY=certKey,
    CorpNum=corpNum,
    RefKey=refKey,
)

if result[0].SendState < 0:  # 호출 실패
    print(result[0].SendState)
else:  # 호출 성공
    for faxMessage in result:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(faxMessage)
