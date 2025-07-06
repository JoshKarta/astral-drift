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
      await toast.promise(
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
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Joining...
            </>
          ) : (
            "Join Playground"
          )}
        </Button>
      </form>
    </Form>
  );
}
