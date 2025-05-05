import { useNavigate, useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { PlanFeatureUsageDto } from "~/application/dtos/subscriptions/PlanFeatureUsageDto";
import { SerializeFrom } from "@remix-run/node";

interface Props {
  feature: SerializeFrom<PlanFeatureUsageDto> | undefined;
  children: React.ReactNode;
  hideContent?: boolean;
}

export default function CheckResearchRequestLimit({ feature, children, hideContent = true }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!feature?.enabled) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upgrade Required</h3>
          <p className="text-sm text-gray-500 mb-4">
            {feature?.message || "You've reached your plan's limit for research requests. Upgrade your plan to create more research requests."}
          </p>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/app/${params.tenant}/dashboard`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => navigate(`/app/${params.tenant}/settings/subscription`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 