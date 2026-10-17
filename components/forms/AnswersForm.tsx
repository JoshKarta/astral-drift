"use client";
import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Doc } from "@/convex/_generated/dataModel";
import toast from "react-hot-toast";
import { useUsername } from "@/hooks/useUsername";
import { useGameLetter } from "@/hooks/useGameLetter";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AnimatedTimer from "@/components/ui/animated-timer";

const formSchema = z.object({
  fields: z.object({
    jongens: z.string(),
    meisjes: z.string(),
    dieren: z.string(),
    vruchten: z.string(),
    landen: z.string(),
  }),
});
type FormSchema = z.infer<typeof formSchema>;

export default function AnswersForm({
  playgroundData,
}: {
  playgroundData: Doc<"playgrounds">;
}) {
  const { username } = useUsername();
  const { isPlaying } = useGameLetter();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: {
        jongens: "",
        meisjes: "",
        dieren: "",
        vruchten: "",
        landen: "",
      },
    },
  });

  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isTimerActive, setIsTimerActive] = React.useState(false);
  const submitAnswers = useMutation(api.game.submitAnswers);
  const advanceRound = useMutation(api.game.advanceRound);

  // Check if player has already submitted for current round
  const playerSubmitted = useQuery(
    api.game.hasPlayerSubmitted,
    username && playgroundData
      ? {
          code: playgroundData.code,
          username: username as string,
        }
      : "skip",
  );

  // Reset submitted state when round changes or game status restarts
  React.useEffect(() => {
    setHasSubmitted(false);
    setIsTimerActive(false);
    form.reset({
      fields: {
        jongens: "",
        meisjes: "",
        dieren: "",
        vruchten: "",
        landen: "",
      },
    });
  }, [playgroundData?.currentRound, playgroundData?.status, form]);

  // Countdown with server timestamp and localStorage synchronization
  React.useEffect(() => {
    if (!playgroundData?.timer || !isPlaying) {
      setIsTimerActive(false);
      setTimeLeft(null);
      return;
    }

    const storageKey = `thinkfast_timer_${playgroundData.code}_r${playgroundData.currentRound}`;

    const calculateRemaining = () => {
      const now = Date.now();
      const serverEndsAt = playgroundData.roundEndsAt;

      if (serverEndsAt && typeof serverEndsAt === "number") {
        const remaining = Math.max(0, Math.ceil((serverEndsAt - now) / 1000));
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, String(serverEndsAt));
        }
        return remaining;
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const target = Number(saved);
          if (!isNaN(target)) {
            return Math.max(0, Math.ceil((target - now) / 1000));
          }
        }
        const newEndsAt = now + playgroundData.timer * 1000;
        localStorage.setItem(storageKey, String(newEndsAt));
      }

      return playgroundData.timer;
    };

    const initialRemaining = calculateRemaining();
    setTimeLeft(initialRemaining);
    setIsTimerActive(initialRemaining > 0);

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    playgroundData?.timer,
    playgroundData?.currentRound,
    playgroundData?.roundEndsAt,
    playgroundData?.code,
    isPlaying,
  ]);

  // Auto submit when time ends and advance round
  React.useEffect(() => {
    // Only auto-submit if timer was actually active and reached 0 naturally
    if (timeLeft === 0 && isPlaying && isTimerActive) {
      const handleTimeExpired = async () => {
        console.log("Timer expired naturally, auto-submitting...");

        // Set timer inactive immediately to prevent multiple submissions
        setIsTimerActive(false);

        // Submit current answers
        const values = form.getValues();
        const normalizedFields: Record<string, string> = {};
        for (const [key, val] of Object.entries(values.fields || {})) {
          normalizedFields[key] = (val || "").trim().toLowerCase();
        }
        try {
          await submitAnswers({
            username: username as string,
            code: playgroundData.code,
            fields: normalizedFields,
          });
          form.reset();
        } catch (error) {
          // Continue even if submission fails (player might not have answered)
          console.log("Auto-submit failed:", error);
        }

        // Advance to next round
        try {
          await advanceRound({ code: playgroundData.code });
        } catch (error) {
          console.error("Failed to advance round:", error);
        }
      };

      handleTimeExpired();
    }
  }, [
    timeLeft,
    isPlaying,
    isTimerActive,
    username,
    playgroundData?.code,
    submitAnswers,
    advanceRound,
    form,
  ]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!username || !playgroundData) return;

    const normalizedFields: Record<string, string> = {};
    for (const [key, val] of Object.entries(values.fields || {})) {
      normalizedFields[key] = (val || "").trim().toLowerCase();
    }

    try {
      // Only submit answers - don't advance round
      await toast.promise(
        submitAnswers({
          username: username as string,
          code: playgroundData.code,
          fields: normalizedFields,
        }),
        {
          loading: "Submitting answers...",
          success: "Answers submitted! Waiting for round to end...",
          error: (err) => err?.message || "Failed to submit answers.",
        },
      );

      // Reset form after successful submission
      form.reset();
      setHasSubmitted(true);

      // Note: Round will advance automatically when timer expires
    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };

  if (!isPlaying) {
    return (
      <div className="py-12 text-center">
        <p className="text-base text-muted-foreground">
          Waiting for the host to start the round...
        </p>
      </div>
    );
  }

  if (hasSubmitted || playerSubmitted) {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Answers Submitted
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Waiting for other players or round timer to conclude
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm font-medium">
          <span>Time remaining:</span>
          <AnimatedTimer seconds={timeLeft} />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fields.jongens"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-foreground">
                  Boy&apos;s name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    placeholder="Enter a boy's name"
                    autoComplete="off"
                    className="h-12 rounded-xl text-base lowercase bg-background/60 transition-all focus-visible:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.meisjes"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-foreground">
                  Girl&apos;s name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    placeholder="Enter a girl's name"
                    autoComplete="off"
                    className="h-12 rounded-xl text-base lowercase bg-background/60 transition-all focus-visible:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.dieren"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-foreground">
                  Animal
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    placeholder="Enter an animal"
                    autoComplete="off"
                    className="h-12 rounded-xl text-base lowercase bg-background/60 transition-all focus-visible:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.vruchten"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-foreground">
                  Fruit
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    placeholder="Enter a fruit"
                    autoComplete="off"
                    className="h-12 rounded-xl text-base lowercase bg-background/60 transition-all focus-visible:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.landen"
            render={({ field }) => (
              <FormItem className="space-y-1.5 sm:col-span-2">
                <FormLabel className="text-sm font-medium text-foreground">
                  Country
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    placeholder="Enter a country"
                    autoComplete="off"
                    className="h-12 rounded-xl text-base lowercase bg-background/60 transition-all focus-visible:ring-primary/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="h-13 w-full rounded-xl bg-primary text-primary-foreground text-base font-semibold transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Submitting Answers..." : "Submit Answers"}
        </Button>
      </form>
    </Form>
  );
}
