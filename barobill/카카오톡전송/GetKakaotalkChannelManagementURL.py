import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 테스트서버
# client = Client("https://testws.baroservice.com/Kakaotalk.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#GetKakaotalkChannelManagementURL
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''

result = client.service.GetKakaotalkChannelManagementURL(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
)

if re.compile('^-[0-9]{5}$').match(result) is not None:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
