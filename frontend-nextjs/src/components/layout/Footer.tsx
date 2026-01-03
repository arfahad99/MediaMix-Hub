import React from 'react';
import { Heart, Github, Mail, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="ml-2 text-lg font-display font-bold text-gray-900">
                MediaMix Hub
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              Your personal media management solution. Upload, organize, and manage your images, videos, and audio files with ease.
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              <span>for better media management</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => {
                    const uploadSection = document.querySelector('#upload-section');
                    uploadSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Upload Files
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const gallerySection = document.querySelector('#gallery-section');
                    gallerySection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  View Gallery
                </button>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Help & Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:support@mediamixhub.com" 
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Support
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              © {currentYear} MediaMix Hub. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;