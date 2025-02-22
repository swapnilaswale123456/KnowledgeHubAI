import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getSelectedChatbot, setSelectedChatbot ,commitSession} from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const url = new URL(request.url);

    const searchParams = new URLSearchParams(url.search);
    const chatbotId = await getSelectedChatbot(request) || searchParams.get("chatbotId");
  
    if (!chatbotId) {
      return redirect(`/app/${params.tenant}/dashboard`);
    }
  
    // Ensure chatbot ID is in session
    const session = await setSelectedChatbot(request, chatbotId);
    
    return redirect(`/app/${params.tenant}/g/embed-and-integrate/${chatbotId}`, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
};

export default function EmbedAndIntegrateIndex() {
  const data = useLoaderData();
  return null;
} 