import { LoaderFunction, redirect, json } from "@remix-run/node";
import OAuthProviderService from "~/modules/auth/services/OAuthProviderService";
import { getUserSession } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  
  // Get OAuth parameters
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const state = url.searchParams.get('state');
  const scope = url.searchParams.get('scope') || '';
  
  console.log("OAuth authorize request received:", url.toString());
  console.log("OAuth parameters:", { clientId, redirectUri, responseType, state, scope });
  
  // Validate required parameters
  if (!clientId || !redirectUri || !responseType || !state) {
    return json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  // Validate response type
  if (responseType !== 'code') {
    return redirect(`${redirectUri}?error=unsupported_response_type&state=${state}`);
  }
  
  // Validate client and redirect URI
  const client = await OAuthProviderService.getClient(clientId);
  
  if (!client) {
    return json(
      { error: 'invalid_client', error_description: 'Unknown client' },
      { status: 400 }
    );
  }
  
  if (!client.redirectUris.includes(redirectUri)) {
    return json(
      { error: 'invalid_request', error_description: 'Invalid redirect URI' },
      { status: 400 }
    );
  }
  
  // Create authorization request
  const requestId = OAuthProviderService.createAuthorizationRequest(
    clientId,
    redirectUri,
    state,
    responseType,
    scope
  );
  
  // Redirect to authorization page
  return redirect(`/oauth/authorize?requestId=${requestId}`);
};

export const action: LoaderFunction = async ({ request }) => {
  const formData = await request.formData();
  const requestId = formData.get('requestId') as string;
  const approved = formData.get('approved') === 'true';
  
  // Get the authenticated user
  const session = await getUserSession(request);
  
  if (!session || !session.data.userId) {
    return redirect('/login?returnTo=' + encodeURIComponent(request.url));
  }
  
  // Get the original request
  const authRequest = OAuthProviderService.getAuthorizationRequest(requestId);
  
  if (!authRequest) {
    return json(
      { error: 'server_error', error_description: 'Authorization request not found' },
      { status: 500 }
    );
  }
  
  if (!approved) {
    // User denied the authorization
    return redirect(`${authRequest.redirectUri}?error=access_denied&state=${authRequest.state}`);
  }
  
  // Approve the authorization request
  const authCode = await OAuthProviderService.approveAuthorizationRequest(requestId, session.data.userId);
  
  if (!authCode) {
    return json(
      { error: 'server_error', error_description: 'Failed to approve authorization' },
      { status: 500 }
    );
  }
  
  // Redirect back to the client with the authorization code
  return redirect(`${authRequest.redirectUri}?code=${authCode}&state=${authRequest.state}`);
}; 