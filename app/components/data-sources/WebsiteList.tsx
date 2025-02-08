import { Trash2 } from "lucide-react";

interface WebsiteSource {
    sourceId: number;
    url: string;
    createdAt: Date;
  }

  interface WebsiteProps {
    websites: WebsiteSource[];
    onDelete: (sourceId: number) => void;
  }

  
export function WebsiteList({ websites, onDelete } : WebsiteProps) {
    return (
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Website Urls
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
              Action
            </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {websites.map((website) => (
              <tr key={website.sourceId}>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {website.url}
                </td>
                <td className="px-4 py-2 text-sm text-right">
                  <button
                    onClick={() => onDelete(website.sourceId)}
                    className="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {websites.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-sm text-gray-500 text-center">
                  No websites uploaded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }