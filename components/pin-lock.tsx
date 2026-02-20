"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PinLockProps {
  onUnlock: () => void
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const CORRECT_PIN = "4356"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      setError("")
      onUnlock()
    } else {
      setError("Invalid PIN. Try again.")
      setPin("")
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#fff4da_0,#fff_50%)] px-4">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-size:38px_38px] [background-image:linear-gradient(to_right,#d6b16a_1px,transparent_1px),linear-gradient(to_bottom,#d6b16a_1px,transparent_1px)]" />
      <Card className="relative z-10 w-full max-w-sm border-amber-200 bg-white/95 p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex justify-center">
          <Image src="/sparrow-logo.png" alt="Sparrow Sheets" width={120} height={120} className="h-28 w-28 sm:h-32 sm:w-32" priority />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Sparrow Sheets</h1>
        <p className="mb-8 text-center text-sm text-amber-900/80">Enter PIN to access the chess-themed workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))}
            maxLength={4}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-black">
            Unlock
          </Button>
        </form>
      </Card>
    </div>
  )
}
