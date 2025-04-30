import React, { useState, useEffect } from 'react';

// Helper component for debounced input
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300, // Debounce time in ms
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <input {...props} value={value} onChange={(e) => setValue(e.target.value)} />
  );
}

export default DebouncedInput; 