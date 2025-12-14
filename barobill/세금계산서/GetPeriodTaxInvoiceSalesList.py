from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#GetPeriodTaxInvoiceSalesList
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
taxType = 1
dateType = 1
startDate = ''
endDate = ''
countPerPage = 10
currentPage = 1

result = client.service.GetPeriodTaxInvoiceSalesList(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    TaxType=taxType,
    DateType=dateType,
    StartDate=startDate,
    EndDate=endDate,
    CountPerPage=countPerPage,
    CurrentPage=currentPage,
)

if result.CurrentPage < 0:  # 호출 실패
    print(result.CurrentPage)
else:  # 호출 성공
    print(result.CurrentPage)
    print(result.CountPerPage)
    print(result.MaxPageNum)
    print(result.MaxIndex)

    simpleTaxInvoices = [] if result is None else result.SimpleTaxInvoiceExList.SimpleTaxInvoiceEx

    for simpleTaxInvoice in simpleTaxInvoices:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(simpleTaxInvoice)
