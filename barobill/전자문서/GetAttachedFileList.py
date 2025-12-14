from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#GetAttachedFileList
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
mgtKey = ''

result = client.service.GetAttachedFileList(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    MgtKey=mgtKey,
)

if result is not None and result[0].FileIndex < 0:  # 호출 실패
    print(result[0].FileIndex)
else:  # 호출 성공
    attachedFiles = [] if result is None else result

    for attachedFile in attachedFiles:
        print(attachedFile)
