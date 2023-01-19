import { ISubAccount } from '../accounts'
import { $accountType } from './sdk'

export interface IUser {
  UserInfo: { getSubUsers: (userId?: string) => Promise<any> }
  Account: IAccount
  Deposit: IDeposit
  Withdrawals: IWithdrawals
  TradeFee: ITradeFee
}

interface IAccount {
  createAccount: () => Promise<any>
  getAccountsList: (params?: { type?: $accountType; currency?: string }) => Promise<any>
  getAccountInformation: () => Promise<any>
  getAccountLedgers: () => Promise<any>
  getHolds: () => Promise<any>
  getBalanceOfSubAccount: (accountId: string) => Promise<ISubAccount>
  getAggregatedBalanceOfAllSubAccounts: () => Promise<any>
  getTransferable: () => Promise<any>
  transferBetweenMasterUserAndSubUser: () => Promise<any>
  innerTransfer: () => Promise<any>
}

interface IDeposit {
  createDepositAddress: () => Promise<any>
  getDepositAddress: () => Promise<any>
  getDepositAddressV2: () => Promise<any>
  getDepositList: () => Promise<any>
  getV1HistoricalDepositsList: () => Promise<any>
}

interface IWithdrawals {
  getWithdrawalsList: () => Promise<any>
  getV1HistoricalWithdrawalsList: () => Promise<any>
  getWithdrawalQuotas: () => Promise<any>
  applyWithdraw: () => Promise<any>
  cancelWithdrawal: () => Promise<any>
}

interface ITradeFee {
  getBasicUserFee: () => Promise<any>
  getActualFeeRateBySymbols: () => Promise<any>
}
