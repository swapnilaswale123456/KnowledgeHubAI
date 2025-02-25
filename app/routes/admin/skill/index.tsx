import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash, ArrowUpDown, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { getSkills } from "~/services/chatbot/SkillService";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { useRef, useState } from "react";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { Pagination } from "~/components/ui/pagination";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.skill.view");
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "name";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";

  const { skills, total, totalPages } = await getSkills({
    page,
    search,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc'
  });
  
  return json({ skills, total, totalPages, page, title: "Agent Skills" });
}
export const meta: MetaFunction<typeof loader> = ({ data }) => [
    { title: data?.title || "Agent Skills" }
  ];

export default function SkillList() {
  const { skills, total, totalPages, page } = useLoaderData<typeof loader>();
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
      t("admin.skill.deleteDescription"),
      t("admin.skill.deleteTitle")
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    
    try {
      await fetch(`/admin/skill/${deleteId}/delete`, { method: 'POST' });
      toast.success(t("admin.skill.deleteSuccess"));
    } catch (error) {
      toast.error(t("admin.skill.deleteError"));
    }
  };

  const getSortIcon = (column: string) => {
    if (searchParams.get("sortBy") !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    return searchParams.get("sortOrder") === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>{t("admin.skill.title")}</CardTitle>
            <Link to="/admin/skill/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.skill.new")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder={t("common.Search")}
              value={searchParams.get("search") || ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead 
                  onClick={() => handleSort("name")}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {t("admin.skill.name")}
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead>{t("admin.skill.description")}</TableHead>
                <TableHead>{t("admin.skill.isEnabled")}</TableHead>
                <TableHead>{t("admin.skill.icon")}</TableHead>
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
              {skills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell>{skill.name}</TableCell>
                  <TableCell>{skill.description}</TableCell>
                  <TableCell>
                    {skill.isEnabled ? t("common.Enabled") : t("common.Disabled")}
                  </TableCell>
                  <TableCell>{skill.icon}</TableCell>
                  <TableCell>
                    {new Date(skill.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link to={`/admin/skill/${skill.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDelete(skill.id.toString())}
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