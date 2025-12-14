from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#GetTaxInvoiceLog
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
mgtKey = ''

result = client.service.GetTaxInvoiceLog(
    CERTKEY=certKey,
    CorpNum=corpNum,
    MgtKey=mgtKey,
)

if result[0].Seq < 0:  # 호출 실패
    print(result[0].Seq)
else:  # 호출 성공
    for log in result:
        # 필드정보는 레퍼런스를 참고해주세요.
        print(log)
