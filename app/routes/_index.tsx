import { Box, Circle, Input } from "@chakra-ui/react";
import { Form, useActionData } from "@remix-run/react";
import { ActionFunction, V2_MetaFunction, json } from "@remix-run/node";
import { Network, Responsive, Scale } from "@visx/visx";
import { Suspense, useMemo } from "react";
import { fetchAddressTransfers, Transfer } from "./transfers.server";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Flow of Funds" }];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()

  const address = formData.get("address")

  if (!address) {
    return json({
      type: 'error',
      message: 'Must provide address'
    })
  }

  const transfers = await fetchAddressTransfers(address.toString())
  console.log('HERE')
  console.log(transfers)
  return json({
    type: 'data',
    transfers,
    target: address.toString(),
  })
}

export function SearchBox() {
  return (
    <Box w="full" pt="8" flex="0">
      <Box bg="gray.600" py="8" px="8" w="80%" mx="auto" rounded="3xl" shadow="dark-lg">
        <Form method="post">
          <Input name="address" fontSize="xl" variant="unstyled" />
        </Form>
      </Box>
    </Box>
  )
}

interface CustomNode {
  x: number
  y: number
  address: string
  size: number
  color: string
}

interface CustomLink {
  // from: CustomNode
  // to: CustomNode
}

function TransferNetwork({ width, height, transfers, target }: { width: number, height: number, transfers: Transfer[], target: string }) {
  const nodes = useMemo(() => {
    const amounts = new Map<string, number>()
    const txCount = new Map<string, number>()

    function addAmount(addr: string, amount: string) {
      const prev = amounts.get(addr) ?? 0
      amounts.set(addr, prev + parseInt(amount))
    }

    function addCount(addr: string) {
      const prev = txCount.get(addr) ?? 0
      txCount.set(addr, prev + 1)
    }

    transfers.forEach((transfer) => {
      const from = transfer.from.toLowerCase()
      const to = transfer.to.toLowerCase()
      addAmount(from, transfer.value)
      addAmount(to, transfer.value)
      addCount(from)
      addCount(to)
    })

    const angleIncrement = (2.0 * Math.PI) / (amounts.size - 2)
    const base = Math.min(width, height)
    const radius = base * 0.3

    const centerX = width / 2.0
    const centerY = height / 2.0

    const targetAddr = target.toLowerCase()
    const amountMin = Math.min.apply(null, Array.from(amounts.values()))
    const amountMax = Math.max.apply(null, Array.from(amounts.values()))
    const sizeScale = Scale.scaleLinear({
      domain: [amountMin, amountMax],
      range: [1, base * 0.15],
      round: true,
    })

    const radiusScale = Scale.scaleLinear({
      domain: [1, 3],
      range: [radius * 0.5, radius],
      round: true,
    })

    return Array.from(amounts.keys()).map((address, idx) => {
      const value = amounts.get(address)
      const addr = (address as string).toLowerCase()
      if (addr === targetAddr) {
        return {
          address: addr,
          x: centerX,
          y: centerY,
          size: base * 0.05,
          color: 'var(--chakra-colors-gray-50)',
        }
      }

      console.log(addr, txCount.get(addr))
      const r = radiusScale(Math.min(txCount.get(addr) ?? 1, 3))
      return {
        address: addr,
        x: centerX + r * Math.cos(angleIncrement * idx),
        y: centerY + r * Math.sin(angleIncrement * idx),
        size: sizeScale(value ?? 0),
        color: 'var(--chakra-colors-blue-500)',
      }
    })
  }, [transfers, target, width, height])

  const links = useMemo(() => {
    return transfers.map(transfer => ({
      from: { address: transfer.from },
      to: { address: transfer.to }
    }))
  }, [transfers])

  return (
    <Network.Graph<CustomLink, CustomNode>
      graph={{nodes, links}}
      nodeComponent={({ node: { color, size }}) => <circle fill={color} r={size} />}
    />
    )
}

export function TransferGraph({ target, transfers }: { target: string, transfers: Transfer[] }) {
  return (
    <Suspense>
      <Responsive.ParentSize>
        {({ width, height }) => (
          <svg width={width} height={height}>
            <TransferNetwork width={width} height={height} transfers={transfers} target={target} />
          </svg>
        )}
      </Responsive.ParentSize>
    </Suspense>
  )
}

export default function Index() {
  const data = useActionData<typeof action>()

  console.log(data)

  return (
    <Box w="100vw" h="100vh" p="0" m="0" bg="gray.800" display="flex" flexDir="column">
      <SearchBox />
      <Box flex="1" w="full" h="100%">
        {data?.type === 'data' ? <TransferGraph target={data.target} transfers={data.transfers} /> : <></>}
      </Box>
    </Box>
  );
}
