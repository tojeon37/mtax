from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CASHBILL.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CASHBILL.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/현금영수증-API#RegistCashBillEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
userId = ''
cashBill = client.get_type('ns0:CashBillEx')(
    MgtKey='',
    FranchiseCorpNum='',
    FranchiseMemberID='',
    FranchiseCorpName='',
    FranchiseCEOName='',
    FranchiseAddr='',
    FranchiseTel='',
    IdentityNum='',
    HP='',
    Fax='',
    Email='',
    TradeDate='',
    TradeType='',
    TradeUsage='',
    TradeDeductionType='',
    TradeMethod='',
    ItemName='',
    Amount='',
    Tax='',
    ServiceCharge='',
    CancelType='',
    CancelNTSConfirmNum='',
    CancelNTSConfirmDate='',
)

result = client.service.RegistCashBillEx(
    CERTKEY=certKey,
    CorpNum=cashBill.FranchiseCorpNum,
    UserID=userId,
    Invoice=cashBill,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
