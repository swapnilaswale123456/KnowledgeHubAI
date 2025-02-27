import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticator } from '~/utils/auth/auth.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';
import { db } from '~/utils/db.server';
import { getUserSession } from '~/utils/session.server';

// List OAuth clients
export async function GET(request: NextRequest) {
  // Check if user is authenticated and is an admin
  const session = await getUserSession(request);
  if (!session || session.get('role') !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const clients = await db.oAuthClient.findMany({
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching OAuth clients:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching OAuth clients' },
      { status: 500 }
    );
  }
}

// Create OAuth client
export async function POST(request: NextRequest) {
  // Check if user is authenticated and is an admin
  const session = await getUserSession(request);
  if (!session || session.get('role') !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Handle form data
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }
    
    const { name, redirectUris } = body;
    
    // Validate inputs
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Handle single redirect URI or array
    let redirectUrisArray: string[] = [];
    if (typeof redirectUris === 'string') {
      redirectUrisArray = [redirectUris];
    } else if (Array.isArray(redirectUris)) {
      redirectUrisArray = redirectUris;
    }
    
    if (redirectUrisArray.length === 0) {
      return NextResponse.json(
        { message: 'At least one redirect URI is required' },
        { status: 400 }
      );
    }
    
    // Create client
    const client = await OAuthProviderService.createClient(name, redirectUrisArray);
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating OAuth client:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating OAuth client' },
      { status: 500 }
    );
  }
} 