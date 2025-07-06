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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const submitAnswers = useMutation(api.game.submitAnswers);

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
  }, [playgroundData?.timer, isPlaying]);

  // Auto submit when time ends
  React.useEffect(() => {
    if (timeLeft === 0 && isPlaying) {
      const values = form.getValues();
      onSubmit(values);
    }
  }, [timeLeft, isPlaying]);

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
      await toast.promise(
        submitAnswers({
          username: username as string,
          code: playgroundData.code,
          fields: values.fields,
        }),
        {
          loading: "Submitting answers...",
          success: "Answers submitted successfully!",
          error: (err) => err?.message || "Failed to submit answers.",
        },
      );

      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };

  if (!isPlaying) {
    return <div>Waiting for game to start...</div>;
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
