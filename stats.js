import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'
import {
  getOrder,
  cancelOrder
} from './config/utils.js'

database.connect



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
  console.log(`Winning percentage: ${((wonOrders.length / orders.length) * 100).toFixed(1)}%`);

}

update().then(() => getWinrate().then(() => exit()))

const exit = () => process.exit()