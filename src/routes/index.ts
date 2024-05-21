// import { isJwtValid } from '@/utils/auth';
import { getBodyBuffer } from '@/utils/body';
import { cleanupHeadersBeforeProxy, getAfterResponseHeaders, getProxyHeaders } from '@/utils/headers';


export default defineEventHandler(async (event) => {
  // grab token from url.
  const token = getQuery<{ binge_hub_token?: string }>(event).binge_hub_token;
  if (!token)
    return await sendJson({
      event,
      status: 401,
      data: {
        error: 'Unauthorized',
      },
    });

  // check the jwt against the supabase secret to see if it is valid
  const isValid = token === process.env.token
  if (!isValid) {
    return await sendJson({
      event,
      status: 401,
      data: {
        error: 'Unauthorized',
      },
    });
  }

  // handle cors, if applicable
  if (isPreflightRequest(event)) return handleCors(event, {});

  // parse destination URL
  const destination = getQuery<{ destination?: string }>(event).destination;
  if (!destination)
    return await sendJson({
      event,
      status: 400,
      data: {
        error: 'destination query parameter invalid',
      },
    });

  // read body
  const body = await getBodyBuffer(event);

  // proxy
  cleanupHeadersBeforeProxy(event);
  await proxyRequest(event, destination, {
    fetchOptions: {
      redirect: 'follow',
      headers: getProxyHeaders(event.headers),
      body,
    },
    onResponse(outputEvent, response) {
      const headers = getAfterResponseHeaders(response.headers, response.url);
      setResponseHeaders(outputEvent, headers);
    },
  });
});
