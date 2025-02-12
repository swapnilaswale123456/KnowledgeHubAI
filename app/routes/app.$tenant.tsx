import { useEffect } from "react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useLocation, useNavigate, useParams, useLoaderData, useSearchParams, useOutletContext } from "@remix-run/react";
import AppLayout from "~/components/app/AppLayout";
import { useAppData } from "~/utils/data/useAppData";
import { loadAppData } from "~/utils/data/.server/appData";
import { getUser, updateUserDefaultTenantId } from "~/utils/db/users.db.server";
import { getSelectedChatbot, setSelectedChatbot, commitSession, getUserInfo } from "~/utils/session.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { getTenantUserByIds } from "~/utils/db/tenants.db.server";
import { getAppConfiguration } from "~/utils/db/appConfiguration.db.server";
import UrlUtils from "~/utils/app/UrlUtils";
import { useRootData } from "~/utils/data/useRootData";
import ServerError from "~/components/ui/errors/ServerError";
import { createUniqueTenantIpAddress } from "~/utils/db/tenants/tenantIpAddress.db.server";
import { getClientIPAddress } from "~/utils/server/IpUtils";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { getTranslations } from "~/locale/i18next.server";
import { ChatbotProvider } from "~/contexts/ChatbotContext";
import { useState, createContext } from "react";
export { serverTimingHeaders as headers };

type LoaderData = {
  selectedChatbotId: string | null;
  // Include all the existing app data types
  currentTenant: any; // Replace with proper type
  mySubscription: any; // Replace with proper type
  // ... other existing data types
};

type ChatbotContextType = { 
  selectedChatbotId: string | null;
  selectChatbot: (id: string) => void;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant");
  const { t } = await getTranslations(request);
  const appData = await time(loadAppData({ request, params, t }, time), "loadAppData");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const userInfo = await time(getUserInfo(request), "getUserInfo");
  const user = await time(getUser(userInfo.userId), "getUser");

  const appConfiguration = await getAppConfiguration({ request });
  if (appConfiguration.app.features.tenantHome === "/") {
    return redirect("/");
  }

  if (!user?.admin) {
    const tenantUser = await time(getTenantUserByIds(tenantId, userInfo.userId), "getTenantUserByIds");
    if (!tenantUser) {
      throw redirect("/app");
    }
  }
  if (user?.defaultTenantId !== tenantId) {
    await time(updateUserDefaultTenantId({ defaultTenantId: tenantId }, userInfo.userId), "updateUserDefaultTenantId");
  }
  // Store IP Address
  await time(
    createUniqueTenantIpAddress({
      ip: getClientIPAddress(request) ?? "Unknown",
      fromUrl: new URL(request.url).pathname,
      tenantId,
      userId: userInfo.userId,
    }),
    "createUniqueTenantIpAddress"
  );

  if (!UrlUtils.stripTrailingSlash(new URL(request.url).pathname).startsWith(`/app/${params.tenant}/settings`)) {
    const appConfiguration = await time(getAppConfiguration({ request }), "getAppConfiguration");
    if (appConfiguration.subscription.required && appData.mySubscription?.products.length === 0) {
      throw redirect(`/subscribe/${params.tenant}?error=subscription_required`);
    }
  }
  if (appData.currentTenant.deactivatedReason) {
    throw redirect(`/deactivated/${params.tenant}`);
  }

  const selectedChatbotId = await getSelectedChatbot(request);
  const session = await setSelectedChatbot(request, selectedChatbotId);
  
  return json({
    ...appData,
    selectedChatbotId
  }, { 
    headers: {
      ...getServerTimingHeader(),
      "Set-Cookie": await commitSession(session)
    }
  });
};

export default function AppTenantRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectChatbot = (id: string) => {
    setSearchParams({ chatbotId: id });
  };

  return (
    <ChatbotProvider>
      <div className="min-h-screen bg-gray-50">
        <AppLayout layout="app">
          <Outlet context={{ 
            selectedChatbotId: searchParams.get("chatbotId"),
            selectChatbot 
          }} />
        </AppLayout>
      </div>
    </ChatbotProvider>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}

export function useSelectedChatbot() {
  return useOutletContext<ChatbotContextType>();
}
