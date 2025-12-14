import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/FAX.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/FAX.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/팩스전송-API#GetFaxFileURL
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKey = ''
fileType = 1

result = client.service.GetFaxFileURL(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKey=sendKey,
    FileType=fileType,
)

if re.compile('^-[0-9]{5}$').match(result[0]) is not None:  # 호출 실패
    print(result[0])
else:  # 호출 성공
    for url in result:
        print(url)
