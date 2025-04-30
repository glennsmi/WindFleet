import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { db } from '../firebaseConfig'; // Import Firestore instance
import { collection, writeBatch, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Vessel } from '../models/vessel'; // Import the Vessel interface
// Import TanStack Table components
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
  Column,
  Table,
} from '@tanstack/react-table'
// Import Debounced Input component (we'll create this)
import DebouncedInput from '../components/DebouncedInput'; 

// Define a ranking filter function for better search results
import { rankItem } from '@tanstack/match-sorter-utils'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)
  // Store the ranking info
  addMeta(itemRank)
  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Reusable Filter component with more specific types
function Filter({ column }: { column: Column<Vessel, unknown> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(value: string | number) => column.setFilterValue(String(value))}
      placeholder={`Filter ${String(column.columnDef.header)}...`}
      className="w-full px-2 py-1 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
    />
  )
}

const RawDataPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // New state for table data and interaction
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Fetch data from Firestore
  const fetchVessels = async () => {
    setIsLoadingData(true);
    setError(null); // Clear previous table errors
    try {
      const vesselsCollection = collection(db, 'Vessels');
      const q = query(vesselsCollection, orderBy("name")); // Default sort by name
      const querySnapshot = await getDocs(q);
      const vesselsData = querySnapshot.docs.map(doc => ({
        // id: doc.id, // Optionally include document ID
        ...(doc.data() as Vessel)
      }));
      setVessels(vesselsData);
    } catch (fetchError: any) {
      console.error("Error fetching vessel data: ", fetchError);
      setError(`Failed to fetch vessel data: ${fetchError.message}`);
      setVessels([]); // Clear data on error
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchVessels();
  }, []);

  // Define table columns using useMemo for performance
  const columns = useMemo<ColumnDef<Vessel>[]>(() => [
    { accessorKey: 'series', header: 'Series', cell: info => info.getValue(), enableSorting: true, enableColumnFilter: false },
    { 
      accessorKey: 'name', 
      header: 'Name', 
      cell: info => info.getValue(), 
      enableSorting: true, 
      enableColumnFilter: true,
      size: 100, // Set max width (adjust value as needed)
      maxSize: 100, // Set max width (adjust value as needed)
    },
    { accessorKey: 'category', header: 'Category', cell: info => info.getValue(), enableSorting: true, enableColumnFilter: true },
    { accessorKey: 'designer', header: 'Designer', cell: info => info.getValue() ?? 'N/A', enableSorting: true, enableColumnFilter: true },
    { accessorKey: 'owner', header: 'Owner', cell: info => info.getValue(), enableSorting: true, enableColumnFilter: true },
    { accessorKey: 'delivery', header: 'Delivery', cell: info => info.getValue(), enableSorting: true, enableColumnFilter: true },
    { accessorKey: 'status', header: 'Status', cell: info => info.getValue(), enableSorting: true, enableColumnFilter: true },
  ], []);

  // Create table instance
  const table = useReactTable({
    data: vessels,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // debugTable: true,
  });

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    setSuccessMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === 'text/csv') {
        setFile(e.dataTransfer.files[0]);
      } else {
        setError('Invalid file type. Please upload a CSV file.');
      }
    }
  }, []);

  // Handle file selection via input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'text/csv') {
        setFile(e.target.files[0]);
      } else {
        setError('Invalid file type. Please upload a CSV file.');
        setFile(null);
      }
      e.target.value = ""; // Reset input value
    }
  };

  // Parse CSV and upload to Firestore
  const handleUpload = () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccessMessage(null);

    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.toLowerCase().trim(),
      complete: async (results) => {
        setIsParsing(false);
        const vesselsData: Vessel[] = [];
        const errors: string[] = [];

        // Required headers should now also be lowercase for consistent comparison
        const requiredHeaders: (keyof Vessel)[] = ['series', 'name', 'category', /*'designer', // Removed designer as it is optional */ 'owner', 'delivery', 'status'];
        const actualHeaders = results.meta.fields || []; // PapaParse headers are now lowercase

        // Validation logic remains largely the same, but uses lowercase keys for row access
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setError(`CSV validation failed. Missing required headers: ${missingHeaders.join(', ')}`);
          setFile(null);
          return;
        }

        results.data.forEach((row, index) => {
          // Access row data using lowercase keys
          const seriesNum = parseInt(row.series, 10);
          if (isNaN(seriesNum)) {
            errors.push(`Row ${index + 2}: Invalid 'series' value '${row.series}'. Must be a number.`);
            return; // Skip this row
          }

          // Use CSV value for designer if present and non-empty, otherwise use null
          const designerValue = row.designer?.toString().trim();

          const vessel: Vessel = { // Can now potentially type as Vessel directly
            series: seriesNum,
            name: row.name?.toString() || '',
            category: row.category?.toString() || '',
            designer: designerValue ? designerValue : null, // Assign value or null
            owner: row.owner?.toString() || '',
            delivery: row.delivery?.toString() || '',
            status: row.status?.toString() || '',
          };

          // Check for empty required string fields (designer is handled)
          if (!vessel.name || !vessel.category || !vessel.owner || !vessel.delivery || !vessel.status) {
             errors.push(`Row ${index + 2}: Contains empty required fields.`);
             return; // Skip this row
          }

          vesselsData.push(vessel); // Add the vessel object
        });

        if (errors.length > 0) {
           setError(`Found ${errors.length} validation error(s) in CSV: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`);
           setFile(null);
           return;
        }

        if (vesselsData.length === 0) {
          setError('No valid vessel data found in the CSV file.');
          setFile(null);
          return;
        }

        // Upload to Firestore using batch write
        setIsUploading(true);
        const batch = writeBatch(db);
        const vesselsCollection = collection(db, 'Vessels');

        vesselsData.forEach((vesselData) => {
          // Use vessel name or a generated ID as the document ID
          // Using name might cause issues if names aren't unique. Consider generating unique IDs.
          const docRef = doc(vesselsCollection, vesselData.name.replace(/\s+/g, '-').toLowerCase()); // Simple ID from name
          batch.set(docRef, vesselData);
        });

        try {
          await batch.commit();
          setSuccessMessage(`Successfully uploaded ${vesselsData.length} vessel records.`);
          setFile(null);
          fetchVessels(); // Refresh table data!
        } catch (uploadError: any) {
          console.error("Error writing batch to Firestore: ", uploadError);
          setError(`Firestore upload failed: ${uploadError.message}`);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error: Error) => {
        setIsParsing(false);
        console.error('Error parsing CSV:', error);
        setError(`CSV parsing failed: ${error.message}`);
        setFile(null);
      }
    });
  };

  // Adjust estimated height for sticky header offset
  const filterBarHeight = '3.75rem'; // Approx 60px (adjust if needed)

  return (
    <div className="p-4 md:p-8">
      {/* --- Upload Section --- */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-dark">Upload Raw Ship Data (CSV)</h1>
        {/* Drag and Drop Area */}
        <div
            className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ease-in-out 
                        ${dragActive ? 'border-primary bg-teal-light/10' : 'border-gray-300 hover:border-gray-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
              type="file"
              id="file-upload"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden" // Hide the default input
            />
            <label
              htmlFor="file-upload" // Link label to hidden input
              className={`cursor-pointer ${dragActive ? 'text-primary' : 'text-gray-600'}`}
            >
              <p className="mb-2">Drag & drop your CSV file here</p>
              <p className="text-sm mb-4">or</p>
              <span className="font-semibold text-primary hover:underline">
                Choose a file
              </span>
            </label>
        </div>
        {/* File Info & Upload Button */}
        {file && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 flex items-center justify-between space-x-4">
            <span className="text-sm font-medium text-neutral-dark truncate">{file.name}</span>
            <button
              onClick={handleUpload}
              disabled={isParsing || isUploading}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-teal-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isParsing ? 'Parsing...' : isUploading ? 'Uploading...' : 'Upload to WindFleet'}
            </button>
            </div>
        )}
        {/* Status Messages */} 
        {error && (
            <p className="mt-4 text-sm text-accent-coral bg-red-100 p-3 rounded-md">{error}</p>
        )}
        {successMessage && (
            <p className="mt-4 text-sm text-green-700 bg-green-100 p-3 rounded-md">{successMessage}</p>
        )}
      </div>

      {/* --- Data Table Section --- */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-dark mb-4">Current Vessel Data</h2>

        {/* Sticky Filter Section Wrapper */}
        <div className="sticky top-0 z-20 bg-neutral-light py-4 mb-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
                {/* Global Search */}
                <div className="flex-grow min-w-[200px]">
                    <label htmlFor="globalSearch" className="sr-only">Global Search</label>
                    <DebouncedInput
                      id="globalSearch"
                      value={globalFilter ?? ''}
                      onChange={(value: string | number) => setGlobalFilter(String(value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Search all columns..."
                    />
                </div>
                {/* Column Filters */}
                {table.getHeaderGroups().map(headerGroup => (
                    headerGroup.headers.map(header => (
                    header.column.getCanFilter() ? (
                        <div key={header.id} className="flex-grow min-w-[150px]">
                            <label htmlFor={header.id} className="sr-only">Filter {String(header.column.columnDef.header)}</label> 
                            <Filter column={header.column as Column<Vessel, unknown>} /> 
                        </div>
                    ) : null
                    ))
                ))}
            </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white table-fixed">
            {/* Sticky Header - update top style */}
            <thead className="sticky z-10" style={{ top: filterBarHeight }}> 
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      scope="col"
                      // Remove sticky top-0 from th, keep bg-gray-50
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none bg-gray-50"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: `${header.getSize()}px` }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          ) as React.ReactNode}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingData ? (
                <tr><td colSpan={columns.length} className="text-center p-4">Loading data...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center p-4 text-gray-500">No data available{globalFilter || columnFilters.length > 0 ? ' matching filter(s)' : ''}.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RawDataPage; 