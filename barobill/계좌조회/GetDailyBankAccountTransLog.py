from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/계좌조회-API#GetDailyBankAccountTransLog
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
bankAccountNum = ''
baseDate = ''
transDirection = 1
countPerPage = 10
currentPage = 1
orderDirection = 1

result = client.service.GetDailyBankAccountTransLog(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    BankAccountNum=bankAccountNum,
    BaseDate=baseDate,
    TransDirection=transDirection,
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

    bankAccountLogs = [] if result.BankAccountLogList is None else result.BankAccountLogList.BankAccountTransLog

    for bankAccountLog in bankAccountLogs:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(bankAccountLog)
