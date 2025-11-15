# Song Form Integration Guide

This guide explains how to integrate Steps 4-8 into the existing Add Song form.

## Overview

The following components have been created and are ready for integration:

- **Step 4**: Lyrics Editor (to be created - using drag-and-drop)
- **Step 5**: Theme Selector (`components/forms/theme-selector.tsx`)
- **Step 6**: Biblical References (`components/forms/biblical-references.tsx`)
- **Step 7**: Media Manager (`components/forms/media-manager.tsx`)
- **Step 8**: Song Review (`components/forms/song-review.tsx`)

## Integration Steps

### 1. Update Steps Array

In `components/forms/add-song-form.tsx`, update the `steps` array:

```typescript
const steps = [
  { id: 1, name: "Song Type & Basic Info", description: "Choose song type and enter basic information" },
  { id: 2, name: "Musical Information", description: "Add musical details and metadata" },
  { id: 3, name: "Credits & Copyright", description: "Enter attribution and copyright information" },
  { id: 4, name: "Lyrics", description: "Add song verses and lyrics" },
  { id: 5, name: "Themes & Categories", description: "Categorize song by themes and difficulty" },
  { id: 6, name: "Biblical References", description: "Add scripture references" },
  { id: 7, name: "Media (Optional)", description: "Add sheet music, audio, or video links" },
  { id: 8, name: "Review & Submit", description: "Review and submit your song" },
]
```

### 2. Add Imports

Add the following imports at the top of `add-song-form.tsx`:

```typescript
import { ThemeSelector } from "@/components/forms/theme-selector"
import { BiblicalReferences } from "@/components/forms/biblical-references"
import { MediaManager } from "@/components/forms/media-manager"
import { SongReview } from "@/components/forms/song-review"
import { Select as DifficultySelect } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
```

### 3. Add Form State

Add state for managing the new fields:

```typescript
const {
  register,
  handleSubmit,
  watch,
  setValue, // Add this
  formState: { errors },
  trigger,
} = useForm<SongFormValues>({
  resolver: zodResolver(songFormSchema),
  defaultValues,
  mode: "onChange",
})

// Watch new fields
const themeIds = watch("themeIds")
const biblicalReferences = watch("biblicalReferences")
const media = watch("media")
const difficulty = watch("difficulty")
```

### 4. Update getFieldsForStep

Update the `getFieldsForStep` function to include validation for new steps:

```typescript
const getFieldsForStep = (step: number): (keyof SongFormValues)[] => {
  switch (step) {
    case 1:
      const fields: (keyof SongFormValues)[] = ["songType", "title"]
      if (songType === "hymnal") {
        fields.push("sectionId", "songNumber", "language")
      }
      return fields
    case 2:
      return [] // Musical info is optional
    case 3:
      return [] // Credits are optional
    case 4:
      return [] // Lyrics validation can be added if needed
    case 5:
      return [] // Themes are optional
    case 6:
      return [] // Biblical references are optional
    case 7:
      return [] // Media is optional
    case 8:
      return [] // Review step
    default:
      return []
  }
}
```

### 5. Add Step 4 (Lyrics) - To Be Created

```typescript
{currentStep === 4 && (
  <div className="space-y-4">
    {/* Lyrics editor component to be created */}
    <p className="text-sm text-gray-600">
      Step 4: Lyrics Editor component coming soon with drag-and-drop functionality
    </p>
  </div>
)}
```

### 6. Add Step 5 (Themes & Categories)

```typescript
{currentStep === 5 && (
  <div className="space-y-6">
    <ThemeSelector
      selectedIds={themeIds || []}
      onChange={(ids) => setValue("themeIds", ids)}
    />

    <div className="space-y-2">
      <Label htmlFor="difficulty">Difficulty Level (Optional)</Label>
      <Select
        id="difficulty"
        value={difficulty || ""}
        onChange={(e) => setValue("difficulty", e.target.value as any)}
      >
        <option value="">Select difficulty...</option>
        <option value="EASY">Easy - Simple melody, easy to learn</option>
        <option value="MODERATE">Moderate - Some musical complexity</option>
        <option value="HARD">Hard - Complex harmonies or rhythms</option>
      </Select>
    </div>
  </div>
)}
```

### 7. Add Step 6 (Biblical References)

```typescript
{currentStep === 6 && (
  <div className="space-y-4">
    <BiblicalReferences
      references={biblicalReferences || []}
      onChange={(refs) => setValue("biblicalReferences", refs)}
    />
  </div>
)}
```

### 8. Add Step 7 (Media)

```typescript
{currentStep === 7 && (
  <div className="space-y-4">
    <MediaManager
      media={media || []}
      onChange={(items) => setValue("media", items)}
    />
  </div>
)}
```

### 9. Add Step 8 (Review & Submit)

```typescript
{currentStep === 8 && (
  <div className="space-y-4">
    <SongReview
      data={watch()}
      errors={errors}
    />
  </div>
)}
```

### 10. Update Navigation Buttons

Update the submit button logic to handle different actions on the final step:

```typescript
{/* Navigation Buttons */}
<div className="mt-6 flex justify-between">
  {currentStep > 1 && (
    <Button
      type="button"
      variant="outline"
      onClick={prevStep}
    >
      <ChevronLeft className="mr-2 h-4 w-4" />
      Previous
    </Button>
  )}

  <div className="ml-auto flex gap-2">
    {currentStep < steps.length - 1 && (
      <Button
        type="button"
        onClick={nextStep}
      >
        Next
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    )}

    {currentStep === steps.length - 1 && (
      <>
        <Button
          type="submit"
          variant="outline"
          onClick={() => setValue("status", "DRAFT")}
          disabled={isLoading}
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          onClick={() => setValue("status", "PUBLISHED")}
          disabled={isLoading}
        >
          {isLoading ? "Publishing..." : "Publish Song"}
        </Button>
      </>
    )}
  </div>
</div>
```

### 11. Update onSubmit Handler

Update the submission handler to include success/error states and redirect options:

```typescript
const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle")

const onSubmit = async (data: SongFormValues) => {
  setIsLoading(true)
  setSubmitStatus("idle")

  try {
    console.log("Form data:", data)

    // TODO: Implement actual API call
    const response = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to save song")
    }

    const savedSong = await response.json()
    setSubmitStatus("success")

    // Show success options
    const action = window.confirm(
      "Song saved successfully! Click OK to add another song, or Cancel to view the song list."
    )

    if (action) {
      // Reset form and start over
      window.location.reload()
    } else {
      // Go to songs list
      router.push("/admin/songs")
    }
  } catch (error) {
    console.error("Error submitting form:", error)
    setSubmitStatus("error")
    alert("Failed to save song. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
```

## Testing Checklist

- [ ] All 8 steps navigate correctly
- [ ] Form validation works on each step
- [ ] Theme selector allows multi-select
- [ ] Biblical references can be added/removed
- [ ] Media links can be added with different types
- [ ] Review page shows all entered data
- [ ] Save as Draft works
- [ ] Publish works
- [ ] Error handling displays properly
- [ ] Loading states show during submission
- [ ] Success redirect options work

## Notes

- Step 4 (Lyrics) requires the drag-and-drop lyrics editor components to be created
- All components use TypeScript for type safety
- Form state is managed by react-hook-form
- Validation is handled by Zod schemas
- Auto-save functionality can be added using the `useAutoSave` hook

## Future Enhancements

- Add auto-save to localStorage
- Add lyrics editor with drag-and-drop (Step 4)
- Add file upload for media (currently URL-only)
- Add real-time validation indicators
- Add step completion badges
- Add ability to skip optional steps
