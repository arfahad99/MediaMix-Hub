import React, { useState } from 'react';
import { Image, Grid, List, Filter, Search, SortAsc, Music } from 'lucide-react';
import { useMediaStore } from '@/store/mediaStore';
import { FilterType, SortType, MediaItem } from '@/types';
import { debounce } from '@/lib/utils';
import Button from '@/components/ui/Button';
import MediaCard from '@/components/ui/MediaCard';
import Modal from '@/components/ui/Modal';

// Edit Media Form Component
interface EditMediaFormProps {
  item: MediaItem;
  onClose: () => void;
}

const EditMediaForm: React.FC<EditMediaFormProps> = ({ item, onClose }) => {
  const { updateMedia } = useMediaStore();
  const [description, setDescription] = useState(item.description);
  const [tags, setTags] = useState(item.tags.join(', '));
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateMedia(item.id, {
        description: description.trim(),
        tags: tags
      });
      onClose();
    } catch (error) {
      console.error('Failed to update media:', error);
      alert('Failed to update media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          required
        />
      </div>
      
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tag1, tag2, tag3"
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

// Delete Media Confirm Component
interface DeleteMediaConfirmProps {
  item: MediaItem;
  onClose: () => void;
}

const DeleteMediaConfirm: React.FC<DeleteMediaConfirmProps> = ({ item, onClose }) => {
  const { deleteMedia } = useMediaStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      await deleteMedia(item.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Are you sure you want to delete this file?</p>
      <p className="font-medium text-gray-900">{item.fileName}</p>
      <p className="text-sm text-red-600">This action cannot be undone.</p>
      
      <div className="flex space-x-3 pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
};

const GallerySection: React.FC = () => {
  const {
    filteredItems,
    currentView,
    currentFilter,
    currentSort,
    searchQuery,
    setView,
    setFilter,
    setSort,
    setSearchQuery
  } = useMediaStore();

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewModalId, setViewModalId] = useState<string | null>(null);
  const [editModalId, setEditModalId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (filter: FilterType) => {
    setFilter(filter);
    setShowFilterMenu(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortType);
  };

  const filterOptions = [
    { value: 'all', label: 'All Files', icon: '🌐' },
    { value: 'image', label: 'Images', icon: '🖼️' },
    { value: 'video', label: 'Videos', icon: '🎥' },
    { value: 'audio', label: 'Audio', icon: '🎵' }
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'size-desc', label: 'Largest First' },
    { value: 'size-asc', label: 'Smallest First' }
  ];

  const selectedItem = filteredItems.find(item => 
    item.id === viewModalId || item.id === editModalId || item.id === deleteModalId
  );

  return (
    <section id="gallery-section" className="card p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2 flex items-center">
            <Image className="w-6 h-6 mr-2" />
            Media Gallery
          </h2>
          <div className="text-sm text-gray-600">
            <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
            {currentFilter !== 'all' && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {filterOptions.find(f => f.value === currentFilter)?.label}
              </span>
            )}
            {searchQuery && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Search: "{searchQuery}"
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Controls */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-md transition-all ${
                currentView === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-all ${
                currentView === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filter Button */}
          <div className="relative">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            
            {showFilterMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange(option.value as FilterType)}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                        currentFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="mr-3">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files by name, description, or tags..."
              defaultValue={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <SortAsc className="w-4 h-4 text-gray-500" />
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Gallery Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No matching files found' : 'No media files yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? `No files match your search for "${searchQuery}". Try different keywords or clear the search.`
              : 'Upload your first image, video, or audio file to get started!'
            }
          </p>
          {!searchQuery && (
            <Button 
              variant="primary"
              onClick={() => {
                const uploadSection = document.querySelector('#upload-section');
                uploadSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Upload Your First File
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${
          currentView === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MediaCard
                item={item}
                view={currentView}
                onView={setViewModalId}
                onEdit={setEditModalId}
                onDelete={setDeleteModalId}
              />
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={!!viewModalId}
        onClose={() => setViewModalId(null)}
        title={selectedItem ? `View: ${selectedItem.fileName}` : 'View Media'}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Media Preview */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {selectedItem.fileType === 'image' ? (
                <div className="flex justify-center p-4">
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.fileName}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-center p-8 text-gray-500">
                            <p>Unable to load image preview</p>
                            <p class="text-sm mt-2">File: ${selectedItem.fileName}</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : selectedItem.fileType === 'video' ? (
                <div className="p-4">
                  <video
                    src={selectedItem.url}
                    controls
                    className="w-full max-h-96 rounded-lg"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : selectedItem.fileType === 'audio' ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8" />
                  </div>
                  <audio
                    src={selectedItem.url}
                    controls
                    className="w-full max-w-md mx-auto"
                    preload="metadata"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>Preview not available for this file type</p>
                  <p className="text-sm mt-2">File: {selectedItem.fileName}</p>
                </div>
              )}
            </div>
            
            {/* File Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 capitalize">{selectedItem.fileType}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Size:</span>
                <span className="ml-2">{(selectedItem.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Upload Date:</span>
                <span className="ml-2">{new Date(selectedItem.uploadDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">MIME Type:</span>
                <span className="ml-2">{selectedItem.mimeType}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="mt-1 text-gray-600">{selectedItem.description || 'No description provided'}</p>
              </div>
              {selectedItem.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedItem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Download Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="primary"
                onClick={() => {
                  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'}/media/${selectedItem.id}/download`;
                  window.open(downloadUrl, '_blank');
                }}
              >
                Download File
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editModalId}
        onClose={() => setEditModalId(null)}
        title={selectedItem ? `Edit: ${selectedItem.fileName}` : 'Edit Media'}
      >
        {selectedItem && <EditMediaForm item={selectedItem} onClose={() => setEditModalId(null)} />}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModalId}
        onClose={() => setDeleteModalId(null)}
        title="Delete Media"
        size="sm"
      >
        {selectedItem && <DeleteMediaConfirm item={selectedItem} onClose={() => setDeleteModalId(null)} />}
      </Modal>
    </section>
  );
};

export default GallerySection;