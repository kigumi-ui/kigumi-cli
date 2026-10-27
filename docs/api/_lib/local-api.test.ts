import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { localApiMiddleware } from './local-api';

let server: Server | undefined;

afterEach(async () => {
  await new Promise((resolve) => server?.close(resolve));
  server = undefined;
});

/** A real HTTP server running the middleware, with a fallback after it. */
async function serve(
  middleware: ReturnType<typeof localApiMiddleware>
): Promise<string> {
  server = createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end('next');
    });
  });
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

describe('localApiMiddleware', () => {
  it('hands a POST to the route its Request and sends back its Response', async () => {
    const received: {
      method: string;
      url: string;
      cookie: string | null;
      body: unknown;
    }[] = [];
    const base = await serve(
      localApiMiddleware('/api/theme-agent', async () => ({
        POST: async (request: Request) => {
          received.push({
            method: request.method,
            url: request.url,
            cookie: request.headers.get('cookie'),
            body: await request.json(),
          });
          return Response.json(
            { publicAccessToken: 'tok' },
            { status: 201, headers: { 'x-route': 'theme-agent' } }
          );
        },
      }))
    );

    const response = await fetch(`${base}/api/theme-agent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'kigumi-theme-agent=k',
      },
      body: JSON.stringify({ intent: 'start', chatId: 'abc' }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('x-route')).toBe('theme-agent');
    expect(await response.json()).toEqual({ publicAccessToken: 'tok' });
    expect(received).toEqual([
      {
        method: 'POST',
        url: `${base}/api/theme-agent`,
        cookie: 'kigumi-theme-agent=k',
        body: { intent: 'start', chatId: 'abc' },
      },
    ]);
  });

  it('leaves every other path to the next middleware', async () => {
    const base = await serve(
      localApiMiddleware('/api/theme-agent', async () => {
        throw new Error('must not load the route');
      })
    );

    const response = await fetch(`${base}/studio`);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('next');
  });

  it('answers a method the route does not export with 405', async () => {
    const base = await serve(
      localApiMiddleware('/api/theme-agent', async () => ({
        POST: async () => new Response('never'),
      }))
    );

    const response = await fetch(`${base}/api/theme-agent`);

    expect(response.status).toBe(405);
  });

  it('answers a route that throws with 500 instead of hanging', async () => {
    const base = await serve(
      localApiMiddleware('/api/theme-agent', async () => ({
        POST: async () => {
          throw new Error('trigger.dev unreachable');
        },
      }))
    );

    const response = await fetch(`${base}/api/theme-agent`, { method: 'POST' });

    expect(response.status).toBe(500);
    expect(await response.text()).toContain('trigger.dev unreachable');
  });
});
