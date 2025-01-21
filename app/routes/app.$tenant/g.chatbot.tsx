import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { chatbotStorage } from "~/utils/services/chatbots/chatbotLocalStorage";

export async function loader({ params }: LoaderFunctionArgs) {
 
  return null;
}

export default function ChatbotRoute() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const storedChatbot = chatbotStorage.getStoredChatbot();
    if (storedChatbot?.id) {
      navigate(`/app/${params.tenant}/g/chatbot/${storedChatbot.id}`);
    } else {
      navigate(`/app/${params.tenant}/dashboard`);
    }
  }, [navigate, params.tenant]);

  return null;
}
