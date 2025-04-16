"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsername } from "@/hooks/useUsername";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  const { username, setUsername } = useUsername();
  const [input, setInput] = useState("");
  const [dialogType, setDialogType] = useState<"create" | "join" | null>(null);

  const handleSubmit = () => {
    if (input.trim()) {
      setUsername(input.trim());
      setInput("");
    }
  };

  return (
    <main className="flex w-full mx-auto h-dvh justify-center items-center">
      {!username ? (
        <Card>
          <CardContent>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter username"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button onClick={handleSubmit} className="mt-2 w-full">
              Save
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-[300px] md:w-[500px] gap-4">
          <CardHeader>
            <CardTitle className="font-normal text-center">
              Hi, <span className="font-medium">{username}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-center">
              Would you like to create or join a playground ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <div className="flex gap-2 items-center justify-center">
                <DialogTrigger asChild>
                  <Button onClick={() => setDialogType("create")}>
                    Create
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    variant={"outline"}
                    onClick={() => setDialogType("join")}
                  >
                    Join
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {dialogType === "create"
                      ? "Create Playground"
                      : "Join Playground"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogType === "create"
                      ? "Create a new playground session."
                      : "Enter a playground code to join an existing session."}
                  </DialogDescription>
                </DialogHeader>
                {dialogType === "create" ? (
                  // Create playground form content
                  <div>Create content here</div>
                ) : (
                  // Join playground form content
                  <div>Join content here</div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
