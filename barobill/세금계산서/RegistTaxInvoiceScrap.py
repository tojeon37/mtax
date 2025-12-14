from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#RegistTaxInvoiceScrap
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
hometaxLoginMethod = ''
hometaxID = ''
hometaxPWD = ''

result = client.service.RegistTaxInvoiceScrap(
    CERTKEY=certKey,
    CorpNum=corpNum,
    HometaxLoginMethod=hometaxLoginMethod,
    HometaxID=hometaxID,
    HometaxPWD=hometaxPWD,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
