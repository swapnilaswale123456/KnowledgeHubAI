import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { getUserInfo } from "~/utils/session.server";
import { db } from "~/utils/db.server";
import { isZapierConfigured } from "~/lib/zapier/config";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

// Define proper types for action data
type ActionData = 
  | { success: true; message: string; user?: ZapierUser; result?: any }
  | { success: false; message: string; error?: string }
  | undefined;

type ZapierUser = {
  name?: string;
  email?: string;
  userId?: number;
  isStaff?: boolean;
};

type LoaderData = {
  isConfigured: boolean;
  error?: string;
};

/**
 * Helper function to check if user is authenticated and is an admin
 */
async function isAuthenticated(request: Request) {
  const userInfo = await getUserInfo(request);
  if (!userInfo.userId) {
    return { user: null, isAdmin: false };
  }
  
  const isAdmin = await db.adminUser.findUnique({ where: { userId: userInfo.userId } });
  return { 
    user: userInfo, 
    isAdmin: !!isAdmin 
  };
}

/**
 * Check if user is authorized and get Zapier configuration status
 */
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[Zapier Admin] Loader called");
  
  const { user, isAdmin } = await isAuthenticated(request);
  
  if (!user || !isAdmin) {
    console.log("[Zapier Admin] Authentication failed in loader");
    return json<LoaderData>({ 
      isConfigured: false,
      error: "Unauthorized" 
    }, { status: 401 });
  }

  return json<LoaderData>({
    isConfigured: isZapierConfigured(),
  });
}

/**
 * Handle form submissions for Zapier actions
 */
export async function action({ request }: ActionFunctionArgs) {
  console.log("[Zapier Admin] Action called");
  
  const { user, isAdmin } = await isAuthenticated(request);
  
  if (!user || !isAdmin) {
    console.log("[Zapier Admin] Authentication failed in action");
    return json<ActionData>({ 
      success: false, 
      message: "Unauthorized" 
    }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType")?.toString();

  console.log(`[Zapier Admin] Processing action type: ${actionType}`);

  if (actionType === "testConnection") {
    try {
      console.log("[Zapier Admin] Testing connection...");
      
      // Make a request to the Zapier API endpoint
      const apiUrl = `${new URL(request.url).origin}/admin/api/zapier`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass cookies for session authentication
          "Cookie": request.headers.get("Cookie") || ""
        },
        body: JSON.stringify({
          action: "checkAuth",
        }),
      });

      console.log(`[Zapier Admin] Test connection response status: ${response.status}`);
      
      // Try to parse response
      const data = await response.json();
      console.log(`[Zapier Admin] Test connection response data:`, data);
      
      if (response.ok && data.success) {
        return json<ActionData>({ 
          success: true, 
          message: `Successfully connected to Zapier${data.name ? ` as ${data.name}` : ''}${data.email ? ` (${data.email})` : ''}`, 
          user: {
            name: data.name,
            email: data.email,
            userId: data.user_id,
            isStaff: data.is_staff
          }
        });
      } else {
        return json<ActionData>({ 
          success: false, 
          message: data.error || `API error: ${response.status}` 
        });
      }
    } catch (error) {
      console.error("[Zapier Admin] Connection test error:", error);
      return json<ActionData>({ 
        success: false, 
        message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  if (actionType === "executeAction") {
    const actionId = formData.get("actionId")?.toString();
    const instructions = formData.get("instructions")?.toString();
    const previewOnly = formData.get("previewOnly") === "true";
    
    if (!actionId || !instructions) {
      return json<ActionData>({ 
        success: false, 
        message: "Action ID and instructions are required" 
      });
    }
    
    try {
      console.log(`[Zapier Admin] Executing action ${actionId} with preview=${previewOnly}`);
      
      // Make a request to the Zapier API endpoint
      const apiUrl = `${new URL(request.url).origin}/admin/api/zapier`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("Cookie") || ""
        },
        body: JSON.stringify({
          action: "executeAction",
          params: {
            actionId,
            instructions,
            previewOnly
          },
        }),
      });

      console.log(`[Zapier Admin] Execute action response status: ${response.status}`);
      
      const data = await response.json();
      console.log(`[Zapier Admin] Execute action response data:`, data);
      
      if (response.ok) {
        return json<ActionData>({ 
          success: true, 
          message: previewOnly ? "Preview generated successfully" : "Action executed successfully", 
          result: data 
        });
      } else {
        return json<ActionData>({ 
          success: false, 
          message: data.error || "Failed to execute action" 
        });
      }
    } catch (error) {
      console.error("[Zapier Admin] Action execution error:", error);
      return json<ActionData>({ 
        success: false, 
        message: `Execution error: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  return json<ActionData>({ 
    success: false, 
    message: "Invalid action" 
  });
}

export default function ZapierDashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [activeTab, setActiveTab] = useState("setup");
  const [actions, setActions] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState("");
  const [instructions, setInstructions] = useState("");
  const [previewOnly, setPreviewOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Derived state
  const isConfigured = 'isConfigured' in loaderData ? loaderData.isConfigured : false;
  const isSubmitting = navigation.state === "submitting";
  const isSuccess = actionData?.success === true;
  const actionMessage = actionData?.message || "";
  const actionResult = actionData?.success && 'result' in actionData ? actionData.result : null;
  const actionUser = actionData?.success && 'user' in actionData ? actionData.user : null;

  // Fetch actions when component mounts or configuration changes
  useEffect(() => {
    if (isConfigured) {
      fetchActions();
    }
  }, [isConfigured]);

  // Update UI when form submission completes
  useEffect(() => {
    if (navigation.state === "idle" && actionData) {
      setIsLoading(false);
      setLoadingMessage("");
      
      if (isSuccess && actionResult) {
        setActiveTab("results");
      }
    }
  }, [navigation.state, actionData, isSuccess, actionResult]);

  // Fetch available actions from the API
  const fetchActions = async () => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    setLoadingMessage("Fetching available actions...");
    
    try {
      const response = await fetch("/admin/api/zapier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "listActions",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActions(data);
      } else {
        console.error("Failed to fetch actions:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Handle form submission for testing connection
  const handleTestConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Testing connection to Zapier...");
    
    const formData = new FormData();
    formData.append("actionType", "testConnection");
    submit(formData, { method: "post" });
  };

  // Handle form submission for executing an action
  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage(previewOnly ? "Generating preview..." : "Executing action...");
    
    const formData = new FormData();
    formData.append("actionType", "executeAction");
    formData.append("actionId", selectedAction);
    formData.append("instructions", instructions);
    formData.append("previewOnly", previewOnly.toString());
    submit(formData, { method: "post" });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Zapier AI Actions Dashboard</h1>
      
      {!isConfigured && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Configured</AlertTitle>
          <AlertDescription>
            Zapier AI Actions is not configured. Please add your Zapier API key to the environment variables.
          </AlertDescription>
        </Alert>
      )}

      {actionData && (
        <Alert variant={isSuccess ? "default" : "destructive"} className="mb-6">
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{isSuccess ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center items-center mb-6 p-4 bg-blue-50 rounded-md">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-blue-600">{loadingMessage || "Loading..."}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Zapier Configuration</CardTitle>
              <CardDescription>
                Configure and test your Zapier AI Actions integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleTestConnection}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key Status</Label>
                    <div className="flex items-center mt-2">
                      <div className={`w-4 h-4 rounded-full mr-2 ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>{isConfigured ? 'Configured' : 'Not Configured'}</span>
                    </div>
                  </div>
                  
                  {actionUser && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium">Connected Account</h3>
                      <p>{actionUser.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{actionUser.email || ''}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600 mt-4">
                      To configure Zapier AI Actions, add the following environment variable to your .env file:
                    </p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                      ZAPIER_API_KEY=your_api_key_here
                    </pre>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-4" 
                  disabled={!isConfigured || isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? "Testing..." : "Test Connection"}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Execute Zapier Actions</CardTitle>
              <CardDescription>
                Select an action and provide instructions to execute it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleExecuteAction}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="actionId">Select Action</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchActions}
                      disabled={isLoading || !isConfigured}
                      className="flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  <select
                    id="actionId"
                    className="w-full p-2 border rounded"
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    required
                  >
                    <option value="">Select an action</option>
                    {actions.map((action: any) => (
                      <option key={action.id} value={action.id}>
                        {action.title || action.description || 'Unnamed action'} ({action.app_name || action.appName || 'Unknown app'})
                      </option>
                    ))}
                  </select>
                  
                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Provide instructions for the action..."
                      className="mt-1"
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="previewOnly"
                      checked={previewOnly}
                      onChange={(e) => setPreviewOnly(e.target.checked)}
                      className="mr-2"
                    />
                    <Label htmlFor="previewOnly">Preview Only (don't actually execute)</Label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-4" 
                  disabled={!selectedAction || !instructions || isSubmitting || isLoading || !isConfigured}
                >
                  {isSubmitting || isLoading ? 
                    (previewOnly ? "Generating Preview..." : "Executing Action...") : 
                    (previewOnly ? "Generate Preview" : "Execute Action")
                  }
                </Button>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
              <CardDescription>
                View the results of your Zapier action execution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actionResult ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
                  {JSON.stringify(actionResult, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No execution results available. Execute an action to see results here.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("actions")}
              >
                Back to Actions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 