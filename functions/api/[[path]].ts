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
  runNodeHandler,
  type NodeStyleHandler,
} from '../../cloudflare/nodeHandlerAdapter';

type PagesFunctionContext = {
  request: Request;
  env: Record<string, unknown>;
  params: Record<string, string | string[]>;
};

const handlers: Record<string, NodeStyleHandler> = {
  'ai/extract-requirements': extractRequirements as NodeStyleHandler,
  'ai/parse-site-documents': parseSiteDocuments as NodeStyleHandler,
  'cast/evidence': castEvidence as NodeStyleHandler,
  'cast/join': castJoin as NodeStyleHandler,
  'cast/sessions': castSessions as NodeStyleHandler,
  health: health as NodeStyleHandler,
  'stripe/create-checkout-session': createCheckoutSession as NodeStyleHandler,
  'stripe/create-portal-session': createPortalSession as NodeStyleHandler,
  'stripe/webhook': stripeWebhook as NodeStyleHandler,
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

  return runNodeHandler(context.request, handler);
}
