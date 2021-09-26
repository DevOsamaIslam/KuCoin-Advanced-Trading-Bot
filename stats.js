import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'
import {
  calcPerc,
} from './config/utils.js'

database.connect



const getWinrate = async () => {
  let orders = await Orders.find({
    status: {
      $ne: 'ongoing'
    }
  }).sort('-1').lean()
  let wonOrders = orders.filter(order => order.status === 'TP')
  let lostOrders = orders.filter(order => order.status === 'SL')
  let winRatio = ((wonOrders.length * 100) / orders.length).toFixed(1)

  console.log(`No. of trades: ${orders.length}`);
  console.log(`Won: ${wonOrders.length}`);
  console.log(`Lost: ${lostOrders.length}`);
  console.log(`Winning percentage: ${winRatio}%`);

}

getWinrate().then(() => exit())

const exit = () => process.exit()