"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Crop, Upload, X } from "lucide-react"

interface ImageUploadCellProps {
  supabase: any
  tableName: string
  rowId: number | string
  columnName: string
  currentValue: string
  onUploadSuccess: () => void
}

const LANDSCAPE_RATIO = 16 / 9

async function loadImage(file: File): Promise<HTMLImageElement> {
  const imageUrl = URL.createObjectURL(file)

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Could not load selected image"))
      img.src = imageUrl
    })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

async function cropToLandscape(file: File, focusY: number): Promise<File> {
  const image = await loadImage(file)
  const sourceRatio = image.width / image.height

  let sourceWidth = image.width
  let sourceHeight = image.height

  if (sourceRatio > LANDSCAPE_RATIO) {
    sourceWidth = image.height * LANDSCAPE_RATIO
  } else {
    sourceHeight = image.width / LANDSCAPE_RATIO
  }

  const maxY = Math.max(0, image.height - sourceHeight)
  const sourceX = (image.width - sourceWidth) / 2
  const sourceY = maxY * focusY

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(sourceWidth)
  canvas.height = Math.round(sourceHeight)

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not create image crop context")

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((generatedBlob) => {
      if (generatedBlob) resolve(generatedBlob)
      else reject(new Error("Unable to generate cropped image"))
    }, file.type || "image/jpeg")
  })

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg"
  const croppedName = file.name.replace(/\.[^.]+$/, "") + "-landscape" + extension

  return new File([blob], croppedName, { type: blob.type || file.type || "image/jpeg", lastModified: Date.now() })
}

export default function ImageUploadCell({ supabase, tableName, rowId, columnName, currentValue, onUploadSuccess }: ImageUploadCellProps) {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [landscapeCropEnabled, setLandscapeCropEnabled] = useState(true)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropFocusY, setCropFocusY] = useState(0.5)

  const previewUrl = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : ""), [pendingFile])

  const resetPendingFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPendingFile(null)
    setCropFocusY(0.5)
  }

  const uploadFile = async (file: File) => {
    const fileName = `${tableName}-${rowId}-${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("fvd").upload(fileName, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      alert("Failed to upload image")
      return
    }

    const { data: urlData } = supabase.storage.from("fvd").getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    const { error: updateError } = await supabase.from(tableName).update({ [columnName]: publicUrl }).eq("id", rowId)

    if (updateError) {
      console.error("Update error:", updateError)
      alert("Failed to save image URL")
      return
    }

    onUploadSuccess()
  }

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    e.target.value = ""
    if (!selectedFile) return

    if (landscapeCropEnabled) {
      resetPendingFile()
      setPendingFile(selectedFile)
      return
    }

    try {
      setUploading(true)
      await uploadFile(selectedFile)
    } catch (error) {
      console.error("Error:", error)
      alert("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleCropAndUpload = async () => {
    if (!pendingFile) return

    try {
      setUploading(true)
      const croppedFile = await cropToLandscape(pendingFile, cropFocusY)
      await uploadFile(croppedFile)
      resetPendingFile()
    } catch (error) {
      console.error("Error:", error)
      alert("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm("Are you sure you want to remove this image?")) return

    try {
      setRemoving(true)
      const { error: updateError } = await supabase.from(tableName).update({ [columnName]: null }).eq("id", rowId)

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
    <div className="flex min-w-[180px] flex-col items-start gap-2 py-1">
      <div className="flex w-full flex-wrap items-center gap-2">
        {currentValue ? (
          <>
            <a
              href={currentValue}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[140px] truncate text-xs font-medium text-amber-700 underline decoration-amber-400 underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:decoration-amber-500"
            >
              View image
            </a>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveImage()
              }}
              size="sm"
              variant="outline"
              disabled={removing}
              className="h-7 border-red-300 px-2 text-red-700 hover:border-red-400 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <span className="text-xs text-amber-900/65 dark:text-amber-100/70">No image</span>
        )}

        <label className="inline-block">
          <input type="file" accept="image/*" onChange={handleImageSelection} disabled={uploading} className="hidden" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            className="h-7 cursor-pointer border-amber-300 bg-amber-50 px-2 text-amber-900 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-50"
            onClick={(e) => {
              e.stopPropagation()
              const input = e.currentTarget.previousElementSibling as HTMLInputElement
              input.click()
            }}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </label>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setLandscapeCropEnabled((current) => !current)
        }}
        className="inline-flex items-center gap-1 text-[11px] text-amber-900/80 hover:text-amber-950 dark:text-amber-100/80"
      >
        <Crop className="h-3 w-3" />
        {landscapeCropEnabled ? "Landscape crop: on (16:9)" : "Landscape crop: off"}
      </button>

      {pendingFile && previewUrl && (
        <div className="w-full max-w-[240px] rounded-md border border-amber-300 bg-white p-2 shadow-sm dark:border-amber-800 dark:bg-black/50">
          <p className="mb-2 text-[11px] font-medium text-amber-900 dark:text-amber-100">Crop preview (landscape)</p>
          <div className="relative mb-2 aspect-video overflow-hidden rounded border border-amber-200 dark:border-amber-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Crop preview" className="h-full w-full object-cover" style={{ objectPosition: `center ${cropFocusY * 100}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={cropFocusY * 100}
            onChange={(event) => setCropFocusY(Number(event.target.value) / 100)}
            className="mb-2 w-full"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation()
                handleCropAndUpload()
              }}
              className="h-7 bg-gray-900 px-2 text-xs text-white hover:bg-black"
            >
              Upload cropped
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                resetPendingFile()
              }}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
