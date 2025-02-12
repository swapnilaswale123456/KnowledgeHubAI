import { json, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData, useParams, Outlet, useRouteError, useNavigate, useLocation } from "@remix-run/react";
import { useEffect } from "react";
import SidebarIconsLayout, { IconDto } from "~/components/ui/layouts/SidebarIconsLayout";
import { requireAuth } from "~/utils/loaders.middleware";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";
import { AppearanceIcon, MessagesIcon, LanguageIcon } from "~/components/icons/customize";
import { getSelectedChatbot, setSelectedChatbot, commitSession, getUserSession, requireSelectedChatbot } from "~/utils/session.server";

interface LoaderData {
  chatbotId: string;
  chatbot?: {
    id: string;
    name: string;    
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.chatbot?.name ? `Customize ${data.chatbot.name} | KnowledgeHub AI` : "Customize Chatbot | KnowledgeHub AI" }
];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireSelectedChatbot(request, { tenant: params.tenant ?? "" });
  const chatbotId = params.id;
  
  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }

  const chatbot = await ChatbotQueryService.getChatbot(chatbotId);
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  const session = await getUserSession(request);
  session.set("selectedChatbotId", chatbotId);
  
  return json(
    { chatbotId, chatbot },
    {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    }
  );
};

const getTabs = (params: { tenant: string; id: string }): IconDto[] => {
  return [
    {
      name: "Appearance",
      href: `/app/${params.tenant}/g/customize/${params.id}/appearance`,
      icon: <AppearanceIcon className="h-5 w-5" />,
      iconSelected: <AppearanceIcon className="h-5 w-5" />,
      exact: true
    },
    {
      name: "Messages",
      href: `/app/${params.tenant}/g/customize/${params.id}/messages`,
      icon: <MessagesIcon className="h-5 w-5" />,
      iconSelected: <MessagesIcon className="h-5 w-5" />,
      exact: true
    },
    {
      name: "Language",
      href: `/app/${params.tenant}/g/customize/${params.id}/language`,
      icon: <LanguageIcon className="h-5 w-5" />,
      iconSelected: <LanguageIcon className="h-5 w-5" />,
      exact: true
    }
  ];
};

export default function CustomizeChatbot() {
  const { chatbotId, chatbot } = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to appearance tab if on base route
  useEffect(() => {
    if (location.pathname === `/app/${params.tenant}/g/customize/${params.id}`) {
      navigate(`/app/${params.tenant}/g/customize/${params.id}/appearance`);
    }
  }, [location.pathname, params.tenant, params.id, navigate]);

  return (
    <SidebarIconsLayout 
      label={{ align: "right" }} 
      items={getTabs({ 
        tenant: params.tenant ?? "", 
        id: params.id ?? "" 
      })}
    >
      <div className="h-full">
        <Outlet />
      </div>
    </SidebarIconsLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Error</h1>
      <p className="text-red-500">Failed to load chatbot customization settings.</p>
    </div>
  );
} 