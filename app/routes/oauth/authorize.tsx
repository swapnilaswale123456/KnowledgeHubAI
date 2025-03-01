import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import OAuthProviderService from "~/modules/auth/services/OAuthProviderService";
import { getUserSession } from "~/utils/session.server";

// Loader function to get authorization request details
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const requestId = url.searchParams.get('requestId');
  
  if (!requestId) {
    return json({ error: 'Missing requestId parameter' }, { status: 400 });
  }
  
  // Check if user is authenticated
  const session = await getUserSession(request);
  if (!session || !session.data.userId) {
    const returnTo = encodeURIComponent(request.url);
    return redirect(`/login?returnTo=${returnTo}`);
  }
  
  // Get authorization request details
  const authRequest = OAuthProviderService.getAuthorizationRequest(requestId);
  
  if (!authRequest) {
    return json({ error: 'Authorization request not found' }, { status: 404 });
  }
  
  // Get client details
  const client = await OAuthProviderService.getClient(authRequest.clientId);
  
  if (!client) {
    return json({ error: 'Unknown client' }, { status: 404 });
  }
  
  // Parse scopes
  const scopes = authRequest.scope.split(' ').filter(Boolean);
  
  return json({
    requestId,
    clientName: client.name,
    scopes,
  });
};

// Component for the authorization page
export default function AuthorizePage() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
  if ('error' in data) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700">{data.error}</p>
      </div>
    );
  }
  
  const handleSubmit = (approved: boolean) => {
    const formData = new FormData();
    formData.append('requestId', data.requestId);
    formData.append('approved', approved.toString());
    
    submit(formData, { method: 'post', action: '/api/oauth/authorize' });
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Authorization Request</h1>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          <strong>{data.clientName}</strong> is requesting access to your account.
        </p>
        
        {data.scopes.length > 0 && (
          <div className="mt-4">
            <p className="font-medium mb-2">This application will be able to:</p>
            <ul className="list-disc pl-5 space-y-1">
              {data.scopes.map((scope: string) => (
                <li key={scope} className="text-gray-700">
                  {getScopeDescription(scope)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => handleSubmit(false)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Deny
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Authorize
        </button>
      </div>
    </div>
  );
}

// Helper function to get human-readable scope descriptions
function getScopeDescription(scope: string): string {
  const scopeDescriptions: Record<string, string> = {
    'read': 'Read your data',
    'write': 'Modify your data',
    'profile': 'Access your profile information',
    // Add more scope descriptions as needed
  };
  
  return scopeDescriptions[scope] || scope;
} 