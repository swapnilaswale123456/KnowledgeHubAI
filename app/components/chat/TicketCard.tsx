import React from "react";

interface TicketInfo {
  id: string;
  title: string;
  status: string;
  assignee: string;
  description: string;
  url: string | null;
  created: string | null;
  updated: string | null;
}

interface TicketCardProps {
  ticketInfo: TicketInfo;
}

export default function TicketCard({ ticketInfo }: TicketCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 max-w-2xl">
      <div className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-medium truncate">{ticketInfo.title}</h3>
        <span className="text-sm bg-blue-600 px-2 py-0.5 rounded-full">{ticketInfo.id}</span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Status:</span> 
            <span className={`ml-1 font-medium ${
              ticketInfo.status.toLowerCase() === "open" || ticketInfo.status.toLowerCase() === "in progress" 
                ? "text-yellow-600" 
                : ticketInfo.status.toLowerCase() === "closed" || ticketInfo.status.toLowerCase() === "done"
                ? "text-green-600"
                : "text-gray-600"
            }`}>
              {ticketInfo.status}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Assignee:</span> 
            <span className="ml-1 font-medium">{ticketInfo.assignee}</span>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4 text-sm whitespace-pre-line">
          {ticketInfo.description.length > 200 
            ? ticketInfo.description.substring(0, 200) + "..." 
            : ticketInfo.description}
        </p>
        
        {ticketInfo.created && (
          <div className="text-xs text-gray-500 mb-1">
            Created: {new Date(ticketInfo.created).toLocaleString()}
          </div>
        )}
        
        {ticketInfo.updated && (
          <div className="text-xs text-gray-500 mb-3">
            Updated: {new Date(ticketInfo.updated).toLocaleString()}
          </div>
        )}
        
        {ticketInfo.url && (
          <a 
            href={ticketInfo.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            View ticket in system →
          </a>
        )}
      </div>
    </div>
  );
} 