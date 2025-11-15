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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/sparrow-logo.png" alt="Sparrow Sheets" width={120} height={120} className="w-32 h-32" priority />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Sparrow Sheets</h1>
        <p className="text-center text-gray-600 mb-8">Enter PIN to access</p>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              maxLength="4"
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800">
            Unlock
          </Button>
        </form>
      </Card>
    </div>
  )
}
