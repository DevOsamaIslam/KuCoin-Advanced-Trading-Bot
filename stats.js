import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'
import {
  getOrder,
  cancelOrder
} from './config/utils.js'

database.connect

const update = async () => {
  let orders = await Orders.find({})
  if (orders) {
    for (const i in orders) {
      let order = orders[i]
      let SLOrder = order.relatedOrders.SL
      let TPOrder = order.relatedOrders.TP
      let updatedSL = false
      let updatedTP = false

      do {
        if (!updatedSL) updatedSL = await getOrder(SLOrder.id)
        if (!updatedTP) updatedTP = await getOrder(TPOrder.id)
      } while (!updatedSL || !updatedTP)

      if (updatedSL.stopTriggered) {
        order.status = 'SL'
        order.relatedOrders.SL = updatedSL
        cancelOrder(order.relatedOrders.TP.id)
        orders[i].save()
      } else if (updatedTP.stopTriggered) {
        order.status = 'TP'
        order.relatedOrders.TP = updatedTP
        cancelOrder(order.relatedOrders.SL.id)
        orders[i].save()
      }
    }

  }
}

const getWinrate = async () => {
  let orders = await Orders.find({
    status: {
      $ne: 'ongoing'
    }
  }).sort('-1').limit(300).lean()
  let wonOrders = orders.filter(order => order.status === 'TP')
  let lostOrders = orders.filter(order => order.status === 'SL')

  console.log(`No. of trades: ${orders.length}`);
  console.log(`Won: ${wonOrders.length}`);
  console.log(`Lost: ${lostOrders.length}`);
  console.log(`Winning percentage: ${wonOrders.length / orders.length}%`);

}

update().then(() => getWinrate().then(() => exit()))

const exit = () => process.exit()