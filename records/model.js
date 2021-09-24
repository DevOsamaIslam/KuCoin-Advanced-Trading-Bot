import mongoose from 'mongoose'

const options = {
  strategy: String,
  data: Object,
  status: String,
  relatedOrders: {
    SL: Object,
    TP: Object
  }
}

const schema = new mongoose.Schema(options)

export default mongoose.model('Orders', schema)