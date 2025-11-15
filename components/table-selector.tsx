"use client"

import { Button } from "@/components/ui/button"

interface TableSelectorProps {
  tables: string[]
  selectedTable: string
  onSelectTable: (table: string) => void
}

export default function TableSelector({ tables, selectedTable, onSelectTable }: TableSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1 sm:gap-2">
      {tables.map((table) => (
        <Button
          key={table}
          onClick={() => onSelectTable(table)}
          variant={selectedTable === table ? "default" : "outline"}
          className={`capitalize transition-colors text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
            selectedTable === table
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {table}
        </Button>
      ))}
    </div>
  )
}
