import { v4 as uuidv4 } from 'uuid';
import { db } from '~/utils/db.server';

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  state: string;
  responseType: string;
  scope: string;
}

export default class OAuthProviderService {
  // Store authorization requests temporarily (in-memory for now)
  private static authRequests = new Map<string, AuthorizationRequest>();
  
  // Get authorization request
  static getAuthorizationRequest(requestId: string): AuthorizationRequest | undefined {
    return this.authRequests.get(requestId);
  }
  
  // Validate client credentials
  static async validateClient(clientId: string, clientSecret: string): Promise<boolean> {
    const client = await db.oAuthClient.findUnique({
      where: { clientId }
    });
    
    return client?.clientSecret === clientSecret;
  }
  
  // Create authorization request
  static createAuthorizationRequest(
    clientId: string,
    redirectUri: string,
    state: string,
    responseType: string,
    scope: string
  ): string {
    // Generate a unique request ID
    const requestId = uuidv4();
    
    // Store the request
    this.authRequests.set(requestId, {
      clientId,
      redirectUri,
      state,
      responseType,
      scope
    });
    
    return requestId;
  }
  
  // Approve authorization request and generate auth code
  static async approveAuthorizationRequest(requestId: string, userId: string): Promise<string | null> {
    const request = this.authRequests.get(requestId);
    
    if (!request) {
      return null;
    }
    
    // Generate authorization code
    const authCode = uuidv4();
    
    // Store in database for later verification
    await db.oAuthAuthorizationCode.create({
      data: {
        code: authCode,
        clientId: request.clientId,
        userId,
        redirectUri: request.redirectUri,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        scope: request.scope
      }
    });
    
    // Remove the request from memory
    this.authRequests.delete(requestId);
    
    return authCode;
  }
  
  // Exchange authorization code for access token
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    // Validate client credentials
    const isValidClient = await this.validateClient(clientId, clientSecret);
    
    if (!isValidClient) {
      return null;
    }
    
    // Find the authorization code
    const authCode = await db.oAuthAuthorizationCode.findUnique({
      where: { code }
    });
    
    if (!authCode || authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
      return null;
    }
    
    // Check if code is expired
    if (authCode.expiresAt < new Date()) {
      return null;
    }
    
    // Generate tokens
    const accessToken = uuidv4();
    const refreshToken = uuidv4();
    
    // Store tokens
    await db.oAuthAccessToken.create({
      data: {
        token: accessToken,
        clientId,
        userId: authCode.userId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        scope: authCode.scope
      }
    });
    
    await db.oAuthRefreshToken.create({
      data: {
        token: refreshToken,
        clientId,
        userId: authCode.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        scope: authCode.scope
      }
    });
    
    // Delete used authorization code
    await db.oAuthAuthorizationCode.delete({
      where: { code }
    });
    
    return { accessToken, refreshToken };
  }
  
  // Validate access token
  static async validateAccessToken(token: string): Promise<{ clientId: string; userId: string; scope: string } | null> {
    const accessToken = await db.oAuthAccessToken.findUnique({
      where: { token }
    });
    
    if (!accessToken || accessToken.expiresAt < new Date()) {
      return null;
    }
    
    return {
      clientId: accessToken.clientId,
      userId: accessToken.userId,
      scope: accessToken.scope
    };
  }
  
  // Refresh access token
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ accessToken: string } | null> {
    // Validate client credentials
    const isValidClient = await this.validateClient(clientId, clientSecret);
    
    if (!isValidClient) {
      return null;
    }
    
    // Find the refresh token
    const token = await db.oAuthRefreshToken.findUnique({
      where: { token: refreshToken }
    });
    
    if (!token || token.clientId !== clientId || token.expiresAt < new Date()) {
      return null;
    }
    
    // Generate new access token
    const accessToken = uuidv4();
    
    // Store new access token
    await db.oAuthAccessToken.create({
      data: {
        token: accessToken,
        clientId,
        userId: token.userId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        scope: token.scope
      }
    });
    
    return { accessToken };
  }
  
  // Create a new OAuth client
  static async createClient(name: string, redirectUris: string[]): Promise<{
    id: string;
    clientId: string;
    clientSecret: string;
    name: string;
    redirectUris: string[];
  }> {
    const clientId = uuidv4();
    const clientSecret = uuidv4();
    
    const client = await db.oAuthClient.create({
      data: {
        clientId,
        clientSecret,
        name,
        redirectUris,
      }
    });
    
    return {
      id: client.id,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      name: client.name,
      redirectUris: client.redirectUris,
    };
  }
  
  // Get client by ID
  static async getClient(clientId: string): Promise<{
    id: string;
    name: string;
    redirectUris: string[];
  } | null> {
    const client = await db.oAuthClient.findUnique({
      where: { clientId },
      select: {
        id: true,
        name: true,
        redirectUris: true,
      }
    });
    
    return client;
  }
} 