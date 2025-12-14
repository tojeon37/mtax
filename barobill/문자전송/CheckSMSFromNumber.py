from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#CheckSMSFromNumber
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
fromNumber = ''

result = client.service.CheckSMSFromNumber(
    CERTKEY=certKey,
    CorpNum=corpNum,
    FromNumber=fromNumber,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
