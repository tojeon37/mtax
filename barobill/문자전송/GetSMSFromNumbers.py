import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#GetSMSFromNumbers
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''

result = client.service.GetSMSFromNumbers(
    CERTKEY=certKey,
    CorpNum=corpNum,
)

if result is not None and re.compile('^-[0-9]{5}$').match(result[0].Number) is not None:  # 호출 실패
    print(result[0].Number)
else:  # 호출 성공
    fromNumbers = [] if result is None else result

    for fromNumber in fromNumbers:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(fromNumber)
