import { getDatafeed } from 'app/init'
import { LIVE_ORDERS } from 'app/orders'
import SDK from 'kucoin-node-sdk'
import { ACCOUNTS } from 'lib/constants/account'
import { IDFAdvancedOrderPayload, IDFBalancePayload, IDFOrderPayload } from 'lib/types/datafeed'
import { asyncHandler } from 'lib/helpers/async'
import Logger from 'app/Logger'

const log = Logger.getInstance()
export const liveEquity = () => {
  getDatafeed().subscribe(
    '/spotMarket/tradeOrdersV2',
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

export const liveOrders = () => {
  getDatafeed().subscribe(
    '/spotMarket/tradeOrders',
    async (payload: IDFOrderPayload) => {
      const { data } = payload
      if (data.clientOid.startsWith('SL') || data.clientOid.startsWith('TP')) return
      if (['filled'].includes(data.type)) {
        log.info('main order', { data })
        LIVE_ORDERS[data.symbol] = { mainOrder: data.orderId }
      }
    },
    true,
  )
}

export const liveAdvancedOrders = () => {
  getDatafeed().subscribe(
    '/spotMarket/advancedOrders',
    async (payload: IDFAdvancedOrderPayload) => {
      const { data } = payload
      log.info('advanced order', data.stop, data.type)

      if (data.type === 'TRIGGERED') {
        // if the triggered order is a stop loss (SL) order, cancel the take profit (TP) order,
        // otherwise cancel the stop loss (SL) order
        const orderId = data.stop === 'loss' ? LIVE_ORDERS[data.symbol]?.TP : LIVE_ORDERS[data.symbol]?.SL

        // if no corresponding order is found, return
        if (!orderId) return
        log.info('canceling order', orderId)
        // attempt to cancel the corresponding order
        const [response, error] = await asyncHandler(SDK.rest.Trade.StopOrder.cancelOrder(data.symbol, orderId))
        // if the order is cancelled successfully, remove the symbol from the LIVE_ORDER object
        delete LIVE_ORDERS[data.symbol]
        log.info({ response, error })
      } else if (data.type === 'open') {
        // if a new order is created, save the orderId in the LIVE_ORDER object
        if (data.stop === 'loss' && LIVE_ORDERS[data.symbol]) LIVE_ORDERS[data.symbol].SL = data.orderId
        else if (data.stop === 'entry' && LIVE_ORDERS[data.symbol]) LIVE_ORDERS[data.symbol].TP = data.orderId
      }
    },
    true,
  )
}
