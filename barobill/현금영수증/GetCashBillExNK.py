from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CASHBILL.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CASHBILL.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/현금영수증-API#GetCashBillExNK
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
tradeDate = ''
ntsConfirmNum = ''

result = client.service.GetCashBillExNK(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    TradeDate=tradeDate,
   	NTSConfirmNum=ntsConfirmNum,
)

if result.TradeType < '0':  # 호출 실패
    print(result.TradeType)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
