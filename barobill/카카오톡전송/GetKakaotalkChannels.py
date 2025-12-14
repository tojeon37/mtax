from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#GetKakaotalkChannels
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''

result = client.service.GetKakaotalkChannels(
    CERTKEY=certKey,
    CorpNum=corpNum,
)

if result is not None and result[0].Status < 0:  # 호출 실패
    print(result[0].Status)
else:  # 호출 성공
    channels = [] if result is None else result

    for channel in channels:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(channel)
