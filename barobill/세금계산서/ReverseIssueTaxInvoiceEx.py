from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#ReverseIssueTaxInvoiceEx
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
mgtKey = ''
sendSMS = False
smsMessage = ''
forceIssue = False
mailTitle = ''

result = client.service.ReverseIssueTaxInvoiceEx(
    CERTKEY=certKey,
    CorpNum=corpNum,
    MgtKey=mgtKey,
    SendSMS=sendSMS,
    SMSMessage=smsMessage,
    ForceIssue=forceIssue,
    MailTitle=mailTitle,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
