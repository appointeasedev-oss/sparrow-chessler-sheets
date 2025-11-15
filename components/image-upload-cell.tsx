"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface ImageUploadCellProps {
  supabase: any
  tableName: string
  rowId: number | string
  columnName: string
  currentValue: string
  onUploadSuccess: () => void
}

export default function ImageUploadCell({
  supabase,
  tableName,
  rowId,
  columnName,
  currentValue,
  onUploadSuccess,
}: ImageUploadCellProps) {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Upload file to fvd bucket
      const fileName = `${tableName}-${rowId}-${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage.from("fvd").upload(fileName, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload image")
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("fvd").getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update the table with image URL
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [columnName]: publicUrl })
        .eq("id", rowId)

      if (updateError) {
        console.error("Update error:", updateError)
        alert("Failed to save image URL")
        return
      }

      onUploadSuccess()
    } catch (error) {
      console.error("Error:", error)
      alert("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm("Are you sure you want to remove this image?")) {
      return
    }

    try {
      setRemoving(true)

      // Update the table to remove image URL
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [columnName]: null })
        .eq("id", rowId)

      if (updateError) {
        console.error("Update error:", updateError)
        alert("Failed to remove image")
        return
      }

      onUploadSuccess()
    } catch (error) {
      console.error("Error:", error)
      alert("Error removing image")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentValue ? (
        <>
          <a
            href={currentValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm truncate max-w-xs"
          >
            View Image
          </a>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveImage()
            }}
            size="sm"
            variant="outline"
            disabled={removing}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <span className="text-gray-500 text-sm">No image</span>
      )}
      <label className="inline-block">
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          className="cursor-pointer bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            const input = e.currentTarget.previousElementSibling as HTMLInputElement
            input.click()
          }}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </label>
    </div>
  )
}
