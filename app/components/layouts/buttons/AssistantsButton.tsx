import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "~/lib/utils";
import { Search, ChevronDown } from "lucide-react";
import { useAppData } from "~/utils/data/useAppData";

interface ChatbotType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function AssistantsButton() {
  const [searchQuery, setSearchQuery] = useState("");
  const { chatbots = [] } = useAppData() || {};

  const filteredChatbots = chatbots?.filter((chatbot: ChatbotType) =>
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-sm rounded-md transition-colors border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center">
            <span className="text-pink-500 text-[10px]">★</span>
          </div>
          <span>My Assistants</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-50 mt-2 w-64 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Find chatbot..."
                className="w-full rounded-md border border-gray-200 pl-8 pr-4 py-2 text-sm focus:border-gray-300 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-gray-500 mb-2">
                {chatbots?.length > 0 ? `${chatbots.length} Chatbots` : 'No chatbots found'}
              </h3>
              {filteredChatbots.map((chatbot: ChatbotType) => (
                <Menu.Item key={chatbot.id}>
                  {({ active }) => (
                    <button
                      className={cn(
                        "flex w-full items-center px-2 py-1.5 text-sm rounded-md",
                        active ? "bg-gray-50" : ""
                      )}
                      onClick={() => {
                        // Handle chatbot selection
                        console.log("Selected chatbot:", chatbot);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-pink-500 text-xs">★</span>
                        </div>
                        <span className="truncate">{chatbot.name}</span>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 