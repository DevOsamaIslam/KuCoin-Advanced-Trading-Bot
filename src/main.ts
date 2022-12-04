import { kucoin } from "app/init"

kucoin.fetchBalance({}).then((data) => console.log(data.info))
