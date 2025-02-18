import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MessageSquare, Zap, Clock, Users } from "lucide-react";

interface DashboardMetricsProps {
  metrics: {
    overview: {
      total_sessions: number;
      active_sessions: number;
      total_messages: number;
      total_tokens: number;
    };
    performance: {
      response_times: {
        average: number;
        completion_time: number;
      };
      token_metrics: {
        average_per_message: number;
        input_tokens: number;
        output_tokens: number;
      };
    };
  };
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overview.total_sessions}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.overview.active_sessions} active now
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overview.total_messages}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.performance.token_metrics.average_per_message.toFixed(1)} tokens/message
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.performance.response_times.average.toFixed(1)}s
          </div>
          <p className="text-xs text-muted-foreground">Average response time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overview.total_tokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.performance.token_metrics.output_tokens.toLocaleString()} output tokens
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 