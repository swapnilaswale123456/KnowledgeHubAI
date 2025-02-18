import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { MessageSquare, Users, Clock, MoreVertical, Settings, Trash2, Zap, Check, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn } from "~/lib/utils";
import { ChatbotStatus } from "@prisma/client";
import { AreaChart, BarChart } from "@tremor/react";
import { useFetcher } from "@remix-run/react";
import { ChatbotCard } from "~/components/dashboard/ChatbotCard";

interface DashboardContentProps {
  chatbots: any[];
  metrics: {
    data: {
      chatbots: Array<{
        id: string;
        total_messages: number;
        total_sessions: number;
      }>;
      sessions: {
        recent: Array<{
          session_id: string;
          message_count: number;
          token_usage: number;
          last_activity: string;
        }>;
      };
      time_series: {
        sessions: Array<{
          session_id: string;
          message_count: number;
          token_usage: number;
          last_activity: string;
        }>;
      };
      model_analytics: {
        models_distribution: Record<string, number>;
        top_tools: Record<string, number>;
      };
    };
  };
  onStatusChange: (id: string, status: ChatbotStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (chatbot: ChatbotDetails) => Promise<void>;
  onNavigate: (id: string) => void;
  isLoading: boolean;
  fetcher: ReturnType<typeof useFetcher>;
}

export function DashboardContent({
  chatbots,
  metrics,
  onStatusChange,
  onDelete,
  onEdit,
  onNavigate,
  isLoading,
  fetcher
}: DashboardContentProps) {
  return (
    <div className="grid gap-4 grid-cols-7">
      {/* Left section - Chatbots */}
      <div className="col-span-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Chatbots</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {chatbots.length} total chatbots
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chatbots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No chatbots created yet</p>
                </div>
              ) : (
                chatbots.map(chatbot => (
                  <ChatbotCard
                    key={chatbot.id}
                    chatbot={chatbot}
                    metrics={metrics.data.chatbots.find(c => c.id === chatbot.id)}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onNavigate={onNavigate}
                    onEdit={onEdit}
                    isProcessing={isLoading}
                    fetcher={fetcher}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Times Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={Object.entries(metrics.data.time_series.sessions).map(([date, value]) => ({
                date,
                "Response Time": value
              }))}
              index="date"
              categories={["Response Time"]}
              colors={["blue"]}
              className="h-48"
            />
          </CardContent>
        </Card>

         {/* Tools Usage */}
         <Card>
          <CardHeader>
            <CardTitle>Top Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.data.model_analytics.top_tools).map(([tool, count]) => (
                <div key={tool} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg">
                  <span className="text-sm">{tool}</span>
                  <span className="text-sm font-medium">{count} uses</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right section - Sessions & Analytics */}
      <div className="col-span-3 space-y-4">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.data.sessions.recent.map(session => (
                <div key={session.session_id} className="flex items-center p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Session {session.session_id.slice(-8)}</p>
                    <div className="flex items-center text-sm text-muted-foreground space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{session.message_count} messages</span>
                      <Zap className="h-4 w-4 ml-2" />
                      <span>{session.token_usage} tokens</span>
                    </div>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={Object.entries(metrics.data.model_analytics.models_distribution).map(([model, count]) => ({
                model,
                "Usage": count
              }))}
              index="model"
              categories={["Usage"]}
              colors={["blue"]}
              className="h-48"
            />
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
} 