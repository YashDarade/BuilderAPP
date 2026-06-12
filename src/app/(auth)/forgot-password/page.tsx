"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (_data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to your email address.
                Please check your inbox and follow the instructions.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/sign-in"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
