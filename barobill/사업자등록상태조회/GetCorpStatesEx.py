from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CORPSTATE.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CORPSTATE.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/사업자등록-상태조회-API#GetCorpStatesEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
checkCorpNumList = ['', '', '']

result = client.service.GetCorpStatesEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    CheckCorpNumList=client.get_type("ns0:ArrayOfString")(checkCorpNumList),
)

if len(result) == 1 and result[0].CorpNum is None and result[0].State < 0:  # 호출 실패
    print(result[0].State)
else:  # 호출 성공
    for corpState in result:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(corpState)
