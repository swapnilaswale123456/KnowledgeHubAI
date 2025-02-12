import { Outlet, useLocation, useNavigate, useParams, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { json, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
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
import { getDataSourceService } from "~/utils/services/dataSourceService.server";
import type { DataSourceType } from "~/utils/db/dataSourceTypes.db.server";
import { useChatbot } from "~/contexts/ChatbotContext";
import { getSelectedChatbot } from "~/utils/session.server";

type LoaderData = {
  title: string;
  isProduction?: boolean;
  dataSourceTypes: DataSourceType[];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { t } = await getTranslations(request);
  const dataSourceService = getDataSourceService();
  const url = new URL(request.url);
  
  const dataSourceTypes = await dataSourceService.getDataSourceTypes();
  const chatbotId = await getSelectedChatbot(request);
 

  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }
  // Redirect to overview if on base route
  if (url.pathname === UrlUtils.currentTenantUrl(params, "g/data-sources")) {
    return redirect(UrlUtils.currentTenantUrl(params, `g/data-sources/overview?chatbotId=${chatbotId || ''}`));
  }
  
  return json({
    title: `Data Sources | ${process.env.APP_NAME}`,
    isProduction: process.env.NODE_ENV === "production",
    dataSourceTypes,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DataSourcesRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { selectedChatbotId } = useChatbot();

  // Define tabs dynamically from dataSourceTypes
  const getTabs = () => {
    const iconMap: Record<string, { icon: React.ReactNode; iconSelected: React.ReactNode }> = {
      overview: {
        icon: <OverviewIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <OverviewIconFilled className="h-5 w-5 text-gray-500" />
      },
      file: {
        icon: <FileIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <FileIconFilled className="h-5 w-5 text-gray-500" />
      },
      website: {
        icon: <WebsiteIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <WebsiteIconFilled className="h-5 w-5 text-gray-500" />
      },
      text: {
        icon: <TextIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <TextIconFilled className="h-5 w-5 text-gray-500" />
      },
      notion: {
        icon: <NotionIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <NotionIconFilled className="h-5 w-5 text-gray-500" />
      },
      youtube: {
        icon: <YouTubeIcon className="h-5 w-5 text-gray-400" />,
        iconSelected: <YouTubeIconFilled className="h-5 w-5 text-gray-500" />
      }
    };

    return data.dataSourceTypes.map((type): IconDto => ({
      name: type.sourceName,
      href: UrlUtils.currentTenantUrl(
        params, 
        `g/data-sources/${type.sourceKey}${selectedChatbotId ? `?chatbotId=${selectedChatbotId}` : ''}`
      ),
      icon: iconMap[type.sourceKey]?.icon,
      iconSelected: iconMap[type.sourceKey]?.iconSelected
    }));
  };

  return (
    <SidebarIconsLayout label={{ align: "right" }} items={getTabs()}>
      <Outlet />
    </SidebarIconsLayout>
  );
}
