"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import PinLock from "@/components/pin-lock"
import TableSelector from "@/components/table-selector"
import SpreadsheetGrid from "@/components/spreadsheet-grid"
import Image from "next/image"

const TABLES = ["about", "achievements", "announcements", "channels", "contacts", "events", "gallery", "responses", "sponsors", "timeline", "tutorials"]

const SUPABASE_URL = "https://olcojkaokbyrbqjueboo.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY29qa2Fva2J5cmJxanVlYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzExNjAsImV4cCI6MjA3ODEwNzE2MH0.tjgr0lZ0TzWHr7NrV-6ZdHLADGOBNTCHmaBP3Wb1d7Y"

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [selectedTable, setSelectedTable] = useState("about")
  const [tableData, setTableData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Initialize Supabase client
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

        // Extract column names from the first row
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]))
        } else {
          setColumns([])
        }
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  // Fetch table data when supabase or selectedTable changes
  useEffect(() => {
    fetchData(selectedTable)
  }, [supabase, selectedTable, fetchData])

  if (!isUnlocked) {
    return <PinLock onUnlock={() => setIsUnlocked(true)} />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Sparrow Logo */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <Image
            src="/sparrow-logo.png"
            alt="Sparrow Sheets logo"
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
            priority
          />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Sparrow Sheets</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Table Selector */}
        <div className="mb-4 sm:mb-6">
          <TableSelector tables={TABLES} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 p-4 border-red-200 bg-red-50">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Loading {selectedTable} data...</p>
          </Card>
        )}

        {/* Spreadsheet Grid */}
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
