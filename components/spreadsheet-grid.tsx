"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from 'lucide-react'
import ImageUploadCell from "./image-upload-cell"
import Image from "next/image"

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

      await supabase
        .from(tableName)
        .update({ [col]: editValue })
        .eq("id", rowId)

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
          // Use a placeholder value instead of empty string to pass RLS policy
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
      <Card className="p-8 text-center">
        <p className="text-gray-600">No data available in this table</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddEntry} disabled={addingEntry} className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2">
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          {addingEntry ? "Adding..." : "Add Entry"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap w-14 sm:w-16">
                Delete
              </th>
              {columns.map((col) => (
                <th key={col} className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-2 sm:px-4 py-4 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                    <Button
                      onClick={() => handleDeleteRow(rowIndex)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs px-1 sm:px-2"
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
                        className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm cursor-pointer"
                        onClick={() => !isImageCol && handleCellClick(rowIndex, col)}
                      >
                        {isImageCol ? (
                          <div className="flex items-center justify-center">
                            <ImageUploadCell
                              supabase={supabase}
                              tableName={tableName}
                              rowId={row.id}
                              columnName={col}
                              currentValue={value}
                              onUploadSuccess={onDataUpdate}
                            />
                          </div>
                        ) : isEditing ? (
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSave(rowIndex, col)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, col)}
                            className="w-full px-2 py-1 border border-blue-500 rounded text-xs sm:text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-900 break-words max-w-xs inline-block text-xs sm:text-sm">{value || "—"}</span>
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
