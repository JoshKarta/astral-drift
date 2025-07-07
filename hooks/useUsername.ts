"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useUsername() {
  // Use null as initial state instead of undefined
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Run only once on client-side to initialize from localStorage
  useEffect(() => {
    // This will only run in the browser
    const storedUsername = localStorage.getItem("username");
    const storedTimestamp = localStorage.getItem("username_timestamp");

    if (storedUsername && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      // Check if username has expired (older than 1 hour)
      if (now - timestamp > oneHour) {
        // Username has expired, clear it
        localStorage.removeItem("username");
        localStorage.removeItem("username_timestamp");
        setUsername(null);
      } else {
        // Username is still valid
        setUsername(storedUsername);
      }
    } else if (storedUsername) {
      // Username exists but no timestamp, treat as expired
      localStorage.removeItem("username");
      setUsername(null);
    }

    setIsInitialized(true);
  }, []);

  // Handle updates to localStorage when username changes
  useEffect(() => {
    // Only run after initial load and when username changes
    if (isInitialized) {
      if (username) {
        localStorage.setItem("username", username);
        localStorage.setItem("username_timestamp", Date.now().toString());
      } else if (username === null && localStorage.getItem("username")) {
        // Only remove if there was something there before
        localStorage.removeItem("username");
        localStorage.removeItem("username_timestamp");
      }
    }
  }, [username, isInitialized]);

  // Set up periodic check for username expiration
  useEffect(() => {
    if (!isInitialized || !username) return;

    const checkExpiration = () => {
      const storedTimestamp = localStorage.getItem("username_timestamp");
      if (storedTimestamp) {
        const timestamp = parseInt(storedTimestamp, 10);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        if (now - timestamp > oneHour) {
          // Username has expired, clear it
          localStorage.removeItem("username");
          localStorage.removeItem("username_timestamp");
          setUsername(null);
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, username]);

  // Redirect to homepage if username does not exist or is empty
  useEffect(() => {
    if (isInitialized && (username === null || username === "")) {
      router.replace("/");
    }
  }, [username, isInitialized, router]);

  return { username, setUsername };
}
