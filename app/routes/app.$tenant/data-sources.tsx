import { Outlet, useLocation, useNavigate, useParams, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { getTranslations } from "~/locale/i18next.server";
import UrlUtils from "~/utils/app/UrlUtils";
import { useEffect } from "react";
import SidebarIconsLayout, { IconDto } from "~/components/ui/layouts/SidebarIconsLayout";
import OverviewIcon from "~/components/ui/icons/dataSource/OverviewIcon";
import OverviewIconFilled from "~/components/ui/icons/dataSource/OverviewIconFilled";
import FileIcon from "~/components/ui/icons/dataSource/FileIcon";
import FileIconFilled from "~/components/ui/icons/dataSource/FileIconFilled";
import WebsiteIcon from "~/components/ui/icons/dataSource/WebsiteIcon";
import WebsiteIconFilled from "~/components/ui/icons/dataSource/WebsiteIconFilled";
import TextIcon from "~/components/ui/icons/dataSource/TextIcon";
import TextIconFilled from "~/components/ui/icons/dataSource/TextIconFilled";
import NotionIcon from "~/components/ui/icons/dataSource/NotionIcon";
import NotionIconFilled from "~/components/ui/icons/dataSource/NotionIconFilled";
import YouTubeIcon from "~/components/ui/icons/dataSource/YouTubeIcon";
import YouTubeIconFilled from "~/components/ui/icons/dataSource/YouTubeIconFilled";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = {
  title: string;
  isProduction?: boolean;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { t } = await getTranslations(request);
  const data: LoaderData = {
    title: `Data Sources | ${process.env.APP_NAME}`,
    isProduction: process.env.NODE_ENV === "production",
  };
  return json(data);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DataSourcesRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Define tabs for the Data Source page
  const getTabs = () => {
    const tabs: IconDto[] = [];
    tabs.push({
      name: "Overview",
      href: UrlUtils.currentTenantUrl(params, "data-sources/overview"),
      icon: <OverviewIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <OverviewIconFilled className="h-5 w-5 text-gray-500" />,
    });
    tabs.push({
      name: "File",
      href: UrlUtils.currentTenantUrl(params, "data-sources/file"),
      icon: <FileIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <FileIconFilled className="h-5 w-5 text-gray-500" />,
    });
    tabs.push({
      name: "Website",
      href: UrlUtils.currentTenantUrl(params, "data-sources/website"),
      icon: <WebsiteIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <WebsiteIconFilled className="h-5 w-5 text-gray-500" />,
    });
    tabs.push({
      name: "Text",
      href: UrlUtils.currentTenantUrl(params, "data-sources/text"),
      icon: <TextIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <TextIconFilled className="h-5 w-5 text-gray-500" />,
    });
    tabs.push({
      name: "Notion",
      href: UrlUtils.currentTenantUrl(params, "data-sources/notion"),
      icon: <NotionIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <NotionIconFilled className="h-5 w-5 text-gray-500" />,
    });
    tabs.push({
      name: "YouTube",
      href: UrlUtils.currentTenantUrl(params, "data-sources/youtube"),
      icon: <YouTubeIcon className="h-5 w-5 text-gray-400" />,
      iconSelected: <YouTubeIconFilled className="h-5 w-5 text-gray-500" />,
    });

    return tabs;
  };

  // Redirect to the Overview tab if landing on the base data-source route
  useEffect(() => {
    if (UrlUtils.stripTrailingSlash(location.pathname) === UrlUtils.currentTenantUrl(params, "data-sources")) {
      navigate(UrlUtils.currentTenantUrl(params, "data-sources/overview"));
    }
  }, [location.pathname]);

  return (
    <SidebarIconsLayout label={{ align: "right" }} items={getTabs()}>
      <Outlet />
    </SidebarIconsLayout>
  );
  
}
