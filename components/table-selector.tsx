"use client"

import { Button } from "@/components/ui/button"

interface TableSelectorProps {
  tables: string[]
  selectedTable: string
  onSelectTable: (table: string) => void
}

export default function TableSelector({ tables, selectedTable, onSelectTable }: TableSelectorProps) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
      {tables.map((table) => (
        <Button
          key={table}
          onClick={() => onSelectTable(table)}
          variant={selectedTable === table ? "default" : "outline"}
          className={`shrink-0 snap-start px-3 py-2 text-xs capitalize transition-all sm:text-sm ${
            selectedTable === table
              ? "bg-gray-900 text-white hover:bg-black"
              : "border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/50"
          }`}
        >
          {table}
        </Button>
      ))}
    </div>
  )
}
