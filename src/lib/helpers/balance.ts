import SDK from 'kucoin-node-sdk'
import { ACCOUNTS } from 'lib/constants/account'
import { IAccount } from 'lib/types/accounts'
import { asyncHandler } from './async'

export const getBalance = (currency: string) => parseFloat(ACCOUNTS[currency]?.available || '')

export const refreshBalances = async () => {
  const [result, error] = await asyncHandler<IAccount[]>(SDK.rest.User.Account.getAccountsList({ type: 'trade' }))
  if (result) result.forEach(account => (ACCOUNTS[account.currency] = account))

  error && console.error(error)
}

// export const equity = async (currency) => {
//   // connect
//   // _datafeed.connectSocket();
//   let topic = `/account/balance`
//   _datafeed.subscribe(
//     topic,
//     (payload) => {
//       currencies[currency || payload.data.currency] = payload.data
//     },
//     true
//   )
// }
// const initSocket = () => {
//   _datafeed = new api.websocket.Datafeed(true)
//   _datafeed.connectSocket()
// }
