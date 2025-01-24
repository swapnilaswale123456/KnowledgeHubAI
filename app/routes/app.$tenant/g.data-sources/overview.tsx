import { json, LoaderFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import type { MetaFunction } from "@remix-run/node";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  
  return json({ 
    title: "Data Sources"
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Data Sources" }
];

export default function DataSourceOverviewRoute() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
        <button className="btn-primary">Add New Source</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <div className="text-success">12</div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Connected and syncing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Website crawler completed</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">New file source added</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">Company Website</td>
                  <td className="p-4 align-middle">Website</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="p-4 align-middle">2 hours ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 