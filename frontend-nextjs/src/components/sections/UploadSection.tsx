import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMediaStore } from '@/store/mediaStore';
import { UploadFormData } from '@/types';
import { validateDescription, parseTags, validateTags } from '@/lib/utils';
import UploadArea from '@/components/ui/UploadArea';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const UploadSection: React.FC = () => {
  const { uploadMedia, isLoading } = useMediaStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<UploadFormData>();
  
  const description = watch('description', '');
  const tags = watch('tags', '');

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleRemoveFile = (index: number) => {
    const removedFile = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info(`Removed ${removedFile.name}`);
  };

  const handleClearAll = () => {
    if (selectedFiles.length > 0 || description || tags) {
      if (confirm('Are you sure you want to clear all files and form data?')) {
        setSelectedFiles([]);
        reset();
        toast.info('Form cleared');
      }
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (!validateDescription(data.description)) {
      toast.error('Description is required and must be between 1-500 characters');
      return;
    }

    const tagArray = parseTags(data.tags);
    if (!validateTags(tagArray)) {
      toast.error('Invalid tags format or too many tags (max 10)');
      return;
    }

    setIsUploading(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Upload files one by one since backend expects single file uploads
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          
          // Add single file with correct field name 'media'
          formData.append('media', file);
          
          // Add metadata
          formData.append('description', data.description);
          formData.append('tags', JSON.stringify(tagArray));

          await uploadMedia(formData);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failCount++;
        }
      }
      
      // Clear form on success
      if (successCount > 0) {
        setSelectedFiles([]);
        reset();
      }
      
      if (failCount === 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      } else if (successCount > 0) {
        toast.success(`Uploaded ${successCount} file(s), ${failCount} failed`);
      } else {
        toast.error('All uploads failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = selectedFiles.length > 0 && description.trim().length > 0 && !isUploading;

  return (
    <section id="upload-section" className="card p-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Upload className="w-6 h-6 mr-2" />
          Upload Media
        </h2>
        <p className="text-gray-600">
          Drag and drop your files or click to browse
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Upload Area */}
        <UploadArea
          onFilesSelected={handleFilesSelected}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          disabled={isUploading}
        />
        
        {/* Form Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', { 
                required: 'Description is required',
                maxLength: { value: 500, message: 'Description must be less than 500 characters' }
              })}
              placeholder="Describe your media files..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
            />
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
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
              {...register('tags')}
              error={errors.tags?.message}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add up to 10 tags to help organize your files
            </p>
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {parseTags(tags).slice(0, 10).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {parseTags(tags).length > 10 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    Only first 10 tags will be saved
                  </span>
                )}
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
            type="submit"
            variant="primary"
            disabled={!canUpload}
            loading={isUploading}
            className="min-w-[140px]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading 
              ? 'Uploading...' 
              : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </form>
    </section>
  );
};

export default UploadSection;