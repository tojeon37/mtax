from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#GetSendKakaotalksEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
sendKeyList = ['', '']

result = client.service.GetSendKakaotalksEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    SendKeyList=client.get_type("ns0:ArrayOfString")(sendKeyList),
)

if len(result) == 1 and result[0].SendKey is None and result[0].SendStatus < 0:  # 호출 실패
    print(result[0].SendStatus)
else:  # 호출 성공
    for kakaotalk in result:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(kakaotalk)
