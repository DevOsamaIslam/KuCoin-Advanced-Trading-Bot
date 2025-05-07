import SDK from 'kucoin-node-sdk'
import { ACCOUNTS } from 'lib/constants/account'
import { IAccount } from 'lib/types/accounts'
import { asyncHandler } from './async'

export const getBalance = (currency: string) => parseFloat(ACCOUNTS[currency]?.available || '0')

export const refreshBalances = async () => {
  const [result, error] = await asyncHandler<IAccount[]>(SDK.rest.User.Account.getAccountsList({ type: 'trade' }))
  if (result) result.forEach(account => (ACCOUNTS[account.currency] = account))

  error && console.error(error)

  return ACCOUNTS
}
