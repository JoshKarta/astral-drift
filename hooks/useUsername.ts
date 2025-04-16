// src/hooks/useUsername.ts
import { useEffect, useState } from "react";

export function useUsername() {
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );

  useEffect(() => {
    if (username) localStorage.setItem("username", username);
  }, [username]);

  return { username, setUsername };
}
