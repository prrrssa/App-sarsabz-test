import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom hook for persisting state to window.localStorage.
 * This version uses useEffect to save the state, which is a more robust and standard pattern
 * than trying to save inside the setter function.
 *
 * @param key The key to use for storing the value in localStorage.
 * @param initialValue The initial value to use if nothing is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Get initial value from local storage or use the provided initial value.
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // Use useEffect to update localStorage whenever the state changes.
  // This is the correct, idiomatic way to handle side effects like persistence in React.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
