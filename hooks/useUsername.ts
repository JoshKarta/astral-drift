"use client";
import { useEffect, useState } from "react";

export function useUsername() {
  // Use null as initial state instead of undefined
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Run only once on client-side to initialize from localStorage
  useEffect(() => {
    // This will only run in the browser
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
    setIsInitialized(true);
  }, []);

  // Handle updates to localStorage when username changes
  useEffect(() => {
    // Only run after initial load and when username changes
    if (isInitialized) {
      if (username) {
        localStorage.setItem("username", username);
      } else if (username === null && localStorage.getItem("username")) {
        // Only remove if there was something there before
        localStorage.removeItem("username");
      }
    }
  }, [username, isInitialized]);

  return { username, setUsername };
}
