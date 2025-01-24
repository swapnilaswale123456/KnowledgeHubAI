import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { BarChart as RechartsBarChart, Bar } from 'recharts';

interface ChartProps {
  data: any[];
  className?: string;
}

export function LineChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="60%" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, className }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 