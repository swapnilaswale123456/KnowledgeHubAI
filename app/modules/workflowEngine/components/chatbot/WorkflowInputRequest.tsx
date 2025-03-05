import { useState } from "react";
import { Form } from "@remix-run/react";

interface WorkflowInputRequestProps {
  executionId: string;
  message: string;
  inputType: string;
  options?: Record<string, string>;
  onSubmit: (input: string) => void;
}

export default function WorkflowInputRequest({
  executionId,
  message,
  inputType,
  options = {},
  onSubmit,
}: WorkflowInputRequestProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-gray-700">{message}</div>

      <Form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="executionId" value={executionId} />

        {inputType === "text" && (
          <input
            type="text"
            name="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Type your response..."
            required
          />
        )}

        {inputType === "number" && (
          <input
            type="number"
            name="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Enter a number..."
            required
          />
        )}

        {inputType === "boolean" && (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setInput("true");
                onSubmit("true");
              }}
              className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setInput("false");
                onSubmit("false");
              }}
              className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              No
            </button>
          </div>
        )}

        {inputType === "options" && Object.keys(options).length > 0 && (
          <div className="space-y-2">
            <select
              name="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select an option...</option>
              {Object.entries(options).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {inputType !== "boolean" && (
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Submit
          </button>
        )}
      </Form>
    </div>
  );
} 