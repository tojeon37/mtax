from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/계좌조회-API#RegistBankAccount
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
collectCycle = ''
bank = ''
bankAccountType = ''
bankAccountNum = ''
bankAccountPwd = ''
webId = ''
webPwd = ''
identityNum = ''
alias = ''
usage = ''

result = client.service.RegistBankAccount(
    CERTKEY=certKey,
    CorpNum=corpNum,
    CollectCycle=collectCycle,
    Bank=bank,
    BankAccountType=bankAccountType,
    BankAccountNum=bankAccountNum,
    BankAccountPwd=bankAccountPwd,
    WebId=webId,
    WebPwd=webPwd,
    IdentityNum=identityNum,
    Alias=alias,
    Usage=usage,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
