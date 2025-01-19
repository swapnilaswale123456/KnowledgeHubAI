import { Trash2 } from "lucide-react";
import { getFileFormat } from "~/utils/formatters";

interface FileSource {
  sourceId: number;
  fileName: string;
  fileType: string;
  uploadedFilePath: string;
  createdAt: Date;
}

interface FileListProps {
  files: FileSource[];
  onDelete: (sourceId: number) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Trained Items
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              File
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Status
            </th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.sourceId}>
              <td className="px-4 py-2 text-sm text-gray-500">
                {file.fileName}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100">
                  {getFileFormat(file.fileType)}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                  Trained
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-right">
                <button
                  onClick={() => onDelete(file.sourceId)}
                  className="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-sm text-gray-500 text-center">
                No files uploaded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 