import dotenv from 'dotenv'
dotenv.config()

export const BASE_URL = process.env.BASE_URL || ''
export const API_KEY = process.env.API_KEY || ''
export const API_SECRET = process.env.SECRET || ''
export const API_PASSPHRASE = process.env.PASSPHRASE || ''
export const FEES = 0.1
export const TP_RATIO = 2
export const TRIBITRAGE_MARGIN = 0.01
