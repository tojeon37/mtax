from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/CARD.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/CARD.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카드조회-API#GetDailyCardApprovalLog
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
cardNum = ''
baseDate = ''
countPerPage = 10
currentPage = 1
orderDirection = 1

result = client.service.GetDailyCardApprovalLog(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    CardNum=cardNum,
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

    cardLogs = [] if result.CardLogList is None else result.CardLogList.CardApprovalLog

    for cardLog in cardLogs:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(cardLog)
