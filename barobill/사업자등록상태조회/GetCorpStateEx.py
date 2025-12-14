from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CORPSTATE.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CORPSTATE.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/사업자등록-상태조회-API#GetCorpStateEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
checkCorpNum = ''

result = client.service.GetCorpStateEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    CheckCorpNum=checkCorpNum,
)

if result.State < 0:  # 호출 실패
    print(result.State)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
