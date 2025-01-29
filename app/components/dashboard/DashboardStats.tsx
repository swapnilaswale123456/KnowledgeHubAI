import { Card, CardContent } from "~/components/ui/card";
import { Bot, Activity, MessageSquare, Database } from "lucide-react";

interface DashboardStatsProps {
  totalChatbots: number;
  activeChatbots: number;
  totalMessages: number;
  totalDataSources: number;
}

export function DashboardStats({ totalChatbots, activeChatbots, totalMessages, totalDataSources }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <StatCard 
        title="Total Assistants"
        value={totalChatbots}
        icon={<Bot className="h-6 w-6 text-blue-700" />}
        color="blue"
      />
      <StatCard 
        title="Active"
        value={activeChatbots}
        icon={<Activity className="h-6 w-6 text-green-700" />}
        color="green"
      />
      <StatCard 
        title="Total Messages"
        value={totalMessages}
        icon={<MessageSquare className="h-6 w-6 text-purple-700" />}
        color="purple"
      />
      <StatCard 
        title="Data Sources"
        value={totalDataSources}
        icon={<Database className="h-6 w-6 text-orange-700" />}
        color="orange"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-none`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium text-${color}-600`}>{title}</p>
            <h3 className={`text-3xl font-bold text-${color}-900 mt-2`}>{value}</h3>
          </div>
          <div className={`p-3 bg-${color}-200 rounded-xl`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 