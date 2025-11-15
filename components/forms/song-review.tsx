"use client"

import * as React from "react"
import { CheckCircle, AlertCircle, Music, FileText, Tag, Book, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBiblicalReference } from "@/lib/constants/song"
import { THEMES } from "@/lib/constants/themes"
import type { SongFormValues } from "@/lib/validations/song"

interface SongReviewProps {
  data: SongFormValues
  errors: Record<string, any>
}

export function SongReview({ data, errors }: SongReviewProps) {
  const hasErrors = Object.keys(errors).length > 0
  const selectedThemes = THEMES.filter((t) => data.themeIds?.includes(t.id))

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <Card className={hasErrors ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${hasErrors ? "text-red-900" : "text-green-900"}`}>
                {hasErrors ? "Please fix the following errors:" : "All fields are valid"}
              </h3>
              {hasErrors && (
                <ul className="mt-2 space-y-1 text-sm text-red-800">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      • {field}: {error.message || "Invalid value"}
                    </li>
                  ))}
                </ul>
              )}
              {!hasErrors && (
                <p className="mt-1 text-sm text-green-800">
                  Your song is ready to be submitted!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-700">Title</div>
              <div className="text-sm text-gray-900">{data.title || "—"}</div>
            </div>
            {data.titleKreyol && (
              <div>
                <div className="text-sm font-medium text-gray-700">Title (Kreyòl)</div>
                <div className="text-sm text-gray-900">{data.titleKreyol}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-700">Song Type</div>
              <Badge variant="secondary">
                {data.songType === "hymnal" ? "Hymnal" : "Popular Song"}
              </Badge>
            </div>
            {data.language && (
              <div>
                <div className="text-sm font-medium text-gray-700">Language</div>
                <Badge variant="outline">{data.language}</Badge>
              </div>
            )}
            {data.songNumber && (
              <div>
                <div className="text-sm font-medium text-gray-700">Song Number</div>
                <div className="text-sm text-gray-900">#{data.songNumber}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Musical Information */}
      {(data.tune || data.meter || data.musicalKey || data.timeSignature || data.tempo) && (
        <Card>
          <CardHeader>
            <CardTitle>Musical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {data.tune && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Tune</div>
                  <div className="text-sm text-gray-900">{data.tune}</div>
                </div>
              )}
              {data.meter && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Meter</div>
                  <div className="text-sm text-gray-900">{data.meter}</div>
                </div>
              )}
              {data.musicalKey && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Key</div>
                  <div className="text-sm text-gray-900">{data.musicalKey}</div>
                </div>
              )}
              {data.timeSignature && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Time Signature</div>
                  <div className="text-sm text-gray-900">{data.timeSignature}</div>
                </div>
              )}
              {data.tempo && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Tempo</div>
                  <div className="text-sm text-gray-900">{data.tempo}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credits */}
      {(data.author || data.composer || data.translator) && (
        <Card>
          <CardHeader>
            <CardTitle>Credits & Copyright</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.author && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Author</div>
                  <div className="text-sm text-gray-900">{data.author}</div>
                </div>
              )}
              {data.composer && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Composer</div>
                  <div className="text-sm text-gray-900">{data.composer}</div>
                </div>
              )}
              {data.translator && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Translator</div>
                  <div className="text-sm text-gray-900">{data.translator}</div>
                </div>
              )}
              {data.yearWritten && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Year Written</div>
                  <div className="text-sm text-gray-900">{data.yearWritten}</div>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Copyright Status</div>
              <Badge variant="outline">{data.copyrightStatus.replace(/_/g, " ")}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lyrics */}
      {data.verses && data.verses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lyrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.verses.map((verse, index) => (
                <div key={verse.id} className="space-y-2">
                  <Badge variant="secondary">{verse.label}</Badge>
                  <div className="space-y-1 pl-4 text-sm text-gray-800">
                    {verse.lines.map((line) => (
                      <div key={line.id}>{line.text}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      {selectedThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Themes & Categorization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedThemes.map((theme) => (
                <Badge key={theme.id} variant="secondary">
                  {theme.name}
                </Badge>
              ))}
            </div>
            {data.difficulty && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700">Difficulty</div>
                <Badge variant="outline">{data.difficulty}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Biblical References */}
      {data.biblicalReferences && data.biblicalReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Biblical References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.biblicalReferences.map((ref) => (
                <Badge key={ref.id} variant="outline" className="font-mono">
                  {formatBiblicalReference(ref)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media */}
      {data.media && data.media.filter((m) => m.url).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.media.filter((m) => m.url).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{item.type.replace(/_/g, " ")}</Badge>
                  {item.title && <span className="font-medium">{item.title}</span>}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {item.url}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
