import { useTranslation } from "react-i18next";
import { Link, useParams, useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import FileIcon from "~/components/ui/icons/dataSource/FileIcon";
import NotionIcon from "~/components/ui/icons/dataSource/NotionIcon";
import TextIcon from "~/components/ui/icons/dataSource/TextIcon";
import WebsiteIcon from "~/components/ui/icons/dataSource/WebsiteIcon";
import YouTubeIcon from "~/components/ui/icons/dataSource/YouTubeIcon";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { getDataSourceTypes } from "~/utils/db/dataSourceTypes.db.server";
import { ChevronLeft } from "lucide-react";

const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'website': WebsiteIcon,
  'file': FileIcon,
  'text': TextIcon,
  'youtube': YouTubeIcon,
  'notion': NotionIcon,
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const dataSourceTypes = await getDataSourceTypes();
  return json({ dataSourceTypes });
};

export default function CreateChatbot() {
  const { t } = useTranslation();
  const params = useParams();
  const { dataSourceTypes } = useLoaderData<typeof loader>();

  return (
    <div className="flex-1 space-y-2 p-4 max-w-5xl mx-auto">
      <div className="flex items-center mb-8">
        <Link
          to=".."
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select a Data Source</h2>
        <p className="text-gray-600">
          Select the type of content you want to add to the AI Chatbot's training data.
        </p>
        <p className="text-sm text-gray-500">
          If you need help, check out the{" "}
          <a href="#" className="text-blue-500 hover:underline">
            help documentation
            <span className="inline-block ml-1">↗</span>
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSourceTypes.map((sourceType) => {
          const Icon = ICON_MAP[sourceType.sourceKey] || FileIcon;
          const isEnabled = sourceType.sourceKey === 'file'; // Only enable file upload for now

          return (
            <Link
              key={sourceType.sourceTypeId}
              to={isEnabled ? `../file` : '#'}
              className={`block ${!isEnabled && 'opacity-60 cursor-not-allowed'}`}
            >
              <Card className="relative p-8 hover:shadow-md transition-shadow border rounded-lg">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-3 rounded-full ${isEnabled ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-6 w-6 ${isEnabled ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{sourceType.sourceName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {isEnabled ? 'Import PDFs or DOCXs for AI learning.' : 'Coming soon'}
                    </p>
                  </div>
                  <button 
                    className={`w-full mt-4 px-4 py-2 rounded-md ${
                      isEnabled 
                        ? 'text-gray-600 border hover:bg-gray-50' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    disabled={!isEnabled}
                  >
                    Continue
                  </button>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
