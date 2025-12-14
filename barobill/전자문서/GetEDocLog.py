from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#GetEDocLog
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
userId = ''
mgtKey = ''

result = client.service.GetEDocLog(
    CERTKEY=certKey,
    CorpNum=corpNum,
    UserID=userId,
    MgtKey=mgtKey,
)

if result[0].Seq < 0:  # 호출 실패
    print(result[0].Seq)
else:  # 호출 성공
    for log in result:
        print(log)
