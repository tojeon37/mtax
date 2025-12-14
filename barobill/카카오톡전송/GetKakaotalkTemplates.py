from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#GetKakaotalkTemplates
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
channelId = ''

result = client.service.GetKakaotalkTemplates(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ChannelId=channelId,
)

if result is not None and result[0].Status < 0:  # 호출 실패
    print(result[0].Status)
else:  # 호출 성공
    templates = [] if result is None else result

    for template in templates:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(template)
