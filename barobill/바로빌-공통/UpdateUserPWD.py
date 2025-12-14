from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#UpdateUserPWD
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
newPWD = ''

result = client.service.UpdateUserPWD(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    newPWD=newPWD,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
