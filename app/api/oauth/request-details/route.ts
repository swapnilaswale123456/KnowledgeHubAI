import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '~/utils/session.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json({ error: 'Missing requestId parameter' }, { status: 400 });
  }
  
  // Check if user is authenticated
  const session = await getUserSession(request);
  
  if (!session || !session.data.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get authorization request details
  const authRequest = OAuthProviderService.getAuthorizationRequest(requestId);
  
  if (!authRequest) {
    return NextResponse.json({ error: 'Authorization request not found' }, { status: 404 });
  }
  
  // Get client details
  const client = await OAuthProviderService.getClient(authRequest.clientId);
  
  if (!client) {
    return NextResponse.json({ error: 'Unknown client' }, { status: 404 });
  }
  
  // Parse scopes
  const scopes = authRequest.scope.split(' ').filter(Boolean);
  
  return NextResponse.json({
    clientName: client.name,
    scopes,
  });
} 