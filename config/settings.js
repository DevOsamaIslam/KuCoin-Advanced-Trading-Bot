import mongoose from "mongoose"

import log, {
  err
} from '../log.js'
export const timeframes = [{
    "value": 60000,
    "text": "1min"
  },
  {
    "value": 180000,
    "text": "3min"
  },
  {
    "value": 300000,
    "text": "5min"
  },
  {
    "value": 900000,
    "text": "15min"
  },
  {
    "value": 1800000,
    "text": "30min"
  },
  {
    "value": 3600000,
    "text": "1hour"
  },
  {
    "value": 7200000,
    "text": "2hour"
  },
  {
    "value": 14400000,
    "text": "4hour"
  },
  {
    "value": 21600000,
    "text": "6hour"
  },
  {
    "value": 28800000,
    "text": "8hour"
  },
  {
    "value": 43200000,
    "text": "12hour"
  },
  {
    "value": 86400000,
    "text": "1day"
  },
  {
    "value": 604800000,
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
  "watchlist": [
    "BTC-USDT",
    "ETH-USDT",
    // "THETA-USDT",
    "MATIC-USDT",
    // "LINK-USDT",
    "ADA-USDT",
    // "KSM-USDT",
    // "QNT-USDT",
    // "DOT-USDT",
    // "TRX-USDT",
    "ONE-USDT",
    // "REN-USDT",
    // "AXS-USDT",
    // "ENJ-USDT",
    // "AAVE-USDT",
    // "EOS-USDT",
    // "KCS-USDT",
    // "FIL-USDT",
    "SOL-USDT",
    "ATOM-USDT",
    // "FTM-USDT",
    "AVAX-USDT",
    // "ALGO-USDT",
    "LUNA-USDT",
    "XRP-USDT",
    // "DOGE-USDT",
    // "ICP-USDT",
    // "VET-USDT",
    // "XMR-USDT",
    // "COMP-USDT",
    // "ZEC-USDT",
    // "SNX-USDT",
    // "BAT-USDT",
    // "TEL-USDT",
    // "ZEN-USDT",
    // "HBAR-USDT",
    // "FLOW-USDT",
    "DYDX-USDT",
    "UNI-USDT",
    // "IOST-USDT",
    // "NEO-USDT",
    // "XLM-USDT"
  ],
  "tf": timeframes[0],
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
        "rr": 2
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
        "rr": 2
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
        "risk": 0.5
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
    }
  }
}