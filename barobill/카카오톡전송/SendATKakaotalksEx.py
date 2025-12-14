import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#SendATKakaotalksEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
senderId = ''
yellowId = ''
templateName = ''
sendDT = ''
smsReply = ''
smsSenderNum = ''
kakaotalkMessages = [
    client.get_type('')(
        ReceiverNum='',
        ReceiverName='',
        Title='',
        Message='',
        SmsSubject='',
        SmsMessage='',
        Buttons=client.get_type('')([
            client.get_type('')(
                Name='',
                ButtonType='',
                Url1='',
                Url2=''
            )
        ])
    ),
    client.get_type('')(
        ReceiverNum='',
        ReceiverName='',
        Title='',
        Message='',
        SmsSubject='',
        SmsMessage='',
        Buttons=client.get_type('')([
            client.get_type('')(
                Name='',
                ButtonType='',
                Url1='',
                Url2=''
            )
        ])
    )
]

result = client.service.SendATKakaotalksEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    YellowId=yellowId,
    TemplateName=templateName,
    SendDT=sendDT,
    SmsReply=smsReply,
    SmsSenderNum=smsSenderNum,
    KakaotalkMessages=client.get_type('ns0:ArrayOfKakaotalkATMessageEx')(kakaotalkMessages),
)

if re.compile('^-[0-9]{5}$').match(result[0]) is not None:  # 호출 실패
    print(result[0])
else:  # 호출 성공
    for sendKey in result:
        print(sendKey)
