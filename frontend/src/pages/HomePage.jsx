import React from 'react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Glade</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            This is your social media feed. Posts will appear here once you start following people.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
