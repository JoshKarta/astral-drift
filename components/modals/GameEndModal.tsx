"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalRound: number;
  totalRounds: number;
}

export default function GameEndModal({
  isOpen,
  onClose,
  finalRound,
  totalRounds,
}: GameEndModalProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Game Completed!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You've completed all {totalRounds} rounds!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">Final Round</p>
            <p className="text-2xl font-bold text-gray-900">{finalRound}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              View Results
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
