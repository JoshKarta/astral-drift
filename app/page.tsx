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
import CreatePlaygroundForm from "@/components/forms/CreatePlaygroundForm";
import JoinPlaygroundForm from "@/components/forms/JoinPlaygroundForm";

export default function Page() {
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
    <main className="mx-auto flex h-dvh w-full items-center justify-center">
      {username === null ? (
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
        <Card className="w-[300px] gap-4 md:w-[500px]">
          <CardHeader>
            <CardTitle className="text-center font-normal">
              Hi, <span className="font-medium">{username}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-center">
              Would you like to create or join a playground ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <div className="flex items-center justify-center gap-2">
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
                  <CreatePlaygroundForm />
                ) : (
                  <JoinPlaygroundForm />
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
