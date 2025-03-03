import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import { isAuthenticated } from "~/utils/auth";
import * as fs from "fs";
import * as path from "path";

// Map ticket systems to their Zapier app IDs
const TICKET_SYSTEM_APPS = {
  jira: "JiraApi",
  ZendeskV2CLIAPI: "ZendeskV2CLIAPI",
  servicenow: "ServiceNowApi",
  freshdesk: "FreshdeskApi"
};

// Map ticket systems to their appropriate actions
const TICKET_SYSTEM_ACTIONS = {
  jira: "get_issue",
  ZendeskV2CLIAPI: "find_tickets",
  servicenow: "get_incident",
  freshdesk: "get_ticket"
};

// Interface for authentication data
interface Authentication {
  id: number;
  account_id: number;
  label?: string;
  title?: string;
  // Add other fields as needed
}

// Interface for app data
interface App {
  id: string;
  name: string;
  logo_url?: string;
  // Add other fields as needed
}

// Interface for ticket system
interface TicketSystem {
  id: string;
  name: string;
  logo_url?: string;
}

// Fetch authentications for a specific app
async function fetchAppAuthentications(app: string, apiKey: string, accountId?: string): Promise<Authentication[]> {
  try {
    let url = `https://actions.zapier.com/api/v2/apps/${app}/auths/`;
    
    // Add account_id as a query parameter if provided
    if (accountId) {
      url += `?account_id=${accountId}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": `${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    console.log("Fetching authentications for:", app);
    
    if (!response.ok) {
      console.error(`Failed to fetch authentications: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching authentications:", error);
    return [];
  }
}

// Get app details
async function fetchAppDetails(app: string, apiKey: string): Promise<App | null> {
  try {
    console.log("Fetching app details for:", app);
    
    const response = await fetch(`https://actions.zapier.com/api/v2/apps/${app}/`, {
      method: "GET",
      headers: {
        "x-api-key": `${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch app details: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();    
   
    // Parse the results array if it exists
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      const appData = data.results[0];
      
      // Parse implementation details - only save actions for ZendeskV2CLIAPI
      if (appData.implementation) {
       
        // Only process ZendeskV2CLIAPI data
        if (appData.implementation.name === 'Zendesk' && 
            appData.implementation.actions && 
            Array.isArray(appData.implementation.actions)) {
          
          // Create a data object to save
          const zendeskData = {
            app_id: appData.implementation.app_id,
            name: appData.implementation.name,
            actions: appData.implementation.actions.map((action: any) => ({
              key: action.key,
              name: action.name,
              type: action.type,
              description: action.description
            })),
            auth_fields: appData.implementation.auth_fields || []
          };
          
          // Use D: drive for storage instead of project directory
          try {
            // Create directory on D: drive if it doesn't exist
            const dataDir = 'D:\\zapier_data';
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }
            
            const filePath = path.join(dataDir, `zendesk_api_data_${Date.now()}.json`);
            fs.writeFileSync(
              filePath,
              JSON.stringify(zendeskData, null, 2)
            );
            
            console.log(`Saved ZendeskV2CLIAPI data to ${filePath}`);
            
            // Also write a copy with a fixed name that overwrites the previous version
            const fixedFilePath = path.join(dataDir, 'zendesk_api_data.json');
            fs.writeFileSync(
              fixedFilePath,
              JSON.stringify(zendeskData, null, 2)
            );
          } catch (err) {
            console.error("Error writing Zendesk API data file:", err);
          }
        }
      }      
      
      // Return the first app in the results array
      return {
        id: appData.details?.canonical_id || app,
        name: appData.details?.name || appData.implementation?.name || app,
        logo_url: appData.details?.images?.url_64_x64 || appData.details?.image
      };
    } else {
      // If no results array, return the data directly
      return data;
    }
  } catch (error) {
    console.error("Error fetching app details:", error);
    return null;
  }
}

// Search for apps
async function searchApps(apiKey: string, query?: string): Promise<App[]> {
  try {
    let url = `https://actions.zapier.com/api/v2/apps/search/`;
    if (query) {
      url += `?q=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": `${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`Failed to search apps: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log("Search results:", data);
    return data.results || [];
  } catch (error) {
    console.error("Error searching apps:", error);
    return [];
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Check authentication - ensure user is an admin
  const user = await isAuthenticated(request);
  if (!user || !user.isAdmin) {
    throw new Response("Unauthorized: Admin access required", { status: 401 });
  }
  
  // Get available ticket systems
  const availableTicketSystems = [
    { id: "jira", name: "Jira" },
    { id: "ZendeskV2CLIAPI", name: "Zendesk" },
    { id: "servicenow", name: "ServiceNow" },
    { id: "freshdesk", name: "Freshdesk" }
  ];
  
  const apiKey = 'sk-ak-mbR1iAzMLs1dXtaWrs2hgJDfR6';
  const accountId = process.env.ZAPIER_ACCOUNT_ID || "";
  
  // We won't pre-fetch authentications in the loader to avoid unnecessary API calls
  
  return json({ 
    availableTicketSystems,
    zapierAccountId: accountId,
    hasApiKey: !!apiKey
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // Check authentication - ensure user is an admin
  const user = await isAuthenticated(request);
  if (!user || !user.isAdmin) {
    throw new Response("Unauthorized: Admin access required", { status: 401 });
  }
  
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const apiKey = 'sk-ak-mbR1iAzMLs1dXtaWrs2hgJDfR6';
  
  if (!apiKey) {
    return json({
      type: actionType,
      success: false,
      error: "API key not configured"
    });
  }
  
  // Handle fetching authentications for an app
  if (actionType === "fetchAuthentications") {
    const app = formData.get("app") as string;
    const accountId = formData.get("accountId") as string;
    
    if (!app) {
      return json({
        type: "authentications",
        success: false,
        error: "App parameter is required"
      });
    }
    
    try {
      const authentications = await fetchAppAuthentications(app, apiKey, accountId);
      return json({
        type: "authentications",
        success: true,
        authentications,
        app
      });
    } catch (error) {
      return json({
        type: "authentications",
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch authentications"
      });
    }
  }
  
  // Handle fetching app details
  if (actionType === "fetchAppDetails") {
    const app = formData.get("app") as string;
    
    if (!app) {
      return json({
        type: "appDetails",
        success: false,
        error: "App parameter is required"
      });
    }
    
    try {
      const appDetails = await fetchAppDetails(app, apiKey);
      
      return json({
        type: "appDetails",
        success: true,
        appDetails
      });
    } catch (error) {
      return json({
        type: "appDetails",
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch app details"
      });
    }
  }
  
  // Handle searching apps
  if (actionType === "searchApps") {
    const query = formData.get("query") as string;
    
    try {
      const apps = await searchApps(apiKey, query);
      return json({
        type: "searchApps",
        success: true,
        apps
      });
    } catch (error) {
      return json({
        type: "searchApps",
        success: false,
        error: error instanceof Error ? error.message : "Failed to search apps"
      });
    }
  }
  
  // Handle looking up ticket
  const ticketId = formData.get("ticketId") as string;
  const ticketSystem = formData.get("ticketSystem") as string;
  const accountId = formData.get("accountId") as string;
  const authenticationId = formData.get("authenticationId") as string;
  
  if (!ticketId || !ticketSystem) {
    return json({ 
      type: "lookup",
      success: false, 
      error: "Ticket ID and system are required" 
    });
  }
  
  if (!accountId || !authenticationId) {
    return json({
      type: "lookup",
      success: false,
      error: "Zapier account_id and authentication_id are required"
    });
  }
  
  try {
    // Get app and action based on ticket system
    const app = TICKET_SYSTEM_APPS[ticketSystem as keyof typeof TICKET_SYSTEM_APPS];
    const action = TICKET_SYSTEM_ACTIONS[ticketSystem as keyof typeof TICKET_SYSTEM_ACTIONS];
    
    if (!app || !action) {
      return json({ 
        type: "lookup",
        success: false, 
        error: "Unsupported ticket system" 
      });
    }
    
    // Log the request for debugging
    console.log("Making Zapier stateless request:", {
      ticketSystem,
      ticketId,
      app,
      action,
      accountId,
      authenticationId
    });
    
    // Call Zapier Stateless Action API
    const response = await fetch("https://actions.zapier.com/api/v2/execute/", {
      method: "POST",
      headers: {
        "x-api-key": `${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instructions: `Find information about ticket ${ticketId} in ${ticketSystem}`,
        params: {
          ticket_id: {
            mode: "locked",
            value: ticketId
          }
        },
        app: app,
        action: action,
        action_type: "search",
        account_id: parseInt(accountId, 10),
        authentication_id: parseInt(authenticationId, 10)
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zapier API error:", errorText);
      return json({ 
        type: "lookup",
        success: false, 
        error: `Zapier API error: ${errorText || `${response.status} ${response.statusText}`}`
      });
    }
    
    const zapierResponse = await response.json();
    console.log("Zapier API response:", zapierResponse);
    
    // Check if we got results
    if (zapierResponse.status === "success" && zapierResponse.results && zapierResponse.results.length > 0) {
      return json({
        type: "lookup",
        success: true,
        data: zapierResponse.results[0],
        fullResponse: zapierResponse
      });
    } else if (zapierResponse.status === "error") {
      return json({
        type: "lookup",
        success: false,
        error: zapierResponse.error || "Unknown error from Zapier API"
      });
    } else if (zapierResponse.status === "empty") {
      return json({
        type: "lookup",
        success: false,
        error: `No ticket found with ID ${ticketId} in ${ticketSystem}`
      });
    } else {
      return json({
        type: "lookup",
        success: false,
        error: "Unexpected response from Zapier API",
        details: zapierResponse
      });
    }
    
  } catch (error) {
    console.error("Error executing Zapier stateless action:", error);
    return json({
      type: "lookup",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export default function TicketLookup() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [ticketId, setTicketId] = useState("");
  const [ticketSystem, setTicketSystem] = useState("jira");
  const [accountId, setAccountId] = useState(loaderData.zapierAccountId || "");
  const [authenticationId, setAuthenticationId] = useState("");
  const [authentications, setAuthentications] = useState<Authentication[]>([]);
  const [isLoadingAuths, setIsLoadingAuths] = useState(false);
  const [appDetails, setAppDetails] = useState<App | null>(null);
  const [isLoadingAppDetails, setIsLoadingAppDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingApps, setIsSearchingApps] = useState(false);
  const [searchResults, setSearchResults] = useState<App[]>([]);
  // Add state for custom ticket systems
  const [customTicketSystems, setCustomTicketSystems] = useState<TicketSystem[]>([]);
  
  // Combine default and custom ticket systems
  const allTicketSystems = [
    ...loaderData.availableTicketSystems,
    ...customTicketSystems
  ];
  
  const isSubmitting = navigation.state === "submitting";
  
  // Update authentications when we get new data from action
  useEffect(() => {
    if (actionData?.type === "authentications") {
      setIsLoadingAuths(false);
      if (actionData.success && actionData.authentications) {
        setAuthentications(actionData.authentications);
        
        // Select the first authentication if available
        if (actionData.authentications.length > 0 && !authenticationId) {
          setAuthenticationId(actionData.authentications[0].id.toString());
        }
      }
    } else if (actionData?.type === "appDetails") {
      setIsLoadingAppDetails(false);
      if (actionData.success && actionData.appDetails) {
        setAppDetails(actionData.appDetails);
      }
    } else if (actionData?.type === "searchApps") {
      setIsSearchingApps(false);
      if (actionData.success && actionData.apps) {
        setSearchResults(actionData.apps);
      }
    }
  }, [actionData, authenticationId]);
  
  // Reset authentications and app details when changing ticket system
  useEffect(() => {
    setAuthentications([]);
    setAuthenticationId("");
    setAppDetails(null);
  }, [ticketSystem]);
  
  // Fetch authentications for the selected app
  const handleFetchAuthentications = () => {
    setIsLoadingAuths(true);
    const formData = new FormData();
    formData.append("actionType", "fetchAuthentications");
    
    // Get the app ID - check if it's a custom app or a default one
    const selectedSystem = allTicketSystems.find(sys => sys.id === ticketSystem);
    const appId = selectedSystem?.id || ticketSystem;
    
    formData.append("app", TICKET_SYSTEM_APPS[ticketSystem as keyof typeof TICKET_SYSTEM_APPS] || appId);
    formData.append("accountId", accountId);
    
    submit(formData, { method: "post" });
  };
  
  // Fetch app details for the selected app
  const handleFetchAppDetails = () => {
    setIsLoadingAppDetails(true);
    const formData = new FormData();
    formData.append("actionType", "fetchAppDetails");
    
    // Get the app ID - check if it's a custom app or a default one
    const selectedSystem = allTicketSystems.find(sys => sys.id === ticketSystem);
    const appId = selectedSystem?.id || ticketSystem;
    
    formData.append("app", TICKET_SYSTEM_APPS[ticketSystem as keyof typeof TICKET_SYSTEM_APPS] || appId);
    
    submit(formData, { method: "post" });
  };
  
  // Search for Zapier apps
  const handleSearchApps = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchingApps(true);
    
    const formData = new FormData();
    formData.append("actionType", "searchApps");
    formData.append("query", searchQuery);
    
    submit(formData, { method: "post" });
  };
  
  // Add app from search results to ticket systems
  const handleAddAppToTicketSystems = (app: App) => {
    // Check if already exists
    if (allTicketSystems.some(system => system.id === app.id)) {
      alert("This app is already in your ticket systems list.");
      return;
    }
    
    const newTicketSystem: TicketSystem = {
      id: app.id,
      name: app.name,
      logo_url: app.logo_url
    };
    
    setCustomTicketSystems(prev => [...prev, newTicketSystem]);
    
    // Optionally switch to the newly added system
    setTicketSystem(app.id);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("actionType", "lookup");
    formData.append("ticketId", ticketId);
    formData.append("ticketSystem", ticketSystem);
    formData.append("accountId", accountId);
    formData.append("authenticationId", authenticationId);
    
    submit(formData, { method: "post" });
  };
  
  // Only show lookup errors
  const lookupError = actionData?.type === "lookup" && !actionData.success ? actionData.error : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Ticket Lookup</h1>
      
      {lookupError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {lookupError}
        </div>
      )}
      
      {/* App Search Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Search Zapier Apps</h2>
        <Form onSubmit={handleSearchApps} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow px-3 py-2 border rounded-md"
              placeholder="Search for apps (e.g., Jira, Zendesk)"
              disabled={isSearchingApps}
            />
            <button
              type="submit"
              className={`px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 ${
                isSearchingApps ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSearchingApps}
            >
              {isSearchingApps ? "Searching..." : "Search Apps"}
            </button>
          </div>
        </Form>
        
        {searchResults.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Search Results</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-60 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App Name</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App ID</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {searchResults.map((app, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="py-2 px-3 text-sm">
                        <div className="flex items-center">
                          {app.logo_url && (
                            <img 
                              src={app.logo_url} 
                              alt={`${app.name} logo`} 
                              className="w-5 h-5 mr-2" 
                            />
                          )}
                          {app.name}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm font-mono">{app.id}</td>
                      <td className="py-2 px-3 text-sm">
                        <button
                          type="button"
                          onClick={() => handleAddAppToTicketSystems(app)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Add to Ticket Systems
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Look up a Ticket</h2>
        <Form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="ticketSystem">
              Ticket System
            </label>
            <select
              id="ticketSystem"
              value={ticketSystem}
              onChange={(e) => setTicketSystem(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isSubmitting}
            >
              {allTicketSystems.map(system => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            
            {customTicketSystems.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Including {customTicketSystems.length} custom app(s) added from search results.
              </p>
            )}
          </div>
          
          {appDetails && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-medium text-blue-800">App Details</h3>
              <p className="text-sm text-blue-600">Name: {appDetails.name}</p>
              <p className="text-sm text-blue-600">ID: {appDetails.id}</p>
            </div>
          )}
          
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={handleFetchAppDetails}
              className={`px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 ${
                isLoadingAppDetails ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoadingAppDetails || isSubmitting}
            >
              {isLoadingAppDetails ? "Loading..." : "Get App Details"}
            </button>
            
            <button
              type="button"
              onClick={handleFetchAuthentications}
              className={`px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 ${
                isLoadingAuths ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoadingAuths || isSubmitting}
            >
              {isLoadingAuths ? "Fetching..." : "Fetch Authentications"}
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="ticketId">
              Ticket ID
            </label>
            <input
              id="ticketId"
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter ticket ID (e.g., PROJ-123)"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="accountId">
              Zapier Account ID
            </label>
            <input
              id="accountId"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Your Zapier account ID"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              Find this in your Zapier account settings
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="authenticationId">
              Authentication
            </label>
            <div className="flex space-x-2">
              {isLoadingAuths ? (
                <div className="flex items-center space-x-2 my-2 flex-grow">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading authentications...</span>
                </div>
              ) : authentications.length > 0 ? (
                <select
                  id="authenticationId"
                  value={authenticationId}
                  onChange={(e) => setAuthenticationId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md flex-grow"
                  disabled={isSubmitting}
                >
                  <option value="">Select an authentication</option>
                  {authentications.map(auth => (
                    <option key={auth.id} value={auth.id.toString()}>
                      {auth.label || auth.title || `Connection ${auth.id}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex-grow">
                  <input
                    id="authenticationId"
                    type="text"
                    value={authenticationId}
                    onChange={(e) => setAuthenticationId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Authentication ID for the app connection"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-yellow-600 mt-1">
                    No authentications found. Click "Fetch Authentications" to get available connections.
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-1">
              Authentication IDs are retrieved from <code>/api/v2/apps/{'{app}'}/auths/</code>
            </p>
          </div>
          
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting || !authenticationId}
          >
            {isSubmitting ? "Looking up..." : "Look up Ticket"}
          </button>
        </Form>
      </div>
      
      {actionData?.type === "lookup" && actionData.success === true && actionData.data && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ticket Information</h2>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-500">Ticket ID:</span>
                <span className="font-medium ml-2">{actionData.data.ticket_id || actionData.data.id || "N/A"}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="font-medium ml-2">{actionData.data.status || "N/A"}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Title:</span>
                <span className="font-medium ml-2">{actionData.data.title || actionData.data.summary || "N/A"}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Assignee:</span>
                <span className="font-medium ml-2">{actionData.data.assignee || actionData.data.assigned_to || "N/A"}</span>
              </div>
            </div>
            
            {(actionData.data.description || actionData.data.body) && (
              <div className="mb-4">
                <span className="text-gray-500 block mb-2">Description:</span>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                  {actionData.data.description || actionData.data.body}
                </div>
              </div>
            )}
            
            {actionData.data.url && (
              <div className="mt-4">
                <a 
                  href={actionData.data.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  View in {ticketSystem} →
                </a>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Raw Response Data</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(actionData.fullResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
   