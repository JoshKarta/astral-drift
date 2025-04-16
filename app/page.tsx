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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
                  <form className="space-y-4">
                    <div className="flex w-full justify-between">
                      <div className="space-y-2 flex-1/2">
                        <Label>Timer (seconds)</Label>
                        <ToggleGroup type="single" defaultValue="30">
                          {[30, 45, 60].map((item) => (
                            <ToggleGroupItem value={item.toString()} key={item}>
                              {item}s
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                      <div className="space-y-2 flex-1/2">
                        <Label>Rounds</Label>
                        <Select defaultValue="3">
                          <SelectTrigger className="w-2/3">
                            <SelectValue placeholder="Select rounds" />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 5, 7].map((item) => (
                              <SelectItem value={item.toString()} key={item}>
                                {item} rounds
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Create Playground
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label>Playground Code</Label>
                      <Input
                        placeholder="code"
                        maxLength={6}
                        className="uppercase placeholder:normal-case"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Join Playground
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
