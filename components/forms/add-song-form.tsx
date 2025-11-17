"use client"

import * as React from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { songFormSchema, type SongFormValues, defaultValues } from "@/lib/validations/song"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField } from "@/components/ui/form-field"
import { cn } from "@/lib/utils"
import { LyricsEditor } from "@/components/forms/lyrics-editor"
import { ThemeSelector } from "@/components/forms/theme-selector"
import { BiblicalReferences } from "@/components/forms/biblical-references"
import { MediaManager } from "@/components/forms/media-manager"
import { SongReview } from "@/components/forms/song-review"

interface Section {
  id: string
  name: string
  nameKreyol: string | null
  collection: {
    name: string
    nameKreyol: string | null
  }
}

interface AddSongFormProps {
  initialData?: ApiSong | SongFormValues
  isEdit?: boolean
  mode?: "direct" | "contribution"
  contributionId?: string
  defaultNotes?: string
  onContributionComplete?: () => void
}

const steps = [
  { id: 1, name: "Basic Information", description: "Song type, title, and essential details" },
  { id: 2, name: "Lyrics", description: "Add song verses and lyrics" },
  { id: 3, name: "Media (Optional)", description: "Add sheet music, audio, or video links" },
  { id: 4, name: "Review & Submit", description: "Review and submit your song" },
]

const timeSignatures = ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"]

// Minimal shape of a song coming from the API, sufficient for the form transform
type ApiSong = {
  id: string
  sectionId: string | null
  section?: {
    id: string
  } | null
  songNumber: number | null
  language: SongFormValues["language"]
  title: string
  titleKreyol?: string | null
  subtitle?: string | null
  subtitleKreyol?: string | null
  companionSongId?: string | null
  tune?: string | null
  meter?: string | null
  musicalKey?: string | null
  timeSignature?: string | null
  tempo?: string | null
  author?: string | null
  authorKreyol?: string | null
  composer?: string | null
  translator?: string | null
  arranger?: string | null
  yearWritten?: number | null
  copyrightStatus?: SongFormValues["copyrightStatus"] | null
  copyrightInfo?: string | null
  difficulty?: SongFormValues["difficulty"] | null
  firstLine?: string | null
  firstLineKreyol?: string | null
  summary?: string | null
  notes?: string | null
  status?: SongFormValues["status"] | null
  verses?: {
    id: string
    type: string
    verseNumber: number | null
    label: string | null
    labelKreyol: string | null
    sortOrder: number
    isRepeated: boolean
    lines?: {
      id: string
      text: string
      textKreyol: string | null
      lineNumber: number
      isIndented: boolean
      indent: number
    }[]
  }[]
  themes?: {
    theme: {
      id: string
    }
  }[]
  biblicalRefs?: {
    biblicalReference: {
      id: string
      book: string
      chapter: number
      verseStart: number
      verseEnd: number
    }
  }[]
  media?: {
    id: string
    type: string
    url: string
    title: string | null
  }[]
}

// Transform API song data to form format
function transformSongToFormData(song: ApiSong | SongFormValues | null | undefined): Partial<SongFormValues> {
  if (!song) return defaultValues

  if ("songType" in song) {
    return song as SongFormValues
  }

  return {
    songType: song.section ? "hymnal" : "popular",
    sectionId: song.sectionId || undefined,
    songNumber: song.songNumber || undefined,
    language: song.language,
    title: song.title,
    titleKreyol: song.titleKreyol || undefined,
    subtitle: song.subtitle || undefined,
    subtitleKreyol: song.subtitleKreyol || undefined,
    companionSongId: song.companionSongId || undefined,
    tune: song.tune || undefined,
    meter: song.meter || undefined,
    musicalKey: song.musicalKey || undefined,
    timeSignature: song.timeSignature || "4/4",
    tempo: song.tempo || undefined,
    author: song.author || undefined,
    authorKreyol: song.authorKreyol || undefined,
    composer: song.composer || undefined,
    translator: song.translator || undefined,
    arranger: song.arranger || undefined,
    yearWritten: song.yearWritten || undefined,
    copyrightStatus: song.copyrightStatus || "UNKNOWN",
    copyrightInfo: song.copyrightInfo || undefined,
    verses: song.verses?.map((verse: any) => ({
      id: verse.id,
      type: verse.type,
      verseNumber: verse.verseNumber,
      label: verse.label || `${verse.type} ${verse.verseNumber || ""}`.trim(),
      labelKreyol: verse.labelKreyol,
      sortOrder: verse.sortOrder,
      isRepeated: verse.isRepeated,
      lines: verse.lines?.map((line: any) => ({
        id: line.id,
        text: line.text,
        textKreyol: line.textKreyol || "",
        lineNumber: line.lineNumber,
        isIndented: line.isIndented,
        indent: line.indent,
      })) || [],
    })) || [],
    themeIds: song.themes?.map((t: any) => t.theme.id) || [],
    biblicalReferences: song.biblicalRefs?.map((ref: any) => ({
      id: ref.biblicalReference.id,
      book: ref.biblicalReference.book,
      chapter: ref.biblicalReference.chapter,
      verseStart: ref.biblicalReference.verseStart,
      verseEnd: ref.biblicalReference.verseEnd,
    })) || [],
    media: song.media?.map((m: any) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      title: m.title || undefined,
    })) || [],
    difficulty: song.difficulty || undefined,
    firstLine: song.firstLine || undefined,
    firstLineKreyol: song.firstLineKreyol || undefined,
    summary: song.summary || undefined,
    notes: song.notes || undefined,
    status: song.status || "DRAFT",
  }
}

function hasSongId(song?: ApiSong | SongFormValues): song is ApiSong {
  return !!song && "id" in song
}

export function AddSongForm({
  initialData,
  isEdit = false,
  mode = "direct",
  contributionId,
  defaultNotes,
  onContributionComplete,
}: AddSongFormProps = {}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [sections, setSections] = React.useState<Section[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const isContributionMode = mode === "contribution"
  const [submissionNotes, setSubmissionNotes] = React.useState(defaultNotes || "")
  const [duplicateNotice, setDuplicateNotice] = React.useState<{ id?: string; message: string } | null>(null)

  // Transform initial data if editing
  const formDefaultValues = React.useMemo(() => {
    if (isEdit && initialData) {
      return transformSongToFormData(initialData)
    }
    return defaultValues
  }, [isEdit, initialData])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
    reset,
  } = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema) as Resolver<SongFormValues>,
    defaultValues: formDefaultValues,
    mode: "onChange",
  })

  // Reset form when initial data changes
  React.useEffect(() => {
    if (isEdit && initialData) {
      reset(transformSongToFormData(initialData))
    }
  }, [isEdit, initialData, reset])

  React.useEffect(() => {
    if (typeof defaultNotes === "string") {
      setSubmissionNotes(defaultNotes)
    }
  }, [defaultNotes])

  const songType = watch("songType")
  const language = watch("language")
  const copyrightStatus = watch("copyrightStatus")
  const themeIds = watch("themeIds")
  const biblicalReferences = watch("biblicalReferences")
  const media = watch("media")
  const difficulty = watch("difficulty")
  const verses = watch("verses")

  // Fetch sections on mount
  React.useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch("/api/sections")
        if (response.ok) {
          const data = await response.json()
          setSections(data.sections)
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error)
      }
    }
    fetchSections()
  }, [])

  const submitSong = async (data: SongFormValues, statusOverride?: "DRAFT" | "PUBLISHED") => {
    setIsLoading(true)
    try {
      if (isContributionMode) {
        const submitData: SongFormValues = {
          ...data,
          status: "PENDING_REVIEW",
        }

        const endpoint = contributionId ? `/api/admin/contributions/${contributionId}` : "/api/admin/contributions"
        const method = contributionId ? "PATCH" : "POST"
        const payload = contributionId
          ? { data: submitData, notes: submissionNotes || undefined }
          : { type: "NEW_SONG", data: submitData, notes: submissionNotes || undefined }

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 409 || result.existingSongId) {
            setDuplicateNotice({
              id: result.existingSongId,
              message: result.error || "A similar song already exists.",
            })
            return
          }
          const errorMessage = result.error || "Failed to submit contribution"
          const details = result.details ? `\n\nDetails:\n${JSON.stringify(result.details, null, 2)}` : ""
          throw new Error(errorMessage + details)
        }

        if (result.existingSongId) {
          setDuplicateNotice({
            id: result.existingSongId,
            message: result.error || "A similar song already exists.",
          })
          return
        }

        toast.success(
          contributionId
            ? "Contribution updated and resubmitted for review"
            : "Contribution submitted for review",
          {
            description: "We'll notify you once an admin reviews your submission.",
            duration: 5000,
          }
        )

        if (onContributionComplete) {
          onContributionComplete()
        } else {
          router.push("/admin/contributions/my")
        }
        return
      }

      // Use status override if provided
      const submitData = statusOverride ? { ...data, status: statusOverride } : data

      const songIdForEdit = hasSongId(initialData) ? initialData.id : undefined
      const url = isEdit && songIdForEdit ? `/api/songs/${songIdForEdit}` : "/api/songs"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          const existingId = result.songId || result.existingSongId
          toast.error(result.error || "This song already exists.", {
            description: existingId ? (
              <span>
                <a
                  href={`/songs/${existingId}`}
                  className="underline"
                >
                  View existing song
                </a>
              </span>
            ) : undefined,
            duration: 6000,
          })
          return
        }

        const errorMessage = result.error || `Failed to ${isEdit ? "update" : "save"} song`
        const details = result.details ? `\n\nDetails:\n${JSON.stringify(result.details, null, 2)}` : ""
        throw new Error(errorMessage + details)
      }

      const redirectPath = "/admin/songs"

      toast.success(
        `Song "${result.song.title}" ${isEdit ? "updated" : data.status === "PUBLISHED" ? "published" : "saved"} successfully!`,
        {
          description: isEdit
            ? "Your changes have been saved"
            : data.status === "PUBLISHED"
            ? "Your song is now visible to everyone"
            : "You can continue editing before publishing",
          duration: 4000,
        }
      )

      // Redirect after a short delay to let user see the toast
      setTimeout(() => {
        router.push(redirectPath)
      }, 500)
    } catch (error) {
      console.error("Error submitting form:", error)

      // Show error toast
      let errorMsg = `Failed to ${isEdit ? "update" : "save"} song. Please try again.`
      if (error instanceof Error) {
        errorMsg = error.message
      }

      toast.error("Failed to save song", {
        description: errorMsg,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Wrapper for form onSubmit (without status override)
  const onSubmit = (data: SongFormValues) => submitSong(data)

  const nextStep = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step: number): (keyof SongFormValues)[] => {
    switch (step) {
      case 1:
        // Basic Information - validate required fields
        const fields: (keyof SongFormValues)[] = ["songType", "title", "copyrightStatus"]
        if (songType === "hymnal") {
          fields.push("sectionId", "songNumber", "language")
        }
        return fields
      case 2:
        return [] // Lyrics are optional
      case 3:
        return [] // Media is optional
      case 4:
        return [] // Review step
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step column */}
              <div className="flex flex-col items-center" style={{ flex: index === steps.length - 1 ? '0 0 auto' : '1 1 0%' }}>
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors shrink-0",
                    currentStep > step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {/* Label */}
                <div className="mt-3 text-center w-full px-1">
                  <p className={cn(
                    "text-xs font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex items-start pt-5 flex-1">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <FormField
                  label="Song Type"
                  required
                  error={errors.songType?.message}
                >
                  <RadioGroup>
                    <RadioGroupItem
                      {...register("songType")}
                      value="hymnal"
                      id="hymnal"
                      label="Chant d'Espérance Hymn"
                    />
                    <RadioGroupItem
                      {...register("songType")}
                      value="popular"
                      id="popular"
                      label="Popular Worship Song"
                    />
                  </RadioGroup>
                </FormField>

                {songType === "hymnal" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        label="Section"
                        required
                        error={errors.sectionId?.message}
                      >
                        <Select {...register("sectionId")}>
                          <option value="">Select a section...</option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>

                      <FormField
                        label="Song Number"
                        required
                        error={errors.songNumber?.message}
                      >
                        <Input
                          type="number"
                          placeholder="e.g., 145"
                          {...register("songNumber", { valueAsNumber: true })}
                        />
                      </FormField>

                      <FormField
                        label="Language"
                        required
                        error={errors.language?.message}
                      >
                        <Select {...register("language")}>
                          <option value="FRANCAIS">Français</option>
                          <option value="KREYOL">Kreyòl</option>
                          <option value="BILINGUAL">Bilingual (Français/Kreyòl)</option>
                        </Select>
                      </FormField>
                    </div>
                  </>
                )}

                {songType === "popular" && (
                  <FormField
                    label="Language"
                    required
                    error={errors.language?.message}
                  >
                    <Select {...register("language")}>
                      <option value="">Select language...</option>
                      <option value="ENGLISH">English</option>
                      <option value="SPANISH">Spanish</option>
                      <option value="FRANCAIS">Français</option>
                      <option value="KREYOL">Kreyòl</option>
                      <option value="BILINGUAL">Bilingual</option>
                    </Select>
                  </FormField>
                )}

                <FormField
                  label="Title"
                  required
                  error={errors.title?.message}
                >
                  <Input
                    placeholder={language === "KREYOL" ? "Enter Kreyòl title..." : "Enter French title..."}
                    {...register("title")}
                  />
                </FormField>

                <FormField
                  label={language === "FRANCAIS" ? "Title in Kreyòl" : "Title in French"}
                  error={errors.titleKreyol?.message}
                >
                  <Input
                    placeholder={language === "FRANCAIS" ? "Enter Kreyòl translation..." : "Enter French translation..."}
                    {...register("titleKreyol")}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Subtitle (optional)"
                    error={errors.subtitle?.message}
                  >
                    <Input
                      placeholder="Enter subtitle..."
                      {...register("subtitle")}
                    />
                  </FormField>

                  <FormField
                    label="Subtitle in Kreyòl (optional)"
                    error={errors.subtitleKreyol?.message}
                  >
                    <Input
                      placeholder="Enter Kreyòl subtitle..."
                      {...register("subtitleKreyol")}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Copyright Status"
                  required
                  error={errors.copyrightStatus?.message}
                >
                  <Select {...register("copyrightStatus")}>
                    <option value="PUBLIC_DOMAIN">Public Domain</option>
                    <option value="COPYRIGHTED">Copyrighted</option>
                    <option value="CREATIVE_COMMONS">Creative Commons</option>
                    <option value="UNKNOWN">Unknown</option>
                  </Select>
                </FormField>

                {copyrightStatus === "COPYRIGHTED" && (
                  <>
                    <FormField
                      label="Copyright Information"
                      error={errors.copyrightInfo?.message}
                    >
                      <Textarea
                        placeholder="Enter copyright holder and details..."
                        rows={3}
                        {...register("copyrightInfo")}
                      />
                    </FormField>

                    <FormField
                      label="CCLI Number (if applicable)"
                      error={errors.ccliNumber?.message}
                    >
                      <Input
                        placeholder="e.g., 12345678"
                        {...register("ccliNumber")}
                      />
                    </FormField>
                  </>
                )}

                {/* Advanced Settings Toggle */}
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full justify-between"
                  >
                    <span className="font-medium">Advanced Settings (Optional)</span>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showAdvanced && (
                    <div className="mt-6 space-y-6 p-4 bg-muted/30 rounded-lg">
                      {/* Musical Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Musical Information</h3>
                        <FormField
                          label="Tune Name"
                          error={errors.tune?.message}
                        >
                          <Input
                            placeholder="e.g., HYFRYDOL, AMAZING GRACE"
                            {...register("tune")}
                          />
                        </FormField>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label="Meter"
                            error={errors.meter?.message}
                          >
                            <Input
                              placeholder="e.g., 8.7.8.7.D"
                              {...register("meter")}
                            />
                          </FormField>

                          <FormField
                            label="Musical Key"
                            error={errors.musicalKey?.message}
                          >
                            <Input
                              placeholder="e.g., D Major"
                              {...register("musicalKey")}
                            />
                          </FormField>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label="Time Signature"
                            error={errors.timeSignature?.message}
                          >
                            <Select {...register("timeSignature")}>
                              <option value="">Select time signature...</option>
                              {timeSignatures.map((sig) => (
                                <option key={sig} value={sig}>
                                  {sig}
                                </option>
                              ))}
                            </Select>
                          </FormField>

                          <FormField
                            label="Tempo / BPM"
                            error={errors.tempo?.message}
                          >
                            <Input
                              placeholder="e.g., Moderato, 120 BPM"
                              {...register("tempo")}
                            />
                          </FormField>
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-sm">Credits & Attribution</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label="Author / Lyricist"
                            error={errors.author?.message}
                          >
                            <Input
                              placeholder="Enter author name..."
                              {...register("author")}
                            />
                          </FormField>

                          <FormField
                            label="Composer"
                            error={errors.composer?.message}
                          >
                            <Input
                              placeholder="Enter composer name..."
                              {...register("composer")}
                            />
                          </FormField>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            label="Translator"
                            error={errors.translator?.message}
                          >
                            <Input
                              placeholder="Enter translator name..."
                              {...register("translator")}
                            />
                          </FormField>

                          <FormField
                            label="Arranger"
                            error={errors.arranger?.message}
                          >
                            <Input
                              placeholder="Enter arranger name..."
                              {...register("arranger")}
                            />
                          </FormField>
                        </div>

                        <FormField
                          label="Year Written"
                          error={errors.yearWritten?.message}
                        >
                          <Input
                            type="number"
                            placeholder="e.g., 1779"
                            {...register("yearWritten", { valueAsNumber: true })}
                          />
                        </FormField>
                      </div>

                      {/* Themes */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-sm">Themes & Categories</h3>
                        <ThemeSelector
                          selectedIds={themeIds || []}
                          onChange={(ids) => setValue("themeIds", ids)}
                        />

                        <FormField
                          label="Difficulty Level"
                          error={errors.difficulty?.message}
                        >
                          <Select
                            value={difficulty || ""}
                            onChange={(e) => setValue("difficulty", e.target.value as any)}
                          >
                            <option value="">Select difficulty...</option>
                            <option value="EASY">Easy - Simple melody</option>
                            <option value="MODERATE">Moderate - Some complexity</option>
                            <option value="HARD">Hard - Complex harmonies</option>
                          </Select>
                        </FormField>
                      </div>

                      {/* Biblical References */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-sm">Biblical References</h3>
                        <BiblicalReferences
                          references={biblicalReferences || []}
                          onChange={(refs) => setValue("biblicalReferences", refs)}
                        />
                      </div>

                      {songType === "hymnal" && (
                        <div className="border-t pt-4">
                          <FormField
                            label="Companion Song"
                            error={errors.companionSongId?.message}
                          >
                            <Select {...register("companionSongId")}>
                              <option value="">No companion song</option>
                              {/* TODO: Populate with songs from same section */}
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Link to the companion song (same number, different language)
                            </p>
                          </FormField>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Lyrics */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <LyricsEditor
                  verses={verses || []}
                  onChange={(updatedVerses) => setValue("verses", updatedVerses)}
                  language={language}
                />
              </div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <MediaManager
                  media={media || []}
                  onChange={(items) => setValue("media", items)}
                />
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <SongReview
                  data={watch()}
                  errors={errors}
                />
                {isContributionMode && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Notes for the reviewer (optional)
                    </label>
                    <Textarea
                      placeholder="Share any context or special instructions for the reviewer."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      These notes are visible only to administrators handling your submission.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
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
            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : isContributionMode ? (
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await trigger()
                  if (isValid) {
                    handleSubmit((data) => submitSong(data))()
                  } else {
                    toast.error("Please fix the form errors before submitting")
                  }
                }}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading
                  ? "Submitting..."
                  : contributionId
                  ? "Resubmit for Review"
                  : "Submit for Review"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const isValid = await trigger()
                    if (isValid) {
                      handleSubmit((data) => submitSong(data, "DRAFT"))()
                    } else {
                      toast.error("Please fix the form errors before saving")
                    }
                  }}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    const isValid = await trigger()
                    if (isValid) {
                      handleSubmit((data) => submitSong(data, "PUBLISHED"))()
                    } else {
                      toast.error("Please fix the form errors before publishing")
                    }
                  }}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? "Publishing..." : "Publish Song"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      {duplicateNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-semibold">Possible Duplicate</h3>
            <p className="text-sm text-muted-foreground">
              {duplicateNotice.message}
            </p>
            <div className="flex flex-col gap-2">
              {duplicateNotice.id && (
                <Button
                  onClick={() => {
                    router.push(`/songs/${duplicateNotice.id}`)
                    setDuplicateNotice(null)
                  }}
                >
                  View existing song
                </Button>
              )}
              <Button variant="outline" onClick={() => setDuplicateNotice(null)}>
                Back to form
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
