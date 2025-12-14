import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CARD.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CARD.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카드조회-API#GetCardEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
availOnly = 1

result = client.service.GetCardEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    AvailOnly=availOnly,
)

if result and re.compile('^-[0-9]{5}$').match(result[0].CardNum) is not None:  # 호출 실패
    print(result[0].CardNum)
else:  # 호출 성공
    cards = [] if result is None else result

    for card in cards:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(card)
