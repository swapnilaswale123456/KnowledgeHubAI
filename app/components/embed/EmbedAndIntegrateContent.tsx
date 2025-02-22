import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Copy, Code, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "@remix-run/react";

interface EmbedAndIntegrateContentProps {
  chatbotId: string;
  uniqueUrl: string;
}

export default function EmbedAndIntegrateContent({ chatbotId, uniqueUrl }: EmbedAndIntegrateContentProps) {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const location = useLocation();
  
  useEffect(() => {
    // Set base URL only on client side
    setBaseUrl(window.location.origin);
  }, []);

  // Construct URLs after we have the baseUrl
  const directUrl = baseUrl ? `${baseUrl}/app/${uniqueUrl}/g/chatbot/${chatbotId}` : "";
  const embeddedUrl = directUrl ? `${directUrl}?embedded=true` : "";
  
  const iframeCode = `<iframe
  src="${embeddedUrl}"
  width="400"
  height="600"
  frameborder="0"
  style="border: 1px solid #eee; border-radius: 10px;"
></iframe>`;

  const scriptCode = `<script>
  window.chatbotConfig = {
    chatbotId: "${chatbotId}",
    uniqueUrl: "${uniqueUrl}",
    position: "bottom-right",
    theme: "light"
  }
</script>
<script src="${baseUrl}/assets/chatbot-widget.js"></script>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Embed & Integrate</h1>
      
      <Tabs defaultValue="iframe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="iframe">IFrame Embed</TabsTrigger>
          <TabsTrigger value="script">JavaScript Widget</TabsTrigger>
          <TabsTrigger value="direct">Direct Link</TabsTrigger>
        </TabsList>

        <TabsContent value="iframe">
          <Card>
            <CardHeader>
              <CardTitle>Embed as IFrame</CardTitle>
              <CardDescription>
                Add this code to your website to embed the chatbot directly in your page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">{iframeCode}</pre>
                </div>
                <Button onClick={() => handleCopy(iframeCode)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle>Add JavaScript Widget</CardTitle>
              <CardDescription>
                Add this code to your website to show the chatbot as a floating widget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">{scriptCode}</pre>
                </div>
                <Button onClick={() => handleCopy(scriptCode)}>
                  <Code className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct Link</CardTitle>
              <CardDescription>
                Share this link to access the chatbot directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={directUrl} readOnly />
                  <Button onClick={() => handleCopy(directUrl)}>
                    <Globe className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy URL'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 