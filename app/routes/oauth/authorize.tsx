import React, { useState, useEffect } from 'react';
import { useSearchParams, Form } from '@remix-run/react';
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { getAuthenticator } from '~/utils/auth/auth.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get('requestId');
  
  if (!requestId) {
    return json({ error: 'Invalid authorization request' });
  }
  
  // Check if user is authenticated
  const session = await getAuthenticator(request);
  
  if (!session || !session.user) {
    // Redirect to login page with return URL
    const returnTo = encodeURIComponent(request.url);
    return Response.redirect(`/login?returnTo=${returnTo}`);
  }
  
  // Get authorization request details
  const authRequest = OAuthProviderService.getAuthorizationRequest(requestId);
  
  if (!authRequest) {
    return json({ error: 'Authorization request not found' });
  }
  
  // Get client details
  const client = await OAuthProviderService.getClient(authRequest.clientId);
  
  if (!client) {
    return json({ error: 'Unknown client' });
  }
  
  // Parse scopes
  const scopes = authRequest.scope.split(' ').filter(Boolean);
  
  return json({
    requestId,
    clientName: client.name,
    scopes,
    error: null
  });
}

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const [clientName, setClientName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchAuthorizationDetails() {
      if (!requestId) {
        setError('Invalid authorization request');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/oauth/request-details?requestId=${requestId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch authorization details');
        }
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setClientName(data.clientName);
          setScopes(data.scopes);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load authorization details');
        setLoading(false);
      }
    }
    
    fetchAuthorizationDetails();
  }, [requestId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading authorization details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Authorize Application</h1>
        
        <div className="mb-6">
          <p className="text-gray-700">
            <strong>{clientName}</strong> is requesting access to your account.
          </p>
        </div>
        
        {scopes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">This application will be able to:</h2>
            <ul className="list-disc pl-5 space-y-1">
              {scopes.map((scope) => (
                <li key={scope} className="text-gray-700">
                  {getScopeDescription(scope)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Form method="post" action="/api/oauth/authorize" className="space-y-4">
          <input type="hidden" name="requestId" value={requestId || ''} />
          
          <div className="flex space-x-4">
            <button
              type="submit"
              name="approved"
              value="true"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Authorize
            </button>
            
            <button
              type="submit"
              name="approved"
              value="false"
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

function getScopeDescription(scope: string): string {
  const scopeDescriptions: Record<string, string> = {
    'read': 'Read your data',
    'write': 'Modify your data',
    'profile': 'Access your profile information',
    // Add more scope descriptions as needed
  };
  
  return scopeDescriptions[scope] || scope;
} 