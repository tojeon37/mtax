from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/EDOC.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/EDOC.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/전자문서-API#RegistEDoc
# ---------------------------------------------------------------------------------------------------
certKey = ''
edoc = client.get_type('ns0:EDoc')(
    MgtKey='',
    UserID='',
    FormKey='',
    EDocInvoiceType=1,
    CertYN=False,
    AutoAcceptYN=False,
    BusinessLicenseYN=False,
    BankBookYN=False,
    WriteDate='',
    TaxType=1,
    PurposeType=2,
    AmountTotal='',
    TaxTotal='',
    TotalAmount='',
    Remark1='',
    Remark2='',
    Remark3='',
    SerialNum='',
    InvoicerParty=client.get_type('ns0:EDocParty')(
        CorpNum='',
        TaxRegID='',
        CorpName='',
        CEOName='',
        Addr='',
        BizClass='',
        BizType='',
        ContactName='',
        DeptName='',
        TEL='',
        HP='',
        FAX='',
        Email=''
    ),
    InvoiceeParty=client.get_type('ns0:EDocParty')(
        CorpNum='',
        TaxRegID='',
        CorpName='',
        CEOName='',
        Addr='',
        BizClass='',
        BizType='',
        ContactName='',
        DeptName='',
        TEL='',
        HP='',
        FAX='',
        Email=''
    ),
    EDocProperties=client.get_type('ns0:ArrayOfEDocProperty')([
        client.get_type('ns0:EDocProperty')(
            Name='',
            Value=''
        ),
        client.get_type('ns0:EDocProperty')(
            Name='',
            Value=''
        ),
        client.get_type('ns0:EDocProperty')(
            Name='',
            Value=''
        )
    ]),
    EDocTradeLineItems=client.get_type('ns0:ArrayOfEDocTradeLineItem')([
        client.get_type('ns0:EDocTradeLineItem')(
            PurchaseExpiry='',
            Name='',
            Information='',
            ChargeableUnit='',
            UnitPrice='',
            Amount='',
            Tax='',
            Description='',
            Temp1='',
            Temp2='',
            Temp3='',
            Temp4='',
            Temp5=''
        ),
        client.get_type('ns0:EDocTradeLineItem')(
            PurchaseExpiry='',
            Name='',
            Information='',
            ChargeableUnit='',
            UnitPrice='',
            Amount='',
            Tax='',
            Description='',
            Temp1='',
            Temp2='',
            Temp3='',
            Temp4='',
            Temp5=''
        )
    ])
)

result = client.service.RegistEDoc(
    CERTKEY=certKey,
    CorpNum=edoc.InvoicerParty.CorpNum,
    UserID=edoc.UserID,
    Invoice=edoc,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
