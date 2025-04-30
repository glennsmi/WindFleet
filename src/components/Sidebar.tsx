import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Import useNavigate
import { auth } from '../firebaseConfig'; // Import Firebase auth instance
import { signOut } from 'firebase/auth'; // Import signOut function
// Import icons
import { MdDashboard, MdDirectionsBoat, MdSettings, MdLogout } from 'react-icons/md';

const Sidebar: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate

  // Updated link class to handle flex layout with icon
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded hover:bg-teal-light ${isActive ? 'bg-teal-light font-semibold' : ''}`;

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optional: Show error message to the user
    }
  };

  return (
    // Sidebar container - removed p-4 to allow full height/width for internal elements
    <div className="h-screen bg-primary text-white w-64 flex flex-col">
      {/* Logo and Name section */}
      <div className="p-4 flex items-center border-b border-teal-light/30">
        {/* Logo background wrapper */}
        <div className="p-1 bg-gray-200 rounded mr-3 flex-shrink-0">
          <img src="/WindFleet Logo SVG.svg" alt="WindFleet Logo" className="w-8 h-8" />
        </div>
        {/* App Name - using standard bold font */}
        <h1 className="text-xl font-bold font-sans truncate">WindFleet</h1>
      </div>
      
      {/* Navigation - added padding */}
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-2"> {/* Add spacing between list items */}
          <li>
            <NavLink to="/" className={linkClass} end> {/* `end` prevents matching nested routes */}
              <MdDashboard className="mr-3" size={20} /> {/* Icon + margin */}
              Dashboard
            </NavLink>
          </li>
          <li> {/* Removed mt-2, using space-y on ul now */}
            <NavLink to="/raw-data" className={linkClass}>
              <MdDirectionsBoat className="mr-3" size={20} /> {/* Changed Icon */}
              Raw Ship Data
            </NavLink>
          </li>
          {/* Add more main navigation items here */}
        </ul>
      </nav>

      {/* Bottom section - added padding and border */}
      <div className="p-4 border-t border-teal-light/30 space-y-2"> {/* Add spacing */}
        <NavLink to="/settings" className={linkClass}>
          <MdSettings className="mr-3" size={20} /> {/* Icon + margin */}
          Settings
        </NavLink>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          // Updated button class for flex layout
          className="flex items-center w-full text-left px-4 py-2 rounded hover:bg-teal-light focus:outline-none focus:bg-teal-light"
        >
          <MdLogout className="mr-3" size={20} /> {/* Icon + margin */}
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 