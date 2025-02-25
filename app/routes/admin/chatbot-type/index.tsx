import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { getChatbotTypes } from "~/services/chatbot/ChatbotTypeService";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useRef, useState } from "react";
import ConfirmModal from "~/components/ui/modals/ConfirmModal";
import { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { Pagination } from "~/components/ui/pagination";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.view");
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "name";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";

  const { chatbotTypes, total, totalPages } = await getChatbotTypes({
    page,
    search,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc'
  });
  
  return json({ chatbotTypes, total, totalPages, page });
}

export default function ChatbotTypeList() {
  const { chatbotTypes, total, totalPages, page } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmModal = useRef<RefConfirmModal>(null);

  const handleSearch = (value: string) => {
    setSearchParams(prev => {
      prev.set("search", value);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleSort = (column: string) => {
    setSearchParams(prev => {
      const currentSortBy = prev.get("sortBy");
      const currentOrder = prev.get("sortOrder");
      
      prev.set("sortBy", column);
      prev.set("sortOrder", 
        currentSortBy === column && currentOrder === "asc" ? "desc" : "asc"
      );
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    confirmModal.current?.show(
      t("admin.chatbotType.deleteTitle"),
      t("admin.chatbotType.deleteDescription")
    );
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        const response = await fetch(`/admin/chatbot-type/${deleteId}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          toast.success(t("admin.chatbotType.deleteSuccess"));
          window.location.reload();
        } else {
          toast.error(t("admin.chatbotType.deleteError"));
        }
      } catch (error) {
        toast.error(t("admin.chatbotType.deleteError"));
      }
      setDeleteId(null);
    }
  };

  const getSortIcon = (column: string) => {
    const currentSortBy = searchParams.get("sortBy");
    const currentOrder = searchParams.get("sortOrder");

    if (currentSortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return currentOrder === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("admin.chatbotType.title")}</CardTitle>
          <div className="flex items-center gap-4">
            <Input
              placeholder={t("common.Search")}
              value={searchParams.get("search") || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-[200px]"
            />
            <Link to="/admin/chatbot-type/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.chatbotType.new")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  onClick={() => handleSort("name")}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {t("admin.chatbotType.name")}
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead>{t("admin.chatbotType.description")}</TableHead>
                <TableHead>{t("admin.chatbotType.isEnabled")}</TableHead>
                <TableHead>{t("admin.chatbotType.icon")}</TableHead>
                <TableHead 
                  onClick={() => handleSort("createdAt")}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {t("common.CreatedAt")}
                    {getSortIcon("createdAt")}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">{t("common.Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chatbotTypes.map((chatbotType) => (
                <TableRow key={chatbotType.id}>
                  <TableCell>{chatbotType.name}</TableCell>
                  <TableCell>{chatbotType.description}</TableCell>
                  <TableCell>
                    {chatbotType.isEnabled ? t("common.Enabled") : t("common.Disabled")}
                  </TableCell>
                  <TableCell>{chatbotType.icon}</TableCell>
                  <TableCell>
                    {new Date(chatbotType.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link to={`/admin/chatbot-type/${chatbotType.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDelete(chatbotType.id.toString())}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t("common.TotalItems", { count: total })}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmModal ref={confirmModal} onYes={handleDeleteConfirm} destructive />
    </div>
  );
} 