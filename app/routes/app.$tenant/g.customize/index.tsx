import { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import { useEffect } from "react";

export default function CustomizeIndex() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const selectedChatbotId = localStorage.getItem('selectedChatbotId');
    if (selectedChatbotId) {
      navigate(`/app/${params.tenant}/g/customize/${selectedChatbotId}`);
    } else {
      navigate(`/app/${params.tenant}/dashboard`);
    }
  }, [navigate, params.tenant]);

  return null;
} 