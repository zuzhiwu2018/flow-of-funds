const apiKey = process.env.ETHERSCAN_API_KEY

export interface Transfer {
  contract: string
  symbol: string
  timestamp: string
  hash: string
  from: string
  to: string
  value: string
}

const spam = [
  '$ Visit ensbonus.com to claim',
  'Invitation token. Please Visit https://atuni.site',
  '[https://as-uni.org] Visit and claim rewards',
  'Up1.org',
]

function toUSD(symbol: string, decimals: string, amount: string): string {
  if (symbol == 'USDC') {
    return amount
  } else if (symbol == 'DAI') {
    return amount
  } else if (symbol == 'DYDX') {
    return (BigInt(amount) * BigInt(2)).toString()
  } else if (symbol == 'CODE') {
    return (BigInt(amount) / BigInt(10)).toString()
  } else if (symbol == 'DPI') {
    return (BigInt(amount) * BigInt(65)).toString()
  } else if (symbol == 'FWB') {
    return (BigInt(amount) * BigInt(4)).toString()
  } else if (symbol == 'UNI') {
    return (BigInt(amount) * BigInt(5)).toString()
  } else if (symbol == 'ENS') {
    return (BigInt(amount) * BigInt(10)).toString()
  } else if (symbol == 'MATIC') {
    return (BigInt(amount) * BigInt(1)).toString()
  } else if (symbol == 'RAD') {
    return (BigInt(amount) * BigInt(2)).toString()
  } else if (symbol == 'BAT') {
    return (BigInt(amount) / BigInt(5)).toString()
  } else if (spam.includes(symbol)) {
    return '0'
  } else {
    console.log(symbol, decimals)
    return '0'
  }
}

export async function fetchAddressTransfers(address: string): Promise<Transfer[]> {
  console.log(`fetching transfers for ${address}`)

  const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&sort=desc&apiKey=${apiKey}`)
  const data = await response.json()
  if (data['message'] != 'OK') {
    throw new Error(data['message'])
  }
  const transfers = data['result'] ?? []
  return transfers.map((transfer: any) => {
    // const value = BigInt(transfer.value) / (BigInt(10) ** BigInt(transfer.tokenDecimal))
    return {
      timestamp: transfer.timeStamp,
      contract: transfer.contractAddress,
      symbol: transfer.tokenSymbol,
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: toUSD(transfer.tokenSymbol, transfer.tokenDecimal, transfer.value),
    }
  })
}

