import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'
import {
  getOrder
} from './config/utils.js'

database.connect

const update = async () => {
  let orders = await Orders.find({}).lean()
  if (orders) {
    for (const i in orders) {
      let order = orders[i]
      let SLOrder = order.relatedOrders.SL
      let TPOrder = order.relatedOrders.TP
      let updatedSL = await getOrder(SLOrder.id)
      let updatedTP = await getOrder(TPOrder.id)
      if (!updatedSL || !updatedTP) continue
      if (updatedSL.stopTriggered) {
        order.status = 'SL'
        order.relatedOrders.SL = updatedSL
        order.save()
      }
      if (updatedTP.stopTriggered) {
        order.status = 'TP'
        order.relatedOrders.TP = updatedTP
        order.save()
      }
    }

  }
}

const getWinrate = async () => {
  let lastOrders = await Orders.find().sort(-1).limit(100).lean()
  let wonOrders = lastOrders.filter(order => order.status === 'TP')
  let lostOrders = lastOrders.filter(order => order.status === 'SL')

  console.log(`No. of trades: ${lastOrders.length}`);
  console.log(`Won: ${wonOrders.length}`);
  console.log(`Lost: ${lostOrders.length}`);
  console.log(`Winning percentage: ${wonOrders.length}%`);

}