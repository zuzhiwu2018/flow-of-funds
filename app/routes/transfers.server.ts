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

export async function fetchAddressTransfers(address: string): Promise<Transfer[]> {
  console.log(`fetching transfers for ${address}`)

  const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&sort=desc&apiKey=${apiKey}`)
  const data = await response.json()
  if (data['message'] != 'OK') {
    throw new Error(data['message'])
  }
  const transfers = data['result'] ?? []
  return transfers.map((transfer: any) => {
    return {
      timestamp: transfer.timeStamp,
      contract: transfer.contractAddress,
      symbol: transfer.tokenSymbol,
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: '0.0'
    }
  })
}

