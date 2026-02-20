"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import ImageUploadCell from "./image-upload-cell"

interface SpreadsheetGridProps {
  supabase: any
  tableName: string
  data: any[]
  columns: string[]
  onDataUpdate: () => void
}

export default function SpreadsheetGrid({ supabase, tableName, data, columns, onDataUpdate }: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [addingEntry, setAddingEntry] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isImageColumn = (colName: string) => {
    const lowerName = colName.toLowerCase()
    return (
      lowerName.includes("image") ||
      lowerName.includes("photo") ||
      lowerName.includes("picture") ||
      lowerName.includes("img") ||
      lowerName.includes("logo")
    )
  }

  const handleCellClick = (row: number, col: string) => {
    setEditingCell({ row, col })
    setEditValue(String(data[row]?.[col] || ""))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSave = async (row: number, col: string) => {
    try {
      const rowData = data[row]
      const rowId = rowData.id

      await supabase.from(tableName).update({ [col]: editValue }).eq("id", rowId)

      setEditingCell(null)
      onDataUpdate()
    } catch (error) {
      console.error("Error saving cell:", error)
    }
  }

  const handleDeleteRow = async (row: number) => {
    if (!confirm("Are you sure you want to delete this row?")) {
      return
    }

    try {
      const rowData = data[row]
      const rowId = rowData.id

      await supabase.from(tableName).delete().eq("id", rowId)

      onDataUpdate()
    } catch (error) {
      console.error("Error deleting row:", error)
    }
  }

  const handleAddEntry = async () => {
    try {
      setAddingEntry(true)

      const newEntry: Record<string, string> = {}
      columns.forEach((col) => {
        if (col !== "id" && col !== "created_at") {
          newEntry[col] = "—"
        }
      })

      const { error } = await supabase.from(tableName).insert([newEntry])

      if (error) {
        console.error("Error adding entry:", error)
        alert("Failed to add entry: " + (error.message || "Unknown error"))
        return
      }

      onDataUpdate()
    } catch (error) {
      console.error("Error:", error)
      alert("Error adding entry")
    } finally {
      setAddingEntry(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: string) => {
    if (e.key === "Enter") {
      handleSave(row, col)
    } else if (e.key === "Escape") {
      setEditingCell(null)
    }
  }

  if (columns.length === 0) {
    return (
      <Card className="border-amber-200 bg-white/90 p-8 text-center">
        <p className="text-gray-600">No data available in this table</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleAddEntry}
          disabled={addingEntry}
          className="bg-gray-900 px-3 py-2 text-xs text-white hover:bg-black sm:px-4 sm:text-sm"
        >
          <Plus className="mr-1 h-4 w-4 sm:mr-2" />
          {addingEntry ? "Adding..." : "Add Entry"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white/90 shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-amber-200 bg-amber-50/80">
              <th className="w-16 whitespace-nowrap px-2 py-2 text-center text-xs font-semibold text-gray-900 sm:px-4 sm:py-3 sm:text-sm">
                Delete
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-2 py-2 text-left text-xs font-semibold text-amber-950 sm:px-4 sm:py-3 sm:text-sm"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-2 py-6 text-center text-xs text-gray-500 sm:px-4 sm:py-8 sm:text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-amber-100 transition-colors hover:bg-amber-50/50">
                  <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
                    <Button
                      onClick={() => handleDeleteRow(rowIndex)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 px-2 text-xs text-red-700 hover:border-red-400 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </td>
                  {columns.map((col) => {
                    const value = row[col]
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === col
                    const isImageCol = isImageColumn(col)

                    return (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="cursor-pointer px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
                        onClick={() => !isImageCol && handleCellClick(rowIndex, col)}
                      >
                        {isImageCol ? (
                          <ImageUploadCell
                            supabase={supabase}
                            tableName={tableName}
                            rowId={row.id}
                            columnName={col}
                            currentValue={value}
                            onUploadSuccess={onDataUpdate}
                          />
                        ) : isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSave(rowIndex, col)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, col)}
                            className="h-8 w-full border-amber-400 px-2 py-1 text-xs sm:text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="inline-block max-w-xs break-words text-gray-900">{value || "—"}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
