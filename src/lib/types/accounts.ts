export interface IAccount {
  currency: string
  balance: string
  available: string
  holds: string
  baseCurrency: string
  baseCurrencyPrice: string
  baseAmount: string
  tag: string
}

export interface ISubAccount {
  subUserId: string
  subName: string
  mainAccounts: IAccount[]
  tradeAccounts: IAccount[]
  marginAccounts: IAccount[]
  tradeHFAccounts: IAccount[]
}
