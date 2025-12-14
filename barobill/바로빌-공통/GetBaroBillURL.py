import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#GetBaroBillURL
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
pwd = ''
togo = ''

result = client.service.GetBaroBillURL(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    PWD=pwd,
    TOGO=togo,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
