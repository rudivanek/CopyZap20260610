import React, { useState, KeyboardEvent, useRef, memo } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Input } from "./input"

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
  disabled?: boolean
}

export const TagsInput = memo(function TagsInput({
  value = [],
  onChange,
  placeholder = "Add tag...",
  className,
  maxTags = 10,
  disabled = false,
  ...props
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus the input when clicking on the container
  const handleContainerClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Add tag on Enter or comma
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue)
    }
    
    // Remove the last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().replace(/,/g, "")
    if (!trimmedTag) return

    // Don't add if we've reached the max tags
    if (maxTags && value.length >= maxTags) return

    // Don't add if the tag already exists
    if (!value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
    }
    
    setInputValue("")
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-3 py-1 focus-within:ring-1 focus-within:ring-primary-500",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={handleContainerClick}
      {...props}
    >
      {value.map((tag, index) => (
        <div
          key={`${tag}-${index}`}
          className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-sm"
        >
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={14} />
              <span className="sr-only">Remove tag</span>
            </button>
          )}
        </div>
      ))}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue) {
            addTag(inputValue)
          }
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-0"
        disabled={disabled || (maxTags && value.length >= maxTags)}
      />
    </div>
  )
})