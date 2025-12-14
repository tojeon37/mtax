from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#GetEDocState
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
mgtKey = ''

result = client.service.GetEDocState(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    MgtKey=mgtKey,
)

if result.BarobillState < 0:  # 호출 실패
    print(result.BarobillState)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
