from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CASHBILL.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CASHBILL.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/현금영수증-API#StopCashBillScrap
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''

result = client.service.StopCashBillScrap(
    CERTKEY=certKey,
    CorpNum=corpNum,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
