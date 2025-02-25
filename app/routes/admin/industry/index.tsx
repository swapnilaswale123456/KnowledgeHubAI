import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash, ArrowUpDown, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { getIndustries } from "~/services/chatbot/IndustryService";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Pagination } from "~/components/ui/pagination";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { useRef, useState } from "react";


interface Industry {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  isEnabled: boolean;
  icon: string | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.view");
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "name";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";

  const { industries, total, totalPages } = await getIndustries({
    page,
    search,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc'
  });
  
  return json({ industries, total, totalPages, page, title: "Industries" });
}
export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Industries" }
];

export default function IndustryList() {
  const { industries, total, totalPages, page } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const handleSearch = (value: string) => {
    setSearchParams(prev => {
      prev.set("search", value);
      prev.set("page", "1");
      return prev;
    });
  };
 
  const confirmModal = useRef<RefConfirmModal>(null);
  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        const response = await fetch(`/admin/industry/${deleteId}/delete`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          toast.success(t("admin.industry.deleteSuccess"));
          window.location.reload();
        } else {
          toast.error(t("admin.industry.deleteError"));
        }
      } catch (error) {
        toast.error(t("admin.industry.deleteError"));
      }
      setDeleteId(null);
    }
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
      t("admin.industry.deleteDescription"),
      t("admin.industry.deleteTitle")
      
    );
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
          <CardTitle>{t("admin.industry.title")}</CardTitle>
          <div className="flex items-center gap-4">
            <Input
              placeholder={t("common.Search")}
              value={searchParams.get("search") || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-[200px]"
            />
            <Link to="/admin/industry/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.industry.new")}
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
                    {t("admin.industry.name")}
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead>{t("admin.industry.description")}</TableHead>
                <TableHead>{t("admin.industry.isEnabled")}</TableHead>
                <TableHead>{t("admin.industry.icon")}</TableHead>
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
              {industries.map((industry: Industry) => (
                <TableRow key={industry.id}>
                  <TableCell>{industry.name}</TableCell>
                  <TableCell>{industry.description}</TableCell>
                  <TableCell>{industry.isEnabled === true ? t("common.Enabled") : t("common.Disabled")}</TableCell>
                  <TableCell>{industry.icon}</TableCell>
                  <TableCell>
                    {new Date(industry.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link to={`/admin/industry/${industry.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/admin/industry/${industry.id}/assign-chatbot-types`}>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDelete(industry.id.toString())}
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
      <ConfirmModal ref={confirmModal} onYes={handleDeleteConfirm} destructive/>

    </div>
  );
}