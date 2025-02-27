import { NextRequest, NextResponse } from 'next/server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';

export async function POST(request: NextRequest) {
  // Get request body
  let body;
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    // Handle form data
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  }
  
  const grantType = body.grant_type;
  const clientId = body.client_id;
  const clientSecret = body.client_secret;
  
  // Validate required parameters
  if (!grantType || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  // Handle different grant types
  if (grantType === 'authorization_code') {
    const code = body.code;
    const redirectUri = body.redirect_uri;
    
    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing code or redirect_uri' },
        { status: 400 }
      );
    }
    
    // Exchange code for token
    const result = await OAuthProviderService.exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_token: result.refreshToken
    });
  } else if (grantType === 'refresh_token') {
    const refreshToken = body.refresh_token;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing refresh token' },
        { status: 400 }
      );
    }
    
    // Refresh access token
    const result = await OAuthProviderService.refreshAccessToken(
      refreshToken,
      clientId,
      clientSecret
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid refresh token' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: 3600 // 1 hour
    });
  } else {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Unsupported grant type' },
      { status: 400 }
    );
  }
} 