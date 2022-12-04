import cctx from "ccxt"
import { API_KEY, API_PASSPHRASE, API_SECRET } from "./settings"

export const kucoin = new cctx.kucoin({
  apiKey: API_KEY,
  secret: API_SECRET,
  password: API_PASSPHRASE,
})
