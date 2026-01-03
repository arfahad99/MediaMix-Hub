import React from 'react';
import { FileText, HardDrive, Upload } from 'lucide-react';
import { useMediaStore } from '@/store/mediaStore';
import { formatFileSize } from '@/lib/utils';

const StatsSection: React.FC = () => {
  const { stats } = useMediaStore();

  const statsData = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Total Files',
      value: stats?.total.totalFiles || 0,
      color: 'blue'
    },
    {
      icon: <HardDrive className="w-6 h-6" />,
      title: 'Storage Used',
      value: formatFileSize(stats?.total.totalSize || 0),
      color: 'purple'
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Recent Uploads',
      value: stats?.recentUploads || 0,
      color: 'green'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
              {stat.icon}
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">
                {stat.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default StatsSection;