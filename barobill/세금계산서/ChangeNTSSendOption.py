from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#ChangeNTSSendOption
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
ntsSendOption = client.get_type('ns0:NTSSendOption')(
    TaxationOption=1,
    TaxationAddTaxAllowYN=0,
    TaxExemptionOption=1,
    TaxExemptionAddTaxAllowYN=0
)

result = client.service.ChangeNTSSendOption(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    NTSSendOption=ntsSendOption,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
