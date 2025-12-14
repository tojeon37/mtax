import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#GetCorpMemberContacts
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
checkCorpNum = ''

result = client.service.GetCorpMemberContacts(
    CERTKEY=certKey,
    CorpNum=corpNum,
    CheckCorpNum=checkCorpNum,
)

if re.compile('^-[0-9]{5}$').match(result[0].ContactName) is not None:  # 호출 실패
    print(result[0].ContactName)
else:  # 호출 성공
    for log in result:
        print(log)
