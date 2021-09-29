import settings, {
  database
} from './config/settings.js'
import Orders from './records/model.js'

database.connect



const getWinrate = async () => {
  let orders = await Orders.find({
    status: {
      $ne: 'ongoing'
    }
  }).sort('-1').lean()
  let strategies = []
  for (let order of orders) {
    if (!strategies.find(strategy => strategy.name === order.strategy)) {
      strategies.push({
        name: order.strategy,
        orders: [order]
      })
    } else {
      strategies.find(x => {
        if (x.name == order.name)
          x.orders.push(order)
      })
    }

  }
  strategies.forEach(strategy => {
    let wonOrders = strategy.orders.filter(order => order.status === 'TP')
    let lostOrders = strategy.orders.filter(order => order.status === 'SL')
    let winRatio = ((wonOrders.length * 100) / strategy.orders.length).toFixed(1)

    console.log(`Strategy Name: ${strategy.name}`);
    console.log(`No. of trades: ${strategy.orders.length}`);
    console.log(`Won: ${wonOrders.length}`);
    console.log(`Lost: ${lostOrders.length}`);
    console.log(`Winning percentage: ${winRatio}%`);
    console.log(`---------------------------------`);
  })


}

getWinrate().then(() => exit())

const exit = () => process.exit()