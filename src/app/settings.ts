import dotenv from 'dotenv'
dotenv.config()

export const BASE_URL = process.env.BASE_URL || ''
export const API_KEY = process.env.API_KEY || ''
export const API_SECRET = process.env.SECRET || ''
export const API_PASSPHRASE = process.env.PASSPHRASE || ''
export const ACCOUNT_ID = '613215d0656e3f000614605e'
export const FEES = 0.08