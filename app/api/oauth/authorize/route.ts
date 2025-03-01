import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticator } from '~/utils/auth/auth.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';
import { getUserSession } from '~/utils/session.server';
import { verifyUserHasPermission } from '~/utils/helpers/.server/PermissionsService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get OAuth parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope') || '';
  
  // Validate required parameters
  if (!clientId || !redirectUri || !responseType || !state) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  // Validate response type
  if (responseType !== 'code') {
    return NextResponse.redirect(
      `${redirectUri}?error=unsupported_response_type&state=${state}`
    );
  }
  console.log("clientId", clientId);
  // Validate client and redirect URI
  const client = await OAuthProviderService.getClient(clientId);
  
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Unknown client' },
      { status: 400 }
    );
  }
  
  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect URI' },
      { status: 400 }
    );
  }
  
  // Check if user is authenticated
  const session = await getUserSession(request);
  if (!session) {
    console.log("No session found");
    // Redirect to login page with return URL
    const returnTo = encodeURIComponent(request.url);
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url));
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
  return NextResponse.redirect(
    new URL(`/oauth/authorize?requestId=${requestId}`, request.url)
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const requestId = formData.get('requestId') as string;
  const approved = formData.get('approved') === 'true';
  
  // Get the authenticated user
  const session = await getUserSession(request);
  
  if (!session || !session.data.userId) {
    return NextResponse.redirect(
      new URL('/login?returnTo=' + encodeURIComponent(request.url), request.url)
    );
  }
  
  // Get the original request
  const authRequest = OAuthProviderService.getAuthorizationRequest(requestId);
  
  if (!authRequest) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Authorization request not found' },
      { status: 500 }
    );
  }
  
  if (!approved) {
    // User denied the authorization
    return NextResponse.redirect(
      `${authRequest.redirectUri}?error=access_denied&state=${authRequest.state}`
    );
  }
  
  // Approve the authorization request
  const authCode = await OAuthProviderService.approveAuthorizationRequest(requestId, session.user.id);
  
  if (!authCode) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to approve authorization' },
      { status: 500 }
    );
  }
  
  // Redirect back to the client with the authorization code
  return NextResponse.redirect(
    `${authRequest.redirectUri}?code=${authCode}&state=${authRequest.state}`
  );
} 