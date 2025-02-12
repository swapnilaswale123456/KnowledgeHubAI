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
  createdAt: Date | string;
  isTrained?: boolean;
  chatbotId?: string;
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

  if (files.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-gray-500">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Uploaded Files</CardTitle>
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search files..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFiles.map((file) => (
              <TableRow key={file.sourceId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-blue-500" />
                    {file.fileName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getFileFormat(file.fileType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={file.isTrained ? "default" : "secondary"}>
                    {file.isTrained ? "Trained" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(file.sourceId)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationLink
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                ))}
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 