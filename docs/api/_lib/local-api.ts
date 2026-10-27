// Serves one Vercel Function route from the Vite dev server, for
// `pnpm dev:agent` (src/kigumi-studio/AGENTS.md, "Trying it locally"). Vercel
// hands a Function a Web Request and sends back its Response; this does the
// same over Node's http objects, so the route runs unchanged. Never deployed:
// only vite.config.ts imports it, and only for `vite serve`.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

type RouteHandler = (request: Request) => Promise<Response> | Response;

/** The named exports of a Vercel Function module, one per HTTP method. */
export type RouteModule = Partial<Record<string, RouteHandler>>;

function toRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      headers.append(name, item);
    }
  }
  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  return new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
    method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : null,
    // Required by Node's fetch for a streamed request body.
    ...(hasBody ? { duplex: 'half' } : {}),
  });
}

async function sendResponse(
  res: ServerResponse,
  response: Response
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.appendHeader(name, value));
  if (response.body) {
    for await (const chunk of response.body) res.write(chunk);
  }
  res.end();
}

/**
 * Connect middleware that answers requests to `path` with the route module
 * `load()` returns (loaded per request, so an edit takes effect on the next
 * one) and passes every other path on.
 */
export function localApiMiddleware(
  path: string,
  load: () => Promise<RouteModule>
) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== path) {
      next();
      return;
    }
    void (async () => {
      try {
        const handler = (await load())[req.method ?? 'GET'];
        if (typeof handler !== 'function') {
          res.statusCode = 405;
          res.end();
          return;
        }
        await sendResponse(res, await handler(toRequest(req)));
      } catch (error) {
        // Vercel answers a throwing Function with 500; a dangling request
        // would leave the sidebar waiting with nothing in the terminal.
        console.error(error);
        if (!res.headersSent) res.statusCode = 500;
        res.end(error instanceof Error ? error.message : String(error));
      }
    })();
  };
}
