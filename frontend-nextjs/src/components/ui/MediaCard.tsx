import React from 'react';
import { Eye, Edit, Trash2, Image, Video, Music, File, Calendar, HardDrive } from 'lucide-react';
import { MediaItem, ViewType } from '@/types';
import { formatFileSize, formatDate, truncateText, cn } from '@/lib/utils';
import Button from './Button';

interface MediaCardProps {
  item: MediaItem;
  view: ViewType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  item,
  view,
  onView,
  onEdit,
  onDelete
}) => {
  const getFileIcon = (fileType: string) => {
    const iconClass = "w-6 h-6";
    switch (fileType) {
      case 'image':
        return <Image className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'audio':
        return <Music className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'bg-blue-100 text-blue-600';
      case 'video':
        return 'bg-purple-100 text-purple-600';
      case 'audio':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (view === 'list') {
    return (
      <div className="card p-4 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center space-x-4">
          {/* File Icon */}
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            getFileTypeColor(item.fileType)
          )}>
            {getFileIcon(item.fileType)}
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {item.fileName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {truncateText(item.description, 100)}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(item.uploadDate)}
              </span>
              <span className="flex items-center">
                <HardDrive className="w-3 h-3 mr-1" />
                {formatFileSize(item.fileSize)}
              </span>
              <span className="capitalize">
                {item.fileType}
              </span>
            </div>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{item.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onView(item.id)}
              className="p-2"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(item.id)}
              className="p-2"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(item.id)}
              className="p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="card hover:shadow-lg transition-all duration-200 group">
      {/* File Preview/Icon */}
      <div className="h-32 bg-gray-100 rounded-t-xl overflow-hidden relative">
        {item.fileType === 'image' ? (
          <img
            src={item.url}
            alt={item.fileName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                target.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = `w-full h-full flex items-center justify-center ${getFileTypeColor(item.fileType)}`;
                fallbackDiv.innerHTML = '<div class="text-4xl opacity-80">🖼️</div>';
                parent.appendChild(fallbackDiv);
              }
            }}
          />
        ) : item.fileType === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <Video className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center',
            getFileTypeColor(item.fileType)
          )}>
            <div className="text-4xl opacity-80">
              {getFileIcon(item.fileType)}
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-2">
          {item.fileName}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncateText(item.description, 80)}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(item.uploadDate)}
            </span>
            <span className="flex items-center">
              <HardDrive className="w-3 h-3 mr-1" />
              {formatFileSize(item.fileSize)}
            </span>
          </div>
          
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{item.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onView(item.id)}
            className="flex-1 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(item.id)}
            className="p-2"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(item.id)}
            className="p-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;