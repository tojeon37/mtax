import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#GetChargeUnitCostEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
chargeCode = 1

result = client.service.GetChargeUnitCostEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ChargeCode=chargeCode,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
