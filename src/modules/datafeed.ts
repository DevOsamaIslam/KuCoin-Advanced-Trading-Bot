import { getDatafeed } from 'app/init'
import { LIVE_ORDERS } from 'app/orders'
import SDK from 'kucoin-node-sdk'
import { ACCOUNTS } from 'lib/constants/account'
import { IDFAdvancedOrderPayload, IDFBalancePayload, IDFOrderPayload } from 'lib/types/datafeed'
import { asyncHandler } from 'lib/helpers/async'
import Logger from 'app/Logger'
import { IListStopOrders } from 'lib/types/sdk/trade'

const logger = Logger.getInstance()
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
      logger.verbose({ data })
      if (!data.clientOid) return
      if (data.clientOid.startsWith('SL') || data.clientOid.startsWith('TP')) return
      if (['done'].includes(data.status)) {
        LIVE_ORDERS[data.symbol] = { mainOrder: data }
        logger.info('main order', LIVE_ORDERS, { data })
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
      logger.info('advanced order', data.stop, data.type)

      if (data.type === 'TRIGGERED') {
        logger.info('order triggered', data)
        // if the triggered order is a stop loss (SL) order, cancel the take profit (TP) order,
        // otherwise cancel the stop loss (SL) order
        const order = data.stop === 'loss' ? LIVE_ORDERS[data.symbol]?.TP : LIVE_ORDERS[data.symbol]?.SL

        // if no corresponding order is found, return
        logger.info('canceling order', { orderId: order })
        if (!order) {
          logger.error('order to cancel not found', { orderId: order, LIVE_ORDERS })
          return
        }
        const [list] = await asyncHandler<IListStopOrders>(SDK.rest.Trade.StopOrder.getStopOrderList())
        const matchedOrder = list.items.find(item => item.id === order.orderId)?.clientOid
        if (!matchedOrder) {
          logger.error('order not found')
          return
        }
        // attempt to cancel the corresponding order
        const [response, error] = await asyncHandler(SDK.rest.Trade.StopOrder.cancelSingleOrderByClientOid(matchedOrder, data.symbol))
        // if the order is cancelled successfully, remove the symbol from the LIVE_ORDER object
        delete LIVE_ORDERS[data.symbol]
        logger.info({ response, error })
        logger.verbose('other order canceled', 'LIVE_ORDERS', LIVE_ORDERS)
      } else if (data.type === 'open') {
        // if a new order is created, save the orderId in the LIVE_ORDER object
        if (data.stop === 'loss' && LIVE_ORDERS[data.symbol]) LIVE_ORDERS[data.symbol].SL = data
        else if (data.stop === 'entry' && LIVE_ORDERS[data.symbol]) LIVE_ORDERS[data.symbol].TP = data
        logger.verbose('order opened', 'LIVE_ORDERS', LIVE_ORDERS)
      }
    },
    true,
  )
}
