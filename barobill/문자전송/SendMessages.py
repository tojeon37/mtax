import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/SMS.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/SMS.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/문자전송-API#SendMessages
# ---------------------------------------------------------------------------------------------------
certKey = '2EEB39BB-1A6A-4796-B1AC-67EB2F2BCD39'
corpNum = ''
senderId = ''
cutToSMS = True
messages = [
    client.get_type('ns0:XMSMessage')(
        SenderNum='15448385',
        ReceiverName='',
        ReceiverNum='01049363635',
        Message='12312312312',
        RefKey='',
    ),
]
sendDT = ''

print(messages)

result = client.service.SendMessages(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    SendCount=len(messages),
    CutToSMS=cutToSMS,
    Messages=client.get_type("ns0:ArrayOfXMSMessage")(messages),
    SendDT=sendDT,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
