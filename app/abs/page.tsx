"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

export default function Page() {
  const [counter, setCounter] = React.useState(0);
  const router = useRouter();

  return (
    <>
      <Button
        onClick={() => {
          // setCounter(counter + 1)
          router.push("/playground/123");
        }}
      >
        page
      </Button>
      {counter}
    </>
  );
}
