import {
  readFileSync,
  writeFileSync
} from 'fs'

import {
  getAllUsdtTickers,
  getTickerInfo,
  getEquity,
  getDecimalPlaces
} from './config/utils.js'

import Trader from './Trader.js';

import settings from './config/settings.js';

import api from './main.js'

import log from './log.js'

let untradablesPath = './untradables.json'

export default async () => {
  let untradables = JSON.parse(readFileSync(untradablesPath))
  setInterval(async () => {
    console.log('monitoring new pairs...');
    let allUsdtTickers = await getAllUsdtTickers()
    if (!allUsdtTickers)
      return
    let temp = allUsdtTickers.filter(ticker => !ticker.enableTrading)
    if (temp.length > 0) {
      for (const tmpPair of temp) {
        let newPair = untradables.find(pair => pair.symbol === tmpPair.symbol)
        if (!newPair)
          untradables.push(tmpPair)
      }
      writeFileSync(untradablesPath, JSON.stringify(untradables))
    }
  }, 3 * 60 * 1000);

  setInterval(async () => {

    // loop through all new tickers and check if their trading status (enableTrading) changed to true
    for (const pair of untradables) {
      let allUsdtTickers = await getAllUsdtTickers()
      if (!allUsdtTickers) continue
      let status = allUsdtTickers.find(tick => tick.symbol == pair.symbol).enableTrading
      if (!status) continue
      console.log(`New Pair found: ${pair.symbol}`);
      let tickerInfo = getTickerInfo(pair, allUsdtTickers)
      let equity = await getEquity('USDT')
      monitorNew(pair, tickerInfo, equity)

    }
  }, 1000);
}

const monitorNew = async (pair, tickerInfo, equity) => {
  // monitor new pair
  const datafeed = new api.websocket.Datafeed();
  // connect
  datafeed.connectSocket();
  const topic = `/market/ticker:${pair.symbol}`;
  let callbackId = datafeed.subscribe(topic, (message) => {
    let feed = message.data
    log(`New Pair ${pair.symbol} found..............`);
    if (feed.bestAsk > 0) {
      log(`Trying to buy ${pair.symbol}...`);
      let dynamicTPSL = {
        TPP: settings.strategies.SNIPER.params.TPP,
        SLP: settings.strategies.SNIPER.params.SLP,
      }
      let order = {
        size: equity * settings.strategies.SNIPER.params.risk,
        currentPrice: parseFloat(feed.bestAsk * 1.1).toFixed(getDecimalPlaces(feed.bestAsk)),
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