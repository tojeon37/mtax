from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#GetEDocStates
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
mgtKeyList = ['', '', '']

result = client.service.GetEDocStates(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    MgtKeyList=client.get_type("ns0:ArrayOfString")(mgtKeyList),
)

if len(result) == 1 and result[0].MgtKey is None and result[0].BarobillState < 0:  # 호출 실패
    print(result[0].BarobillState)
else:  # 호출 성공
    for state in result:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(state)
