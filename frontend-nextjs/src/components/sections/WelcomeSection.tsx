import React from 'react';
import { Upload, Image, Lightbulb } from 'lucide-react';
import Button from '@/components/ui/Button';

const WelcomeSection: React.FC = () => {
  const scrollToUpload = () => {
    const uploadSection = document.querySelector('#upload-section');
    uploadSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGallery = () => {
    const gallerySection = document.querySelector('#gallery-section');
    gallerySection?.scrollIntoView({ behavior: 'smooth' });
  };

  const showTips = () => {
    // TODO: Implement tips modal
    console.log('Show tips modal');
  };

  return (
    <section className="card p-8 mb-8">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Welcome to MediaMix Hub
            </h1>
            <p className="text-lg text-gray-600">
              Your creative media workspace for organizing, managing, and sharing your digital content.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={scrollToUpload}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Files</span>
            </Button>
            
            <Button
              onClick={scrollToGallery}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Image className="w-5 h-5" />
              <span>View Gallery</span>
            </Button>
            
            <Button
              onClick={showTips}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Lightbulb className="w-5 h-5" />
              <span>Get Tips</span>
            </Button>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Image className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;