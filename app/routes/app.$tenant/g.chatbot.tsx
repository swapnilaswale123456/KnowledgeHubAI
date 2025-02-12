import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getSelectedChatbot } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const chatbotId = await getSelectedChatbot(request);
 

  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }
  
  // If we're on the base route, redirect to the chatbot ID route
  const url = new URL(request.url);
  if (url.pathname === `/app/${params.tenant}/g/chatbot`) {
    return redirect(`/app/${params.tenant}/g/chatbot/${chatbotId}`);
  }
  
  return null;
};

export default function ChatbotRoute() {
  return <Outlet />;
}