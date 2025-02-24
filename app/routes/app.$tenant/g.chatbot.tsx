import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getSelectedChatbot } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const isEmbedded = url.searchParams.get("embedded") === "true";

  // Allow embedded access without auth
  if (isEmbedded) {
    return null;
  }

  // Regular auth flow
  const selectedChatbot = await getSelectedChatbot(request);
  if (!selectedChatbot && !params.id) {
    throw redirect(`/app/${params.tenant}/dashboard`);
  }
  return null;
};

export default function ChatbotRoute() {
  return <Outlet />;
}