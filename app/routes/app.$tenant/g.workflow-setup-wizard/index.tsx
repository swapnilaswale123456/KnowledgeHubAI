import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    title: "Workflow Setup Wizard"
  });
};

export default function WorkflowSetupWizardIndex() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const selectedChatbotId = localStorage.getItem('selectedChatbotId');
    if (selectedChatbotId) {     
      navigate(`/app/${params.tenant}/g/workflow-setup-wizard/${selectedChatbotId}/steps`);
    } else {
      navigate(`/app/${params.tenant}/dashboard`);
    }
  }, [navigate, params.tenant]);

  return null;
} 