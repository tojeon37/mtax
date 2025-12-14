from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#RemoveDocLinkage
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
fromDocType = 1
fromMgtKey = ''
toDocType = 1
toMgtKey = ''

result = client.service.RemoveDocLinkage(
    CERTKEY=certKey,
    CorpNum=corpNum,
    FromDocType=fromDocType,
    FromMgtKey=fromMgtKey,
    ToDocType=toDocType,
    ToMgtKey=toMgtKey,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
