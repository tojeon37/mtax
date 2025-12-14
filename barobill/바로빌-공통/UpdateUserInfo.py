from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/바로빌-공통-API#UpdateUserInfo
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
id = ''
memberName = ''
tel = ''
hp = ''
email = ''
grade = ''

result = client.service.UpdateUserInfo(
    CERTKEY=certKey,
    CorpNum=corpNum,
    ID=id,
    MemberName=memberName,
    TEL=tel,
    HP=hp,
    Email=email,
    Grade=grade,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
