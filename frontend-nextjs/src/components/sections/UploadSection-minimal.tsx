import React, { useState } from 'react';
import { CloudUpload } from 'lucide-react';

const UploadSection: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <CloudUpload className="w-6 h-6 mr-2" />
          Upload Media
        </h2>
        <p className="text-gray-600">
          Select your files to upload
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          className="mb-4"
        />
        
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadSection;