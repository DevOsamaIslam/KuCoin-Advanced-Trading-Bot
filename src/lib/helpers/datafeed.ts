import { getDatafeed } from 'app/init'
import { ACCOUNTS } from 'lib/constants/account'
import { IDFBalancePayload } from 'lib/types/datafeed'

export const liveEquity = () => {
  getDatafeed().subscribe(
    '/account/balance',
    async (payload: IDFBalancePayload) => {
      const { data } = payload
      const currentAccount = ACCOUNTS[data.currency]
      if (currentAccount) {
        currentAccount.available = data.available
        currentAccount.holds = data.hold
      }
    },
    true,
  )
}
