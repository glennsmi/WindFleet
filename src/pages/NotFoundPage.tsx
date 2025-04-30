import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    // Primary background, centered content
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-white p-4">
      {/* White content box */}
      <div className="bg-white text-neutral-dark p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {/* Using PNG logo as used in Login/Signup */}
          <img src="/windfleet logo.png" alt="WindFleet Logo" className="w-24 h-24" /> 
        </div>
        
        {/* Message */}
        <h1 className="text-2xl font-semibold mb-2">Entering Stormy Waters...</h1>
        <p className="text-lg text-gray-600 mb-8">Page Not Found (404)</p>

        {/* Link back home */}
        <Link 
          to="/" 
          className="inline-block px-6 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-teal-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 