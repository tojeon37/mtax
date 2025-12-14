from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#GetAttachedFileListEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
mgtKey = ''

result = client.service.GetAttachedFileListEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    MgtKey=mgtKey,
)

if result is not None and result[0].FileIndex < 0:  # 호출 실패
    print(result[0].FileIndex)
else:  # 호출 성공
    attachedFiles = [] if result is None else result

    for attachedFile in attachedFiles:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(attachedFile)
