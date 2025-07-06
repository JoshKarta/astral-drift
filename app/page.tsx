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
import { Edit2 } from "lucide-react";

export default function Page() {
  const { username, setUsername } = useUsername();
  const [input, setInput] = useState("");
  const [dialogType, setDialogType] = useState<"create" | "join" | null>(null);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      setUsername(input.trim());
      setInput("");
    }
  };

  const handleChangeUsername = () => {
    setIsChangingUsername(true);
    setNewUsername(username || "");
  };

  const handleSaveNewUsername = () => {
    if (newUsername.trim()) {
      setUsername(newUsername.trim());
      setIsChangingUsername(false);
      setNewUsername("");
    }
  };

  const handleCancelChangeUsername = () => {
    setIsChangingUsername(false);
    setNewUsername("");
  };

  return (
    <main className="mx-auto flex h-dvh w-full flex-col items-center justify-center">
      <h2 className="mb-10 text-4xl font-bold">Thinkfast</h2>
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
            {isChangingUsername ? (
              <div className="space-y-4">
                <CardTitle className="text-center font-normal">
                  Change Username
                </CardTitle>
                <div className="space-y-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSaveNewUsername()
                    }
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNewUsername} className="flex-1">
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelChangeUsername}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="flex items-center justify-center gap-2 text-center font-normal">
                  Hi, <span className="font-medium">{username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeUsername}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="h-2 w-2" />
                  </Button>
                </CardTitle>
                <CardDescription className="mt-1 text-center">
                  Would you like to create or join a playground ?
                </CardDescription>
              </>
            )}
          </CardHeader>
          {!isChangingUsername && (
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
          )}
        </Card>
      )}
    </main>
  );
}
