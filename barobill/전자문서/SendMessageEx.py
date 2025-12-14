import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#SendMessageEx
# ---------------------------------------------------------------------------------------------------
certKey    = ''
corpNum    = ''
userId     = ''
mgtKey     = ''
fromNumber = ''
toNumber   = ''
contents   = ''

result = client.service.SendMessageEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    MgtKey=mgtKey,
    FromNumber=fromNumber,
    ToNumber=toNumber,
    Contents=contents,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)