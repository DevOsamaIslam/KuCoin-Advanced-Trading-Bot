import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'
import {
  getOrder
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
        orders[i].save()
      }
      if (updatedTP.stopTriggered) {
        order.status = 'TP'
        order.relatedOrders.TP = updatedTP
        orders[i].save()
      }
    }

  }
}

const getWinrate = async () => {
  let lastOrders = await Orders.find({
    status: {
      $ne: 'ongoing'
    }
  }).sort('-1').limit(100).lean()
  let wonOrders = lastOrders.filter(order => order.status === 'TP')
  let lostOrders = lastOrders.filter(order => order.status === 'SL')

  console.log(`No. of trades: ${lastOrders.length}`);
  console.log(`Won: ${wonOrders.length}`);
  console.log(`Lost: ${lostOrders.length}`);
  console.log(`Winning percentage: ${wonOrders.length}%`);

}

update().then(() => getWinrate().then(() => exit()))

const exit = () => process.exit()