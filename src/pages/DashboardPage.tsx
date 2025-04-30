import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Import db and auth
import { Vessel } from '../models/vessel';
import { User } from 'firebase/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, // Or use BarChart for simple Supply/Demand
} from 'recharts';

// Interface for AppSettings (copy or import if defined elsewhere)
interface AppSettings {
  availabilityDays: number;
  requiredConstructionDays: number;
  vesselUtilization: number;
  turbinesPerMaintenanceVessel: number;
}

const COLORS = ['#1B8094', '#33AAB3', '#F2C14E', '#E07A5F', '#164962', '#2ECC71', '#F4D35E']; // Example colors

const DashboardPage: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoadingVessels, setIsLoadingVessels] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Placeholder state for missing data needed for Supply/Demand
  const [totalPlannedTurbines, setTotalPlannedTurbines] = useState<number | string>(100); // Example default

  // --- Data Fetching ---
  useEffect(() => {
    // Get current user
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch Vessels
    const fetchVessels = async () => {
      setIsLoadingVessels(true);
      try {
        const vesselsCollection = collection(db, 'Vessels');
        const q = query(vesselsCollection);
        const querySnapshot = await getDocs(q);
        const vesselsData = querySnapshot.docs.map(doc => doc.data() as Vessel);
        setVessels(vesselsData);
      } catch (err: any) {
        console.error("Error fetching vessels:", err);
        setError("Failed to load vessel data.");
      } finally {
        setIsLoadingVessels(false);
      }
    };
    fetchVessels();

    // Fetch Settings if user exists
    if (currentUser) {
      const fetchSettings = async () => {
        setIsLoadingSettings(true);
        const userSettingsRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userSettingsRef);
          if (docSnap.exists() && docSnap.data().appSettings) {
            setSettings(docSnap.data().appSettings as AppSettings);
          } else {
            console.log("User settings not found.");
            // Use default settings or show error? For now, calculations might fail silently.
            setSettings({ // Provide defaults if none found
              availabilityDays: 300, // Example default
              requiredConstructionDays: 15,
              vesselUtilization: 80,
              turbinesPerMaintenanceVessel: 75,
            });
          }
        } catch (err: any) {
          console.error("Error fetching settings:", err);
          //setError("Failed to load user settings."); // Optionally show settings load error
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchSettings();
    } else {
      setIsLoadingSettings(false); // No user, no settings to load
    }
  }, [currentUser]); // Refetch settings if user changes


  // --- Data Processing for Charts (using useMemo) ---

  // 1. Bar Chart: Vessel Count by Type and Status
  const countByTypeStatus = useMemo(() => {
    const counts: { [category: string]: { [status: string]: number } } = {};
    vessels.forEach(v => {
      if (!counts[v.category]) counts[v.category] = {};
      counts[v.category][v.status] = (counts[v.category][v.status] || 0) + 1;
    });
    // Flatten for Recharts { category: 'CSOV', Active: 10, Option: 2 }
    return Object.entries(counts).map(([category, statusCounts]) => ({
      category,
      ...statusCounts
    }));
  }, [vessels]);

  // 2. Pie Chart: Vessel Distribution by Category
  const countByCategory = useMemo(() => {
    const counts: { [category: string]: number } = {};
    vessels.forEach(v => {
      counts[v.category] = (counts[v.category] || 0) + 1; // Group by category
    });
    // Keep name/value structure, but name is now category
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vessels]);

  // 3. Stacked Bar Chart: Vessel Delivery Status by Type
  const deliveryStatusByType = useMemo(() => {
    const counts: { [category: string]: { Delivered: number; Due: number } } = {};
    const currentYear = new Date().getFullYear(); // Simple check

    vessels.forEach(v => {
      if (!counts[v.category]) counts[v.category] = { Delivered: 0, Due: 0 };
      // Crude logic: If delivery is a past year number OR status is Active, consider delivered
      // Otherwise (future year, 'Q1 2025', 'Option', 'Under Construction'), consider Due
      const deliveryYear = parseInt(v.delivery, 10);
      const isDelivered = v.status === 'Active' || (!isNaN(deliveryYear) && deliveryYear <= currentYear);

      if (isDelivered) {
        counts[v.category].Delivered += 1;
      } else {
        counts[v.category].Due += 1;
      }
    });
    return Object.entries(counts).map(([category, statusCounts]) => ({
      category,
      ...statusCounts
    }));
  }, [vessels]);

  // 4. Line Chart Data: Supply vs. Demand
  const supplyDemandData = useMemo(() => {
    if (isLoadingSettings || !settings.availabilityDays || !settings.vesselUtilization || !settings.requiredConstructionDays) {
        return []; // Return empty if settings aren't loaded or valid
    }
    const activeCSOVs = vessels.filter(v => v.category === 'CSOV' && v.status === 'Active').length;
    const availableDays = settings.availabilityDays ?? 0;
    const utilization = (settings.vesselUtilization ?? 0) / 100;
    const requiredDays = settings.requiredConstructionDays ?? 0;

    const supply = activeCSOVs * availableDays * utilization;
    const demand = (Number(totalPlannedTurbines) || 0) * requiredDays;

    // For now, just return single data points for a simple bar chart comparison
    return [
      { name: 'Turbine Days', Supply: Math.round(supply), Demand: Math.round(demand) },
    ];
  }, [vessels, settings, totalPlannedTurbines, isLoadingSettings]);


  // --- Render Logic ---
  if (isLoadingVessels) {
    return <div className="p-8 text-center">Loading vessel data...</div>;
  }

  if (error) {
     return <div className="p-8 text-center text-accent-coral">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-semibold text-neutral-dark">Dashboard</h1>

      {/* Grid layout for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Chart 1: Vessel Count by Type and Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-neutral-dark mb-4">Vessel Count by Type & Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countByTypeStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Dynamically generate bars for statuses found */}
              {['Active', 'Under Construction', 'Option'].map((status, index) => (
                 <Bar key={status} dataKey={status} stackId="a" fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Vessel Distribution by Category */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-neutral-dark mb-4">Vessel Distribution by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={countByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {countByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Vessel Delivery Status by Type */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-neutral-dark mb-4">Vessel Delivery Status by Type</h2>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryStatusByType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Delivered" stackId="a" fill={COLORS[5]} />
              <Bar dataKey="Due" stackId="a" fill={COLORS[6]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Supply vs. Demand */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-neutral-dark mb-2">Supply vs. Demand (Turbine Days)</h2>
          <p className="text-xs text-gray-500 mb-4">Based on active CSOVs and current settings.</p>

           {/* Input for missing data */}
           <div className='mb-4'>
             <label htmlFor="plannedTurbines" className="block text-sm font-medium text-neutral-dark mb-1">
                Total Planned Turbines (for Demand Calc):
             </label>
             <input
                type="number"
                id="plannedTurbines"
                value={totalPlannedTurbines}
                onChange={(e) => setTotalPlannedTurbines(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter number"
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
           </div>

           {isLoadingSettings ? <p>Loading settings...</p> : (
             <ResponsiveContainer width="100%" height={250}>
               {/* Using BarChart for simple comparison */}
               <BarChart data={supplyDemandData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100}/>
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Supply" fill={COLORS[0]} />
                  <Bar dataKey="Demand" fill={COLORS[3]} />
               </BarChart>
              {/* Placeholder for potential Line Chart if time-series data becomes available
               <LineChart data={supplyDemandData}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="time_or_scenario" />
                 <YAxis />
                 <Tooltip />
                 <Legend />
                 <Line type="monotone" dataKey="Supply" stroke={COLORS[0]} activeDot={{ r: 8 }} />
                 <Line type="monotone" dataKey="Demand" stroke={COLORS[3]} />
               </LineChart>
              */}
             </ResponsiveContainer>
           )}
        </div>

      </div> {/* End grid */}
    </div>
  );
};

export default DashboardPage; 