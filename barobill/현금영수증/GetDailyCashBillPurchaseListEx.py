from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CASHBILL.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CASHBILL.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/현금영수증-API#GetDailyCashBillPurchaseListEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
baseDate = ''
countPerPage = 10
currentPage = 1
orderDirection = 1

result = client.service.GetDailyCashBillPurchaseListEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    BaseDate=baseDate,
    CountPerPage=countPerPage,
    CurrentPage=currentPage,
    OrderDirection=orderDirection,
)

if result.CurrentPage < 0:  # 호출 실패
    print(result.CurrentPage)
else:  # 호출 성공
    print(result.CurrentPage)
    print(result.CountPerPage)
    print(result.MaxPageNum)
    print(result.MaxIndex)

    simpleCashbills = [] if result is None else result.SimpleCashBillExList.SimpleCashBillEx

    for simpleCashbill in simpleCashbills:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(simpleCashbill)
