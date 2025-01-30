import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useParams, Outlet } from "@remix-run/react";
import SidebarIconsLayout, { IconDto } from "~/components/ui/layouts/SidebarIconsLayout";
import { requireAuth } from "~/utils/loaders.middleware";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";
import { AppearanceIcon, MessagesIcon, LanguageIcon } from "~/components/icons/customize";

interface LoaderData {
  chatbot: {
    id: string;
    name: string;    
  };
  title: string;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
    { title: data?.title || "Customize | KnowledgeHub AI" }
  ];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const chatbotId = params.id;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  try {
    const chatbot = await ChatbotQueryService.getChatbot(chatbotId);
    return json({ 
      chatbot,
      title: `Customize | KnowledgeHub AI`
    });
  } catch (error) {
    console.error("Error loading chatbot:", error);
    throw new Error("Failed to load chatbot");
  }
};

const getTabs = (params: { tenant: string; id: string }): IconDto[] => {
  return [
    {
      name: "Appearance",
      href: `/app/${params.tenant}/g/customize/${params.id}/appearance`,
      icon: <AppearanceIcon className="h-5 w-5" />,
      iconSelected: <AppearanceIcon className="h-5 w-5" />
    },
    {
      name: "Messages",
      href: `/app/${params.tenant}/g/customize/${params.id}/messages`,
      icon: <MessagesIcon className="h-5 w-5" />,
      iconSelected: <MessagesIcon className="h-5 w-5" />
    },
    {
      name: "Language",
      href: `/app/${params.tenant}/g/customize/${params.id}/language`,
      icon: <LanguageIcon className="h-5 w-5" />,
      iconSelected: <LanguageIcon className="h-5 w-5" />
    }
  ];
};

export default function CustomizeChatbot() {
  const { chatbot } = useLoaderData<LoaderData>();
  const params = useParams();

  return (
    <SidebarIconsLayout 
      label={{ align: "right" }} 
      items={getTabs(params)}
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