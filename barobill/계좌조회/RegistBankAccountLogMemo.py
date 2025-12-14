from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/계좌조회-API#RegistBankAccountLogMemo
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
bankAccountNum = ''
transRefKey = ''
memo = ''

result = client.service.RegistBankAccountLogMemo(
    CERTKEY=certKey,
    CorpNum=corpNum,
    BankAccountNum=bankAccountNum,
    TransRefKey=transRefKey,
    Memo=memo,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
