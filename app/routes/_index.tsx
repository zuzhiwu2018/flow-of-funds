import { Box, Input } from "@chakra-ui/react";
import { Form, useActionData } from "@remix-run/react";
import { ActionFunction, LoaderFunction, V2_MetaFunction, json } from "@remix-run/node";
import { fetchAddressTransfers } from "./transfers.server";

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

export default function Index() {
  const data = useActionData<typeof action>()

  console.log(data)

  return (
    <Box w="100vw" h="100vh" p="0" m="0" bg="gray.800" display="flex" flexDir="column">
      <SearchBox />
      <Box flex="1" w="full" h="100%">
        {data?.type === 'data' ? 'ok' : <></>}
      </Box>
    </Box>
  );
}
