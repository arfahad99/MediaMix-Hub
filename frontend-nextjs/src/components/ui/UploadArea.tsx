import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, File, Image, Video, Music } from 'lucide-react';
import { cn, validateFiles, formatFileSize } from '@/lib/utils';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  disabled = false,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'audio/*']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const { validFiles, errors } = validateFiles(fileArray);
    
    if (errors.length > 0) {
      console.error('File validation errors:', errors);
    }
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className={cn(
          'w-16 h-16 mx-auto mb-4 transition-colors',
          dragActive ? 'text-blue-500' : 'text-gray-400'
        )} />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {dragActive
            ? 'Drop files here'
            : 'Drop files here or click to browse'
          }
        </h3>
        
        <p className="text-gray-600 mb-4">
          Supports images, videos, and audio files up to 50MB
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">JPG, PNG, GIF</span>
          <span className="bg-gray-100 px-2 py-1 rounded">MP4, WebM, AVI</span>
          <span className="bg-gray-100 px-2 py-1 rounded">MP3, WAV, OGG</span>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-gray-500">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;