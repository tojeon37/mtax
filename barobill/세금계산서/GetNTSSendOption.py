from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#GetNTSSendOption
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''

result = client.service.GetNTSSendOption(
    CERTKEY=certKey,
    CorpNum=corpNum,
)

if result.TaxationOption < 0:  # 호출 실패
    print(result.TaxationOption)
else:  # 호출 성공
    # 필드정보는 레퍼런스를 참고해주세요.
    print(result)
