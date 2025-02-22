import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import EmbedAndIntegrateContent from "~/components/embed/EmbedAndIntegrateContent";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

interface LoaderData {
  chatbot: {
    id: string;
    uniqueUrl: string;
  };
  title: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  
  return json({
    chatbot: {
      id: chatbot?.id,
      uniqueUrl: chatbot?.uniqueUrl
    },
    title: "Embed and Integrate"
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Embed and Integrate" }
];

export default function EmbedAndIntegrate() {
  const { chatbot } = useLoaderData<LoaderData>();
  
  return (
    <EmbedAndIntegrateContent 
      chatbotId={chatbot.id} 
      uniqueUrl={chatbot.uniqueUrl} 
    />
  );
}



