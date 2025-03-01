import  { useState } from 'react';
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Form, useActionData, useNavigation } from '@remix-run/react';
import { getUserSession } from '~/utils/session.server';
import { db } from '~/utils/db.server';
import OAuthProviderService from '~/modules/auth/services/OAuthProviderService';
import { verifyUserHasPermission } from '~/utils/helpers/.server/PermissionsService';
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is authenticated and is an admin
  await verifyUserHasPermission(request, "admin.oauth.clients");
  const clients = await db.oAuthClient.findMany({
    select: {
      id: true,
      clientId: true,
      name: true,
      redirectUris: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return json({ clients });
}

export async function action({ request }: LoaderFunctionArgs) {
  // Check if user is authenticated and is an admin
  await verifyUserHasPermission(request, "admin.oauth.clients.create");
  
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const redirectUrisInput = formData.get('redirectUris') as string;
  
  // Validate inputs
  if (!name || !redirectUrisInput) {
    return json({ error: 'Name and redirect URIs are required' }, { status: 400 });
  }
  
  // Parse redirect URIs (comma-separated)
  const redirectUris = redirectUrisInput.split(',').map(uri => uri.trim()).filter(Boolean);
  
  if (redirectUris.length === 0) {
    return json({ error: 'At least one valid redirect URI is required' }, { status: 400 });
  }
  
  try {
    // Create client
    const client = await OAuthProviderService.createClient(name, redirectUris);
    
    return json({ success: true, client });
  } catch (error) {
    console.error('Error creating OAuth client:', error);
    return json({ error: 'An error occurred while creating the OAuth client' }, { status: 500 });
  }
}

// Add a type guard function
function isErrorResponse(data: any): data is { error: string } {
  return data && 'error' in data;
}

export default function OAuthClientsPage() {
  const { clients } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  const [showNewClientCredentials, setShowNewClientCredentials] = useState(true);
  const NextPublicAppUrl = "https://b3f1-103-197-75-21.ngrok-free.app"
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">OAuth Clients</h1>
      
      {actionData && isErrorResponse(actionData) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.error}
        </div>
      )}
      
      {actionData && !isErrorResponse(actionData) && actionData.success && showNewClientCredentials && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold mb-2">Client Created Successfully</h2>
            <button 
              onClick={() => setShowNewClientCredentials(false)}
              className="text-green-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Client ID:</p>
              <div className="flex mt-1">
                <input
                  type="text"
                  value={actionData.client.clientId}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(actionData.client.clientId)}
                  className="ml-2 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Client Secret:</p>
              <div className="flex mt-1">
                <input
                  type="text"
                  value={actionData.client.clientSecret}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(actionData.client.clientSecret)}
                  className="ml-2 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-xs text-red-600">
                Important: Save this secret now. It will not be shown again.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">OAuth Clients</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage OAuth clients for external applications.
              </p>
            </div>
            
            {clients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No OAuth clients found. Create your first client using the form.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Redirect URIs
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="truncate max-w-xs">{client.clientId}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(client.clientId)}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                              title="Copy Client ID"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-1">
                            {client.redirectUris.map((uri, index) => (
                              <div key={index} className="truncate max-w-xs">
                                {uri}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New OAuth Client</h2>
            
            <Form method="post" className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Client Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Zapier Integration"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="redirectUris" className="block text-sm font-medium text-gray-700">
                  Redirect URIs
                </label>
                <textarea
                  name="redirectUris"
                  id="redirectUris"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://zapier.com/dashboard/auth/oauth/return/App123API/"
                  required
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  Enter one or more redirect URIs, separated by commas.
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSubmitting ? 'Creating...' : 'Create OAuth Client'}
                </button>
              </div>
            </Form>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">OAuth Endpoints</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Authorization URL:</p>
                <div className="flex mt-1">
                  <input
                    type="text"
                    value={`${NextPublicAppUrl}/api/oauth/authorize`}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${NextPublicAppUrl}/api/oauth/authorize`)}
                    className="ml-2 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Token URL:</p>
                <div className="flex mt-1">
                  <input
                    type="text"
                    value={`${NextPublicAppUrl}/api/oauth/token`}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${NextPublicAppUrl}/api/oauth/token`)}
                    className="ml-2 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 