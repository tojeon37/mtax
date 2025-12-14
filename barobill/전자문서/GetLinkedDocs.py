from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#GetLinkedDocs
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
docType = 3
mgtKey = ''

result = client.service.GetLinkedDocs(
    CERTKEY=certKey,
    CorpNum=corpNum,
    DocType=docType,
    MgtKey=mgtKey,
)

if result is not None and result[0].DocType < 0:  # 호출 실패
    print(result[0].DocType)
else:  # 호출 성공
    linkedDocs = [] if result is None else result

    for linkedDoc in linkedDocs:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(linkedDoc)
