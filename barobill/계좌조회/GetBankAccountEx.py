import re

from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/BANKACCOUNT.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/계좌조회-API#GetBankAccountEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
availOnly = 1

result = client.service.GetBankAccountEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    AvailOnly=availOnly,
)

if result is not None and re.compile('^-[0-9]{5}$').match(result[0].BankAccountNum) is not None:  # 호출 실패
    print(result[0].BankAccountNum)
else:  # 호출 성공
    bankAccounts = [] if result is None else result

    for bankAccount in bankAccounts:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(bankAccount)
