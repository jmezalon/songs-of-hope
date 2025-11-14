"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { songFormSchema, type SongFormValues, defaultValues } from "@/lib/validations/song"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField } from "@/components/ui/form-field"
import { cn } from "@/lib/utils"

interface Section {
  id: string
  name: string
  nameKreyol: string | null
  collection: {
    name: string
    nameKreyol: string | null
  }
}

const steps = [
  { id: 1, name: "Song Type & Basic Info", description: "Choose song type and enter basic information" },
  { id: 2, name: "Musical Information", description: "Add musical details and metadata" },
  { id: 3, name: "Credits & Copyright", description: "Enter attribution and copyright information" },
]

const timeSignatures = ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"]

export function AddSongForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [sections, setSections] = React.useState<Section[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const songType = watch("songType")
  const language = watch("language")
  const copyrightStatus = watch("copyrightStatus")

  // Fetch sections on mount
  React.useEffect(() => {
    async function fetchSections() {
      try {
        const response = await fetch("/api/sections")
        if (response.ok) {
          const data = await response.json()
          setSections(data)
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error)
      }
    }
    fetchSections()
  }, [])

  const onSubmit = async (data: SongFormValues) => {
    setIsLoading(true)
    try {
      console.log("Form data:", data)
      // TODO: Implement API call to save song
      alert("Song form submitted! (API endpoint not yet implemented)")
      // router.push("/admin/songs")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Failed to save song. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
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
        const fields: (keyof SongFormValues)[] = ["songType", "title"]
        if (songType === "hymnal") {
          fields.push("sectionId", "songNumber", "language")
        }
        return fields
      case 2:
        return []
      case 3:
        return []
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
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
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors mx-2 mt-[-50px]",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Song Type & Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
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
                          <option value="BILINGUAL">Bilingual</option>
                        </Select>
                      </FormField>
                    </div>
                  </>
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

                {songType === "hymnal" && (
                  <FormField
                    label="Companion Song (optional)"
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
                )}
              </div>
            )}

            {/* Step 2: Musical Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
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
                      placeholder="e.g., 8.7.8.7.D, Common Meter"
                      {...register("meter")}
                    />
                  </FormField>

                  <FormField
                    label="Musical Key"
                    error={errors.musicalKey?.message}
                  >
                    <Input
                      placeholder="e.g., D Major, G minor"
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
            )}

            {/* Step 3: Credits & Copyright */}
            {currentStep === 3 && (
              <div className="space-y-4">
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
                    label="Author (Kreyòl)"
                    error={errors.authorKreyol?.message}
                  >
                    <Input
                      placeholder="Kreyòl author if different..."
                      {...register("authorKreyol")}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Composer"
                    error={errors.composer?.message}
                  >
                    <Input
                      placeholder="Enter composer name..."
                      {...register("composer")}
                    />
                  </FormField>

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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Song"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
