import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/utils/db.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';

export async function GET(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  console.log("authHeader", authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Extract the token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify the access token
    const tokenData = await OAuthProviderService.verifyAccessToken(token);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get user data
    const user = await db.user.findUnique({
      where: { id: tokenData?.userId || "" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return user profile
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      created_at: user.createdAt
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 