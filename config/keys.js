import dotenv from 'dotenv'
dotenv.config()

export const key = process.env.BOT_API_KEY
export const secret = process.env.BOT_SECRET
export const passphrase = process.env.BOT_PASSPHRASE

export const config = {
  // baseUrl: 'https://openapi-sandbox.kucoin.com',
  baseUrl: 'https://api.kucoin.com',
  authVersion: 2,
  apiAuth: {
    key,
    secret,
    passphrase,
  }

}

export default config