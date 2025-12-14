from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#GetTaxInvoiceNK
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
ntsConfirmNum = ''

result = client.service.GetTaxInvoiceNK(
    CERTKEY=certKey,
    CorpNum=corpNum,
    NTSConfirmNum=ntsConfirmNum,
)

if result.TaxInvoiceType < 0:  # 호출 실패
    print(result.TaxInvoiceType)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
