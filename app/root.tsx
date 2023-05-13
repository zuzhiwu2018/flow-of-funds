import React, { useContext, useEffect, useMemo } from 'react'
import { withEmotionCache } from '@emotion/react'
import { ChakraProvider, cookieStorageManagerSSR, extendTheme } from '@chakra-ui/react'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import type { LinksFunction, LoaderFunction, V2_MetaFunction } from '@remix-run/node' // Depends on the runtime you choose

import { ServerStyleContext, ClientStyleContext } from './context'

export const meta: V2_MetaFunction = () => {
  return [{
    charset: 'utf-8',
    title: 'New Remix App',
    viewport: 'width=device-width,initial-scale=1',
  }]
};

export const links: LinksFunction = () => {
  return []
}

export const loader: LoaderFunction = async ({ request }) => {
  return request.headers.get('cookie') ?? ''
}

interface DocumentProps {
  children: React.ReactNode;
}

const DEFAULT_COLOR_MODE: "dark" | "light" | null = 'dark';

const CHAKRA_COOKIE_COLOR_KEY = "chakra-ui-color-mode";

function getColorMode (cookies: string) {
  const match = cookies.match(new RegExp(`(^| )${CHAKRA_COOKIE_COLOR_KEY}=([^;]+)`));
  return match == null ? void 0 : match[2];
}

const theme = extendTheme({})

const Document = withEmotionCache(
  ({ children }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData?.reset();
    }, []);

    let cookies = useLoaderData()

    // the client get the cookies from the document
    // because when we do a client routing, the loader can have stored an outdated value
    if (typeof document !== "undefined") {
      cookies = document.cookie;
    }

    // get and store the color mode from the cookies.
    // It'll update the cookies if there isn't any and we have set a default value
    let colorMode = useMemo(() => {
      let color = getColorMode(cookies)

      if (!color && DEFAULT_COLOR_MODE) {
        cookies += ` ${CHAKRA_COOKIE_COLOR_KEY}=${DEFAULT_COLOR_MODE}`;
        color = DEFAULT_COLOR_MODE;
      }

      return color
    }, [cookies]);

    return (
      <html
        lang="en"
        {...colorMode
          && {
            'data-theme': colorMode,
            'style': { colorScheme: colorMode },
          }
        }
      >
        <head>
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(' ')}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body {...colorMode && {className: `chakra-ui-${colorMode}`}}>
          <ChakraProvider colorModeManager={cookieStorageManagerSSR(cookies)} theme={theme}>
            {children}
          </ChakraProvider>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }
);

export default function App() {


  return (
    <Document>
      <Outlet />
    </Document>
  )
}

