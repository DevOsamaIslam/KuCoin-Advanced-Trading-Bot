import {
  getAllUsdtTickers,
  getTickerInfo,
  getEquity
} from './config/utils.js'

import Trader from './Trader.js';

import settings from './config/settings.js';

export default async () => {
  setInterval(async () => {
    console.log('monitoring new pairs...');
    let allUsdtTickers = await getAllUsdtTickers()
    if (!allUsdtTickers)
      return
    let untradeables = allUsdtTickers.filter(ticker => !ticker.enableTrading)
    // loop through all new tickers and check if their trading status (enableTrading) changed to true
    for (const pair of untradeables) {
      let status = allUsdtTickers.find(tick => tick.symbol == pair.symbol).enableTrading
      if (!status) continue
      console.log(`New Pair found: ${pair.symbol}`);
      let tickerInfo = getTickerInfo(pair, allUsdtTickers)
      let equity = await getEquity('USDT')
      monitorNew(pair, tickerInfo, equity)

    }
  }, 60 * 1000);
}

const monitorNew = async (pair, tickerInfo, equity) => {
  // monitor new pair
  const datafeed = new api.websocket.Datafeed();
  // connect
  datafeed.connectSocket();
  const topic = `/market/ticker:${pair.symbol}`;
  let callbackId = datafeed.subscribe(topic, (message) => {
    let feed = message.data
    log(`\n\nNew Pair ${pair.symbol} found..............\n\n`);
    if (feed.bestAsk > 0) {
      log(`Trying to buy ${pair.symbol}...`);
      let dynamicTPSL = {
        TP: feed.bestAsk * settings.strategies.SNIPER.params.TPP,
        SL: feed.bestAsk * settings.strategies.SNIPER.params.SLP,
      }
      let order = {
        size: equity * settings.strategies.SNIPER.params.risk,
        currentPrice: parseFloat(feed.bestAsk * 1.1).toFixed(feed.bestAsk.split('.')[1].length),
        type: 'limit',
      }
      new Trader({
        pair,
        order,
        tickerInfo,
        isNewPair: true,
        dynamicTPSL,
        strategy: 'Sniper'
      })
      datafeed.unsubscribe(topic, callbackId);
    }
  });
}