from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CARD.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CARD.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카드조회-API#ReRegistCard
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
cardNum = ''

result = client.service.ReRegistCard(
    CERTKEY=certKey,
    CorpNum=corpNum,
    CardNum=cardNum,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
