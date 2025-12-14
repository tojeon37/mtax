import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# https://dev.barobill.co.kr/docs/guides/바로빌-API-개발준비#FTP 를 참고하여 FTP에 파일을 업로드하신 후 API를 실행해주세요.
# ---------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#SendFWKakaotalks
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
senderId = ''
channelId = ''
sendDT = ''
adYN = False
imageName = ''
imageLink = ''
smsReply = ''
smsSenderNum = ''
kakaotalkMessages = [
    client.get_type('ns0:KakaotalkFTMessage')(
        ReceiverNum='',
        ReceiverName='',
        Message='',
        SmsSubject='',
        SmsMessage='',
        Buttons=client.get_type('ns0:ArrayOfKakaotalkButton')([
            client.get_type('ns0:KakaotalkButton')(
                Name='',
                ButtonType='',
                Url1='',
                Url2=''
            )
        ])
    ),
    client.get_type('ns0:KakaotalkFTMessage')(
        ReceiverNum='',
        ReceiverName='',
        Message='',
        SmsSubject='',
        SmsMessage='',
        Buttons=client.get_type('ns0:ArrayOfKakaotalkButton')([
            client.get_type('ns0:KakaotalkButton')(
                Name='',
                ButtonType='',
                Url1='',
                Url2=''
            )
        ])
    )
]

result = client.service.SendFWKakaotalks(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SenderID=senderId,
    ChannelId=channelId,
    SendDT=sendDT,
    AdYN=adYN,
    ImageName=imageName,
    ImageLink=imageLink,
    SmsReply=smsReply,
    SmsSenderNum=smsSenderNum,
    KakaotalkMessages=client.get_type('ns0:ArrayOfKakaotalkFTMessage')(kakaotalkMessages),
)

if re.compile('^-[0-9]{5}$').match(result[0]) is not None:  # 호출 실패
    print(result[0])
else:  # 호출 성공
    for sendKey in result:
        print(sendKey)
