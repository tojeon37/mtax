import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/SMS.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/SMS.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/문자전송-API#SendMessage
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
senderId = ''
fromNumber = ''
toName = ''
toNumber = ''
contents = ''
sendDT = ''
refKey = ''

result = client.service.SendMessage(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    FromNumber=fromNumber,
    ToName=toName,
    ToNumber=toNumber,
    Contents=contents,
    SendDT=sendDT,
    RefKey=refKey,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
