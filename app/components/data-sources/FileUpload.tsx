import { useState } from "react";

interface FileUploadProps {
  isUploading: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ isUploading, onFileSelect }: FileUploadProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <label
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
          isUploading ? "opacity-50" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">
              {isUploading ? "Uploading..." : "Click to upload"}
            </span>
            {!isUploading && " or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, TXT up to 10MB
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={onFileSelect}
          accept=".pdf,.doc,.docx,.txt"
          disabled={isUploading}
        />
      </label>
    </div>
  );
} 