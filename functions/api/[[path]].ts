import extractRequirements from '../../api/ai/extract-requirements';
import parseSiteDocuments from '../../api/ai/parse-site-documents';
import castEvidence from '../../api/cast/evidence';
import castJoin from '../../api/cast/join';
import castSessions from '../../api/cast/sessions';
import health from '../../api/health';
import createCheckoutSession from '../../api/stripe/create-checkout-session';
import createPortalSession from '../../api/stripe/create-portal-session';
import stripeWebhook from '../../api/stripe/webhook';
import {
  runVercelHandler,
  type VercelStyleHandler,
} from '../../cloudflare/vercelHandlerAdapter';

type PagesFunctionContext = {
  request: Request;
  env: Record<string, unknown>;
  params: Record<string, string | string[]>;
};

const handlers: Record<string, VercelStyleHandler> = {
  'ai/extract-requirements': extractRequirements as VercelStyleHandler,
  'ai/parse-site-documents': parseSiteDocuments as VercelStyleHandler,
  'cast/evidence': castEvidence as VercelStyleHandler,
  'cast/join': castJoin as VercelStyleHandler,
  'cast/sessions': castSessions as VercelStyleHandler,
  health: health as VercelStyleHandler,
  'stripe/create-checkout-session': createCheckoutSession as VercelStyleHandler,
  'stripe/create-portal-session': createPortalSession as VercelStyleHandler,
  'stripe/webhook': stripeWebhook as VercelStyleHandler,
};

function routePath(context: PagesFunctionContext): string {
  const path = context.params.path;
  if (Array.isArray(path)) return path.join('/');
  if (typeof path === 'string' && path) return path;
  return new URL(context.request.url).pathname.replace(/^\/api\/?/, '');
}

function exposeStringBindingsToNode(context: PagesFunctionContext) {
  for (const [name, value] of Object.entries(context.env)) {
    if (typeof value === 'string') process.env[name] = value;
  }
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  exposeStringBindingsToNode(context);

  const handler = handlers[routePath(context)];
  if (!handler) {
    return Response.json(
      { error: 'API endpoint not found.' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          Pragma: 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  }

  return runVercelHandler(context.request, handler);
}
