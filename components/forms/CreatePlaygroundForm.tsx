"use client";
import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { useUsername } from "@/hooks/useUsername";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  rounds: z.number(),
  timer: z.number(),
  forDummies: z.boolean(),
});

export default function CreatePlaygroundForm() {
  const { username } = useUsername();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rounds: 3,
      timer: 30,
      forDummies: false,
    },
  });

  const createPlayground = useMutation(api.playground.createPlayground);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!username || username === null) {
      toast.error("Username is required");
      router.push("/");
      return;
    }

    try {
      const result = await toast.promise(
        createPlayground({
          hostId: username as string,
          rounds: values.rounds,
          timer: values.timer,
          forDummies: values.forDummies,
        }),
        {
          loading: "Creating playground..",
          success: "Playground created successfully",
          error: "Failed to create playground",
        },
      );

      if (!result || !result.code) {
        console.error("No playground code returned");
        return;
      }

      // Add URL parameter if it's for dummies
      const url = values.forDummies
        ? `/playground/${result.code}?mode=dummy`
        : `/playground/${result.code}`;

      console.log("Navigation to:", url);

      // Force the router to navigate
      setTimeout(() => {
        router.push(url);
      }, 100);
    } catch (error) {
      console.error("Error creating playground:", error);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex w-full justify-between">
          <FormField
            control={form.control}
            name="timer"
            render={({ field }) => (
              <FormItem className="flex-1/2">
                <FormLabel>Timer (seconds)</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value.toString()}
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                    }}
                  >
                    {[30, 45, 60].map((item) => (
                      <ToggleGroupItem value={item.toString()} key={item}>
                        {item}s
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rounds"
            render={({ field }) => (
              <FormItem className="flex-1/2">
                <FormLabel>Rounds</FormLabel>
                <FormControl>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="forDummies"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  For Dummies Mode
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Enable enhanced features like country search for easier
                  gameplay
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Playground"}
        </Button>

        {/* Debug information */}
        {/* <pre className="text-xs mt-4 p-2 bg-gray-100 rounded">
          {JSON.stringify(form.formState, null, 2)}
        </pre> */}
      </form>
    </Form>
  );
}
