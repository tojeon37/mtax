from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/계좌조회-API#UpdateBankAccountEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
bankAccountNum = ''
bankAccountPwd = ''
webId = ''
webPwd = ''
identityNum = ''
foreignCurrencyCodes = ['', '', '']
alias = ''
usage = ''

result = client.service.UpdateBankAccountEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    BankAccountNum=bankAccountNum,
    BankAccountPwd=bankAccountPwd,
    WebId=webId,
    WebPwd=webPwd,
    IdentityNum=identityNum,
    ForeignCurrencyCodes=foreignCurrencyCodes,
    Alias=alias,
    Usage=usage,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
