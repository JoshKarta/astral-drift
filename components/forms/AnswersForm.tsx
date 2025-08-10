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

  // Reset submitted state when round changes
  React.useEffect(() => {
    setHasSubmitted(false);
  }, [playgroundData?.currentRound]);

  // Countdown
  React.useEffect(() => {
    if (!playgroundData?.timer || !isPlaying) return;

    setTimeLeft(playgroundData.timer);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playgroundData?.timer, playgroundData?.currentRound, isPlaying]);

  // Auto submit when time ends and advance round
  React.useEffect(() => {
    if (timeLeft === 0 && isPlaying) {
      const handleTimeExpired = async () => {
        // Submit current answers
        const values = form.getValues();
        try {
          await submitAnswers({
            username: username as string,
            code: playgroundData.code,
            fields: values.fields,
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
    username,
    playgroundData?.code,
    submitAnswers,
    advanceRound,
    form,
  ]);

  // const onSubmit = (values: FormSchema) => {
  //   submitAnswers({
  //     username: username as string,
  //     code: playgroundData.code,
  //     fields: values.fields,
  //   });
  // };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!username || !playgroundData) return;

    try {
      // Only submit answers - don't advance round
      await toast.promise(
        submitAnswers({
          username: username as string,
          code: playgroundData.code,
          fields: values.fields,
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
      <p className="text-center text-neutral-400">
        Waiting for game to start...
      </p>
    );
  }

  if (hasSubmitted || playerSubmitted) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Answers Submitted!
        </h3>
        <p className="mb-4 text-gray-600">
          Waiting for other players to finish or timer to expire...
        </p>
        <p className="text-sm text-gray-500">
          Time remaining: <AnimatedTimer seconds={timeLeft} />
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fields.jongens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Boys</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter a boy's name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.meisjes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Girls</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter a girl's name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.dieren"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Animals</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter an animal" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.vruchten"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fruits</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter a fruit" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fields.landen"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Countries</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter a country" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Submitting..." : "Submit Answers"}
        </Button>
      </form>
    </Form>
  );
}
