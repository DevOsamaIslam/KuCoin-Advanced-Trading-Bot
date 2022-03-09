import mongoose from "mongoose"

import log, {
  err
} from '../log.js'
export const timeframes = [{
    "value": 60 * 1000,
    "text": "1min"
  },
  {
    "value": 3 * 60 * 1000,
    "text": "3min"
  },
  {
    "value": 5 * 60 * 1000,
    "text": "5min"
  },
  {
    "value": 15 * 60 * 1000,
    "text": "15min"
  },
  {
    "value": 30 * 60 * 1000,
    "text": "30min"
  },
  {
    "value": 60 * 60 * 1000,
    "text": "1hour"
  },
  {
    "value": 2 * 60 * 60 * 1000,
    "text": "2hour"
  },
  {
    "value": 4 * 60 * 60 * 1000,
    "text": "4hour"
  },
  {
    "value": 6 * 60 * 60 * 1000,
    "text": "6hour"
  },
  {
    "value": 8 * 60 * 60 * 1000,
    "text": "8hour"
  },
  {
    "value": 12 * 60 * 60 * 1000,
    "text": "12hour"
  },
  {
    "value": 24 * 60 * 60 * 1000,
    "text": "1day"
  },
  {
    "value": 7 * 24 * 60 * 60 * 1000,
    "text": "1week"
  }
]

export const database = {
  connect: mongoose.connect('mongodb://localhost:27017/KuCoinTradingBot', {
      useNewUrlParser: true,
    })
    .then(data => {
      if (data) log('Connected to the database...')
    })
    .catch(error => err(`Database connection: ${error.message}`))
}

export default {
  fees: 0.999,
  quote: 'USDT',
  "watchlist": [
    "BTC-USDT",
  ],
  "tf": timeframes[3],
  "strategies": {
    "MACD": {
      "enable": true,
      "params": {
        "fastPeriod": 12, // default 12
        "slowPeriod": 26, // default 26
        "signalPeriod": 9, // default 9
        "ma": {
          "type": "ema",
          "period": 200,
          "isOver": true
        },
        "rr": 1.5
      },
      "lookbackPeriod": 200,
    },
    "CMF_MACD": {
      "enable": true,
      "params": {
        "fastPeriod": 12, // default 12
        "slowPeriod": 26, // default 26
        "signalPeriod": 9, // default 9
        "length": 20,
        "rr": 1.5
      },
      "lookbackPeriod": 200,
    },
    "VWAP": {
      "enable": false,
      "params": {
        "ma": {
          "type": "ema",
          "period": 200
        },
        "rr": 1.5
      },
      "lookbackPeriod": 1500,
    },
    "SNIPER": {
      "enable": true,
      "params": {
        "TPP": 1.3,
        "SLP": 0.8,
        "risk": 0.15
      }
    },
    "RTW": {
      "enable": false,
      "params": {
        "avgVolumePeriod": 20,
        "priceIncreasePercentage": 3,
        "volumeIncreasePercentage": 200,
        "TPP": 1.1,
        "SLP": 0.95,
        "risk": 0.05
      },
      "lookbackPeriod": 100,
    },
    "TRIBITRAGE": {
      "enable": true,
      "risk": 0.05,
      "diff": 1.01,
      "offset": 0.99,
      "initial": "USDT",
      "floor": -1,
      "median": "BTC",
      "orderTimeout": 1,
      "housekeepingInterval": 5 * 60 * 1000
    }
  }
}