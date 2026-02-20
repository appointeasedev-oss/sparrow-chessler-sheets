"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import PinLock from "@/components/pin-lock"
import TableSelector from "@/components/table-selector"
import SpreadsheetGrid from "@/components/spreadsheet-grid"
import Image from "next/image"
import useAutoTheme from "@/hooks/use-auto-theme"

const TABLES = ["about", "achievements", "announcements", "channels", "contacts", "events", "gallery", "responses", "sponsors", "timeline", "tutorials"]

const SUPABASE_URL = "https://olcojkaokbyrbqjueboo.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY29qa2Fva2J5cmJxanVlYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzExNjAsImV4cCI6MjA3ODEwNzE2MH0.tjgr0lZ0TzWHr7NrV-6ZdHLADGOBNTCHmaBP3Wb1d7Y"

const CHESS_ICONS = ["♔", "♕", "♖", "♗", "♘", "♙"]

export default function Home() {
  useAutoTheme()

  const [isUnlocked, setIsUnlocked] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [selectedTable, setSelectedTable] = useState("about")
  const [tableData, setTableData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    setSupabase(client)
  }, [])

  const fetchData = useCallback(
    async (table: string) => {
      if (!supabase) return

      try {
        setLoading(true)
        setError("")

        const { data, error: fetchError } = await supabase.from(table).select("*")

        if (fetchError) {
          console.error("Fetch error:", fetchError)
          setError(`Failed to fetch ${table}: ${fetchError.message}`)
          setTableData([])
          setColumns([])
          return
        }

        setTableData(data || [])
        setColumns(data?.length ? Object.keys(data[0]) : [])
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    fetchData(selectedTable)
  }, [supabase, selectedTable, fetchData])

  if (!isUnlocked) {
    return <PinLock onUnlock={() => setIsUnlocked(true)} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fff8e5_0%,#fff_45%,#fff4d7_100%)] dark:bg-[linear-gradient(135deg,#1f1a12_0%,#111_45%,#1a140d_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20 [background-size:44px_44px] [background-image:linear-gradient(to_right,#d6b16a_1px,transparent_1px),linear-gradient(to_bottom,#d6b16a_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#725325_1px,transparent_1px),linear-gradient(to_bottom,#725325_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0">
        {CHESS_ICONS.map((icon, index) => (
          <span
            key={`${icon}-${index}`}
            className="floating-piece absolute text-amber-700/45 dark:text-amber-300/35"
            style={{ left: `${10 + index * 15}%`, animationDelay: `${index * 0.8}s`, fontSize: `${22 + index * 4}px` }}
          >
            {icon}
          </span>
        ))}
      </div>

      <header className="sticky top-0 z-40 border-b border-amber-200/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-amber-800/70 dark:bg-black/50">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-4 md:px-6 lg:px-8">
          <Image src="/sparrow-logo.png" alt="Sparrow Sheets logo" width={40} height={40} className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" priority />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-2xl md:text-3xl dark:text-amber-50">Sparrow Sheets</h1>
            <p className="hidden text-xs text-amber-800/80 sm:block dark:text-amber-200/80">Chess-themed workspace • Sparrow branded</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        <Card className="mb-4 border-amber-200/80 bg-white/90 p-3 shadow-sm sm:mb-6 sm:p-4 dark:border-amber-800 dark:bg-black/45">
          <TableSelector tables={TABLES} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
        </Card>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/50">
            <p className="text-red-800 dark:text-red-100">{error}</p>
          </Card>
        )}

        {loading && (
          <Card className="p-8 text-center dark:border-amber-800 dark:bg-black/45">
            <p className="text-gray-600 dark:text-amber-100">Loading {selectedTable} data...</p>
          </Card>
        )}

        {!loading && !error && (
          <SpreadsheetGrid
            supabase={supabase}
            tableName={selectedTable}
            data={tableData}
            columns={columns}
            onDataUpdate={() => {
              fetchData(selectedTable)
            }}
          />
        )}
      </main>
    </div>
  )
}
