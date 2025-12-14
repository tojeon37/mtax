from zeep import Client  # https://pypi.org/project/zeep/

client = Client("https://testws.baroservice.com/TI.asmx?WSDL")  # 테스트서버
# client = Client("https://ws.baroservice.com/TI.asmx?WSDL")  # 운영서버

# ---------------------------------------------------------------------------------------------------
# API 레퍼런스 : https://dev.barobill.co.kr/docs/references/세금계산서-API#RegistBrokerTaxInvoiceEX
# ---------------------------------------------------------------------------------------------------
certKey = ''
taxInvoice = client.get_type('ns0:TaxInvoice')(
    IssueDirection=1,
    TaxInvoiceType=4,
    ModifyCode='',
    TaxType=1,
    TaxCalcType=1,
    PurposeType=2,
    WriteDate='',
    AmountTotal='',
    TaxTotal='',
    TotalAmount='',
    Cash='',
    ChkBill='',
    Note='',
    Credit='',
    Remark1='',
    Remark2='',
    Remark3='',
    Kwon='',
    Ho='',
    SerialNum='',
    InvoicerParty=client.get_type('ns0:InvoiceParty')(
        MgtNum='',
        CorpNum='',
        TaxRegID='',
        CorpName='',
        CEOName='',
        Addr='',
        BizClass='',
        BizType='',
        ContactID='',
        ContactName='',
        TEL='',
        HP='',
        Email='',
    ),
    InvoiceeParty=client.get_type('ns0:InvoiceParty')(
        MgtNum='',
        CorpNum='',
        TaxRegID='',
        CorpName='',
        CEOName='',
        Addr='',
        BizClass='',
        BizType='',
        ContactID='',
        ContactName='',
        TEL='',
        HP='',
        Email='',
    ),
    BrokerParty=client.get_type('ns0:InvoiceParty')(
        MgtNum='',
        CorpNum='',
        TaxRegID='',
        CorpName='',
        CEOName='',
        Addr='',
        BizClass='',
        BizType='',
        ContactID='',
        ContactName='',
        TEL='',
        HP='',
        Email='',
    ),
    TaxInvoiceTradeLineItems=client.get_type('ns0:ArrayOfTaxInvoiceTradeLineItem')([
        client.get_type('ns0:TaxInvoiceTradeLineItem')(
            PurchaseExpiry='',
            Name='',
            Information='',
            ChargeableUnit='',
            UnitPrice='',
            Amount='',
            Tax='',
            Description='',
        ),
        client.get_type('ns0:TaxInvoiceTradeLineItem')(
            PurchaseExpiry='',
            Name='',
            Information='',
            ChargeableUnit='',
            UnitPrice='',
            Amount='',
            Tax='',
            Description='',
        ),
    ]),
)

issueTiming = 1

result = client.service.RegistBrokerTaxInvoiceEX(
    CERTKEY=certKey,
    CorpNum=taxInvoice.BrokerParty.CorpNum,
    Invoice=taxInvoice,
    IssueTiming=issueTiming,
)

if result < 0:  # 호출 실패
    print(result)
else:  # 호출 성공
    print(result)
