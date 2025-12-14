from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# https://dev.barobill.co.kr/docs/guides/바로빌-API-개발준비#FTP 를 참고하여 FTP에 파일을 업로드하신 후 API를 실행해주세요.
# ---------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#AttachFilesByFTP
# ---------------------------------------------------------------------------------------------------
certKey = ''
corpNum = ''
mgtKey = ''
fileNames = ['', '']
displayFileNames = ['', '']

result = client.service.AttachFilesByFTP(
    CERTKEY=certKey,
    CorpNum=corpNum,
    MgtKey=mgtKey,
    FileNames=client.get_type("ns0:ArrayOfString")(fileNames),
    DisplayFileNames=client.get_type("ns0:ArrayOfString")(displayFileNames),
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
