import { backendStatus } from '@/backend/backendConfig';
import * as firebaseOAuth from '@/backend/firebase/firebaseOAuthGateway';
import * as supabaseOAuth from '@/backend/supabase/supabaseOAuthGateway';

const oauth = backendStatus.provider === 'supabase' ? supabaseOAuth : firebaseOAuth;

export const getAuthPageUrl = oauth.getAuthPageUrl;
export const getEmbeddedAuthBrowserLabel = oauth.getEmbeddedAuthBrowserLabel;
export const isEmbeddedAuthBrowser = oauth.isEmbeddedAuthBrowser;
export const isEmbeddedAuthErrorMessage = oauth.isEmbeddedAuthErrorMessage;
