import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/FAX.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/FAX.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# https://dev.barobill.co.kr/docs/guides/바로빌-API-개발준비#FTP 를 참고하여 FTP에 파일을 업로드하신 후 API를 실행해주세요.
# ---------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/팩스전송-API#SendFaxFromFTPEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
senderId = ''
fileNames = ['', '']
fromNumber = ''
toNumber = ''
receiveCorp = ''
receiveName = ''
sendDT = ''
refKey = ''

result = client.service.SendFaxFromFTPEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    FileCount=len(fileNames),
    FileNames=client.get_type("ns0:ArrayOfString")(fileNames),
    FromNumber=fromNumber,
    ToNumber=toNumber,
    ReceiveCorp=receiveCorp,
    ReceiveName=receiveName,
    SendDT=sendDT,
    RefKey=refKey,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
