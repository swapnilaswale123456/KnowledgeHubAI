import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate, useParams } from "@remix-run/react";
export async function loader({ params }: LoaderFunctionArgs) {
 
  return null;
}

export default function ChatbotRoute() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const selectedChatbotId = localStorage.getItem('selectedChatbotId');
    if (selectedChatbotId) {
      navigate(`/app/${params.tenant}/g/chatbot/${selectedChatbotId}`);
    } else {
      navigate(`/app/${params.tenant}/dashboard`);
    }
  }, [navigate, params.tenant]);

  return null;
}