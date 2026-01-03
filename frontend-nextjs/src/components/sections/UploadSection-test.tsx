import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useMediaStore } from '@/store/mediaStore';

const UploadSection: React.FC = () => {
  const { uploadMedia } = useMediaStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) selected`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) selected`);
    }
  };

  const handleRemoveFile = (index: number) => {
    const removedFile = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast(`Removed ${removedFile.name}`, { icon: 'ℹ️' });
  };

  const handleClearAll = () => {
    if (selectedFiles.length > 0 || description || tags) {
      if (confirm('Are you sure you want to clear all files and form data?')) {
        setSelectedFiles([]);
        setDescription('');
        setTags('');
        toast('Form cleared', { icon: 'ℹ️' });
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload files one by one since backend only supports single file uploads
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        
        // Add single file with correct field name
        formData.append('media', file);
        
        // Add metadata
        formData.append('description', description);
        
        // Parse tags
        const tagArray = tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .slice(0, 10);
        
        formData.append('tags', JSON.stringify(tagArray));

        try {
          await uploadMedia(formData);
          toast.success(`Uploaded: ${file.name}`);
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            toast.error('Authentication failed. Please log in again.');
            // Redirect to login
            window.location.href = '/auth/login';
            return;
          } else {
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
          }
        }
      }
      
      // Clear form on success
      setSelectedFiles([]);
      setDescription('');
      setTags('');
      
      toast.success(`Successfully processed ${selectedFiles.length} file(s)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = selectedFiles.length > 0 && description.trim().length > 0 && !isUploading;

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Upload className="w-6 h-6 mr-2" />
          Upload Media
        </h2>
        <p className="text-gray-600">
          Drag and drop your files or click to browse
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 relative ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            id="file-upload"
          />
          
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          
          <p className="text-gray-600 mb-4">
            Supports images, videos, and audio files up to 50MB
          </p>
          
          <button
            type="button"
            onClick={() => document.getElementById('file-upload')?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
            disabled={isUploading}
          >
            Choose Files
          </button>
          
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
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
        
        {/* Form Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your media files..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <p className={`text-sm ml-auto ${
                description.length > 450 ? 'text-red-600' : 
                description.length > 400 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {description.length}/500
              </p>
            </div>
          </div>
          
          <div>
            <Input
              label="Tags (optional)"
              placeholder="Enter tags separated by commas..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add up to 10 tags to help organize your files
            </p>
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 10).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClearAll}
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          
          <Button
            type="button"
            variant="primary"
            disabled={!canUpload}
            loading={isUploading}
            onClick={handleUpload}
            className="min-w-[140px]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading 
              ? 'Uploading...' 
              : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UploadSection;