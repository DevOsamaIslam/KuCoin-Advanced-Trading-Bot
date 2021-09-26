import api from 'kucoin-node-sdk'
import dotenv from 'dotenv'
import sniper from './sniper.js'
import Orders from './records/model.js'
import {
  getOrder,
  cancelOrder
} from './config/utils.js'

import {
  config,
} from './config/keys.js'
import Watchdog from './Watchdog.js'
import settings, {
  database
} from './config/settings.js'

import {
  MACD,
  CMF_MACD,
  RTW,
  VWAP
} from './strategies/index.js'

dotenv.config()

api.init(config)

database.connect

api.rest.User.Account.getAccountsList({
  type: 'trade',
  currency: 'USDT'
}).then(data => {
  if (data.data) {
    new Watchdog({
      equity: data.data[0].available,
      strategy: {
        MACD,
        CMF_MACD
      }
    })
    setInterval(() => {
      update()
    }, 60 * 1000);
  }
})

const update = async () => {
  let orders = await Orders.find({
    status: 'ongoing'
  })
  if (orders) {
    for (const i in orders) {
      let order = orders[i]
      let SLOrder = order.relatedOrders.SL
      let TPOrder = order.relatedOrders.TP
      let updatedSL = false
      let updatedTP = false
      if (!SLOrder || !TPOrder) continue
      do {
        if (!updatedSL) updatedSL = await getOrder(SLOrder.id)
        if (!updatedTP) updatedTP = await getOrder(TPOrder.id)
      } while (!updatedSL || !updatedTP)

      if (updatedSL.stopTriggered) {
        console.log(`Loss on ${order.data.symbol}`);
        order.status = 'SL'
        order.relatedOrders.SL = updatedSL
        cancelOrder(order.relatedOrders.TP.id)
        orders[i].save()
      } else if (updatedTP.stopTriggered) {
        console.log(`Profit on ${order.data.symbol}`);
        order.status = 'TP'
        order.relatedOrders.TP = updatedTP
        cancelOrder(order.relatedOrders.SL.id)
        orders[i].save()
      }
    }

  }
}


export default api