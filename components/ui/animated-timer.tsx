"use client"

import React from "react"
import NumberFlow from "@number-flow/react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const MotionNumberFlow = motion.create(NumberFlow)

interface AnimatedTimerProps {
  seconds: number | null
  className?: string
}

export default function AnimatedTimer({
  seconds,
  className,
}: AnimatedTimerProps) {
  if (seconds === null) {
    return (
      <span className={cn("text-gray-400", className)}>
        --sec
      </span>
    )
  }

  // Calculate color based on time remaining
  const getTimerColor = (time: number) => {
    if (time <= 10) return "text-red-500"
    if (time <= 30) return "text-orange-400" 
    return "text-red-300"
  }

  // Calculate if we should pulse (last 10 seconds)
  const shouldPulse = seconds <= 10

  return (
    <span className={cn("inline-flex items-center", className)}>
      <MotionNumberFlow
        value={seconds}
        className={cn(
          "font-semibold transition-colors duration-300",
          getTimerColor(seconds)
        )}
        format={{ minimumIntegerDigits: 1 }}
        animate={shouldPulse ? {
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1]
        } : {}}
        transition={shouldPulse ? {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
      <span className={cn(
        "ml-0.5 transition-colors duration-300",
        getTimerColor(seconds)
      )}>
        sec
      </span>
    </span>
  )
}
