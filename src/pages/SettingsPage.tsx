import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig'; // Import auth and db
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { User } from 'firebase/auth'; // Import User type

// Define an interface for the settings structure
interface AppSettings {
  availabilityDays: number;
  requiredConstructionDays: number;
  vesselUtilization: number;
  turbinesPerMaintenanceVessel: number;
}

// Interface for user profile data
interface UserProfile {
  firstName: string;
  lastName: string;
}

const SettingsPage: React.FC = () => {
  // State for user profile
  const [profile, setProfile] = useState<UserProfile>({ firstName: '', lastName: '' });
  // State for settings (use AppSettings type)
  const [settings, setSettings] = useState<Partial<AppSettings>>({ // Use partial initially
    availabilityDays: undefined, // Start undefined until loaded
    requiredConstructionDays: 15, // Default
    vesselUtilization: 80, // Default
    turbinesPerMaintenanceVessel: 75, // Default
  });
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update current user state on auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (!user) {
        // Handle case where user logs out while on settings page (optional)
        setError("User not logged in.");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user profile and settings on load
  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Load profile fields
            setProfile({
                firstName: data.firstName || '', // Default to empty string if not set
                lastName: data.lastName || '',
            });
            // Load app settings
            if (data.appSettings) {
                const loadedSettings = data.appSettings as AppSettings;
                setSettings(prev => ({ ...prev, ...loadedSettings }));
            }
          } else {
            console.log("No user document found, using defaults.");
          }
        } catch (err: any) {
          console.error("Error fetching user data:", err);
          setError(`Failed to load data: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Handler for profile input changes
  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSuccessMessage(null); 
    setError(null);
  };

  // Handler for settings input changes
  const handleSettingsChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    setSuccessMessage(null);
    setError(null);
  };

  // Save profile and settings handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to save.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const userDocRef = doc(db, 'users', currentUser.uid);

    const settingsToSave: AppSettings = {
      availabilityDays: Number(settings.availabilityDays) || 0,
      requiredConstructionDays: Number(settings.requiredConstructionDays) || 0,
      vesselUtilization: Number(settings.vesselUtilization) || 0,
      turbinesPerMaintenanceVessel: Number(settings.turbinesPerMaintenanceVessel) || 0,
    };

    // Combine profile and settings for saving
    const dataToSave = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        appSettings: settingsToSave,
    }

    try {
      // Use setDoc with merge: true to update/create the user document
      await setDoc(userDocRef, dataToSave, { merge: true });
      setSuccessMessage("Profile and settings saved successfully!");
    } catch (err: any) {
      console.error("Error saving data:", err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Construct full name for display
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'User';

  // Render loading state
  if (isLoading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }
  // Render error if user logged out somehow
  if (!currentUser && !isLoading) {
     return <div className="p-8 text-center text-accent-coral">Error: User not logged in.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto"> 
      {/* Display User Name */}
      <h1 className="text-2xl font-semibold text-neutral-dark mb-2">
        Settings for <span className="text-primary">{fullName}</span>
      </h1>
      <p className="text-sm text-gray-600 mb-6">Manage your profile and application settings.</p>

      <form onSubmit={handleSave} className="space-y-8 bg-white p-6 rounded-lg shadow">
        {/* Profile Section */}
        <fieldset className="space-y-4">
            <legend className="text-lg font-medium text-neutral-dark border-b pb-2 mb-4">User Profile</legend>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-dark">First Name</label>
              <input
                type="text"
                id="firstName"
                value={profile.firstName}
                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
             <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-dark">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={profile.lastName}
                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
        </fieldset>

        {/* Application Settings Section */}
        <fieldset className="space-y-4">
             <legend className="text-lg font-medium text-neutral-dark border-b pb-2 mb-4">Application Settings</legend>
             {/* Availability Days */}
            <div>
              <label htmlFor="availabilityDays" className="block text-sm font-medium text-neutral-dark">
                Vessel Availability (Days)
              </label>
              <p className="text-xs text-gray-500 mb-1">Vessel time available for building turbines.</p>
              <input
                type="number"
                id="availabilityDays"
                value={settings.availabilityDays ?? ''}
                onChange={(e) => handleSettingsChange('availabilityDays', e.target.value)}
                placeholder="e.g., 300"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
            {/* Required Construction Days */}
            <div>
              <label htmlFor="requiredConstructionDays" className="block text-sm font-medium text-neutral-dark">
                Required Turbine Construction Days
              </label>
               <p className="text-xs text-gray-500 mb-1">Industry standard days needed per turbine construction.</p>
              <input
                type="number"
                id="requiredConstructionDays"
                value={settings.requiredConstructionDays ?? ''}
                onChange={(e) => handleSettingsChange('requiredConstructionDays', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
            {/* Vessel Utilization */}
            <div>
              <label htmlFor="vesselUtilization" className="block text-sm font-medium text-neutral-dark">
                Vessel Utilization (%)
              </label>
               <p className="text-xs text-gray-500 mb-1">Target operational utilization percentage.</p>
              <input
                type="number"
                id="vesselUtilization"
                value={settings.vesselUtilization ?? ''}
                min="0"
                max="100"
                onChange={(e) => handleSettingsChange('vesselUtilization', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
            {/* Turbines per Maintenance Vessel */}
            <div>
              <label htmlFor="turbinesPerMaintenanceVessel" className="block text-sm font-medium text-neutral-dark">
                Turbines per Maintenance Vessel
              </label>
               <p className="text-xs text-gray-500 mb-1">Number of turbines assigned per maintenance vessel.</p>
              <input
                type="number"
                id="turbinesPerMaintenanceVessel"
                value={settings.turbinesPerMaintenanceVessel ?? ''}
                min="1"
                onChange={(e) => handleSettingsChange('turbinesPerMaintenanceVessel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={isSaving}
              />
            </div>
        </fieldset>

        {/* Status Messages */}
        <div className="pt-2 space-y-2">
            {error && (
                <p className="text-sm text-accent-coral">Error: {error}</p>
            )}
            {successMessage && (
                <p className="text-sm text-green-700">{successMessage}</p>
            )}
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end"> {/* Aligned button right */}
           <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-teal-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage; 