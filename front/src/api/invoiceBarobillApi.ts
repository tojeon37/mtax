/**
 * 바로빌 세금계산서 발행 API
 */
import { barobillTaxInvoiceAPI } from '../lib/api'

export interface BarobillInvoiceData {
  IssueDirection: number
  TaxInvoiceType: number
  TaxType: number
  TaxCalcType: number
  PurposeType: number
  WriteDate: string
  AmountTotal: string
  TaxTotal: string
  TotalAmount: string
  cash?: string
  chkBill?: string
  note?: string
  credit?: string
  InvoicerParty: {
    CorpNum: string
    CorpName: string
    CEOName: string
    Addr: string
    BizType: string
    BizClass: string
    Email: string
    HP: string
    TEL: string
  }
  InvoiceeParty: {
    CorpNum: string
    CorpName: string
    CEOName: string
    Addr: string
    BizType: string
    BizClass: string
    Email: string
  }
  TaxInvoiceTradeLineItems: Array<{
    Name: string
    Information: string
    ChargeableUnit: string
    UnitPrice: string
    Amount: string
    Tax: string
    Description: string
  }>
  IssueTiming: number
}

export interface BarobillInvoiceResponse {
  success: boolean
  result_code?: number
  message?: string
}

/**
 * 바로빌 세금계산서 발행
 */
export const issueBarobillInvoice = async (
  data: BarobillInvoiceData
): Promise<BarobillInvoiceResponse> => {
  const response = await barobillTaxInvoiceAPI.issue(data)
  return response.data
}

