"use client";
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
import { api } from "@/convex/_generated/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useMutation } from "convex/react";
import { useUsername } from "@/hooks/useUsername";

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export default function JoinPlaygroundForm() {
  const { username } = useUsername();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const joinPlayground = useMutation(api.playground.joinPlayground);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!username) {
      toast.error("Username is required");
      return;
    }

    try {
      const result = await toast.promise(
        joinPlayground({
          username: username,
          code: values.code.toUpperCase(),
        }),
        {
          loading: "Joining playground..",
          success: "Playground joined successfully",
          error: "Failed to join playground",
        },
      );

      router.push(`/playground/${values.code.toUpperCase()}`);
    } catch (error) {
      console.error("Error joining playground:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex w-full justify-between">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex-1/2">
                <FormLabel>Playground Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter code"
                    maxLength={8}
                    className="uppercase placeholder:normal-case"
                  />
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
          {form.formState.isSubmitting ? "Joining..." : "Join Playground"}
        </Button>
      </form>
    </Form>
  );
}
