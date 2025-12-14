import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#SendATKakaotalk
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
senderId = ''
templateName = ''
sendDT = ''
smsReply = ''
smsSenderNum = ''
kakaotalkMessage = client.get_type('ns0:KakaotalkATMessage')(
    ReceiverNum='',
    ReceiverName='',
    Title='',
    Message='',
    SmsSubject='',
    SmsMessage='',
)

result = client.service.SendATKakaotalk(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    TemplateName=templateName,
    SendDT=sendDT,
    SmsReply=smsReply,
    SmsSenderNum=smsSenderNum,
    KakaotalkMessage=kakaotalkMessage,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
