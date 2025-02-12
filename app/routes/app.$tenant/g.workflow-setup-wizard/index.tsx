import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import { useEffect } from "react";
import { getSelectedChatbot, setSelectedChatbot ,commitSession} from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const chatbotId = await getSelectedChatbot(request);

  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }

  // Ensure chatbot ID is in session
  const session = await setSelectedChatbot(request, chatbotId);
  
  return redirect(`/app/${params.tenant}/g/workflow-setup-wizard/${chatbotId}/steps`, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  });
};

export default function WorkflowSetupWizardIndex() {
 
  return null;
} 