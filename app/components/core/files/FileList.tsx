import { format } from "date-fns";
import { FileTextIcon, Trash2Icon, SearchIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { cn } from "~/lib/utils";
import EmptyState from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

export interface FileSource {
  sourceId: number;
  fileName: string;
  fileType: string;
  createdAt: Date;
  isTrained?: boolean;
}

interface FileListProps {
  files: FileSource[];
  onDelete?: (sourceId: number) => void;
}

function getFileFormat(fileType: string): string {
  const format = fileType.split('/').pop() || fileType;
  const formatMap: Record<string, string> = {
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'msword': 'DOC',
    'pdf': 'PDF',
    'plain': 'TXT',
    'text/plain': 'TXT'
  };
  return formatMap[format] || format.toUpperCase();
}

export function FileList({ files, onDelete }: FileListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="mx-auto max-w-5xl space-y-2 px-4 pb-6 pt-2 sm:px-6 lg:px-8 xl:max-w-full">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search files..."
              className="pl-10 max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Trained File</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Format</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {paginatedFiles.map((file) => (
                <tr key={file.sourceId} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{file.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant="secondary">
                      {getFileFormat(file.fileType)}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline" className={
                      file.isTrained 
                        ? "bg-green-50 text-green-600" 
                        : "bg-yellow-50 text-yellow-600"
                    }>
                      {file.isTrained ? "Trained" : "Pending"}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(file.sourceId)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    {searchTerm ? "No matching files found" : "No files uploaded yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
} 