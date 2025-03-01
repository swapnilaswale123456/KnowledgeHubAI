import { ActionFunction, json } from "@remix-run/node";
import OAuthProviderService from "~/modules/auth/services/OAuthProviderService";

export const action: ActionFunction = async ({ request }) => {
  // Get request body
  const formData = await request.formData();
  const grantType = formData.get('grant_type') as string;
  const clientId = formData.get('client_id') as string;
  const clientSecret = formData.get('client_secret') as string;
  
  console.log("Token request received:", { grantType, clientId, clientSecret });
  
  // Validate client credentials
  const isValidClient = await OAuthProviderService.validateClient(clientId, clientSecret);
  
  if (!isValidClient) {
    return json(
      { error: 'invalid_client', error_description: 'Invalid client credentials' },
      { status: 401 }
    );
  }
  
  // Handle authorization code grant
  if (grantType === 'authorization_code') {
    const code = formData.get('code') as string;
    const redirectUri = formData.get('redirect_uri') as string;
    
    if (!code || !redirectUri) {
      return json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const result = await OAuthProviderService.exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );
    
    if (!result) {
      return json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      );
    }
    
    return json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_token: result.refreshToken
    });
  } 
  // Handle refresh token grant
  else if (grantType === 'refresh_token') {
    const refreshToken = formData.get('refresh_token') as string;
    
    if (!refreshToken) {
      return json(
        { error: 'invalid_request', error_description: 'Missing refresh token' },
        { status: 400 }
      );
    }
    
    const result = await OAuthProviderService.refreshAccessToken(
      refreshToken,
      clientId,
      clientSecret
    );
    
    if (!result) {
      return json(
        { error: 'invalid_grant', error_description: 'Invalid refresh token' },
        { status: 400 }
      );
    }
    
    return json({
      access_token: result.accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
    });
  } else {
    return json(
      { error: 'unsupported_grant_type', error_description: 'Unsupported grant type' },
      { status: 400 }
    );
  }
}; 