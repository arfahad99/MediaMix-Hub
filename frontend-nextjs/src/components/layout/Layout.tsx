import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import ToastContainer from '../ui/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'MediaMix Hub',
  description = 'Your Creative Media Workspace'
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <ToastContainer />
      </div>
    </>
  );
};

export default Layout;