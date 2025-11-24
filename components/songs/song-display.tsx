"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Music, User, Calendar, Book, Tag, FileText } from "lucide-react";

const youtubeRegex =
  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

const extractYouTubeId = (url: string) => {
  const match = url.match(youtubeRegex)
  return match ? match[1] : null
}

interface SongDisplayProps {
  song: any; // Using any to accept Prisma's return type
}

export function SongDisplay({ song }: SongDisplayProps) {
  const getVerseLabel = (verse: any) => {
    const type = verse.verseType;
    const num = verse.verseNumber;

    switch (type) {
      case "CHORUS":
      case "REFRAIN":
        return "Refrain";
      case "BRIDGE":
        return "Bridge";
      case "PRE_CHORUS":
        return "Pre-Chorus";
      case "INTRO":
        return "Intro";
      case "OUTRO":
        return "Outro";
      case "CODA":
        return "Coda";
      default:
        return num ? `Verse ${num}` : "Verse";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-8 print:shadow-none">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {song.songNumber && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    #{song.songNumber}
                  </Badge>
                )}
                {song.language && (
                  <Badge variant="outline">
                    {song.language === "FRANCAIS"
                      ? "Français"
                      : song.language === "KREYOL"
                        ? "Kreyòl"
                        : song.language === "BILINGUAL"
                          ? "Bilingual"
                          : song.language}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {song.title || song.titleKreyol || "Untitled"}
              </h1>
              {song.titleKreyol && song.titleKreyol !== song.title && (
                <h2 className="text-2xl md:text-3xl text-gray-600 mb-2">
                  {song.titleKreyol}
                </h2>
              )}
              {(song.subtitle || song.subtitleKreyol) && (
                <p className="text-lg text-gray-500">
                  {song.subtitle || song.subtitleKreyol}
                  {song.subtitleKreyol && song.subtitleKreyol !== song.subtitle && (
                    <span className="block text-base">{song.subtitleKreyol}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {song.author && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Author</p>
                  <p className="font-medium">{song.author}</p>
                </div>
              </div>
            )}
            {song.composer && (
              <div className="flex items-start gap-2">
                <Music className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Composer</p>
                  <p className="font-medium">{song.composer}</p>
                </div>
              </div>
            )}
            {song.translator && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Translator</p>
                  <p className="font-medium">{song.translator}</p>
                </div>
              </div>
            )}
            {song.arranger && (
              <div className="flex items-start gap-2">
                <Music className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Arranger</p>
                  <p className="font-medium">{song.arranger}</p>
                </div>
              </div>
            )}
            {song.yearWritten && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Year Written</p>
                  <p className="font-medium">{song.yearWritten}</p>
                </div>
              </div>
            )}
            {song.tune && (
              <div className="flex items-start gap-2">
                <Music className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Tune</p>
                  <p className="font-medium">{song.tune}</p>
                </div>
              </div>
            )}
          </div>

          {/* Musical Information */}
          {(song.meter || song.musicalKey || song.timeSignature || song.tempo) && (
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {song.meter && (
                <Badge variant="outline">
                  Meter: {song.meter}
                </Badge>
              )}
              {song.musicalKey && (
                <Badge variant="outline">
                  Key: {song.musicalKey}
                </Badge>
              )}
              {song.timeSignature && (
                <Badge variant="outline">
                  Time: {song.timeSignature}
                </Badge>
              )}
              {song.tempo && (
                <Badge variant="outline">
                  Tempo: {song.tempo}
                </Badge>
              )}
            </div>
          )}

          {/* Collection/Section */}
          {song.section && (
            <div className="flex items-start gap-2 pt-4 border-t">
              <Book className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Collection & Section</p>
                <p className="font-medium">
                  {song.section.collection.name}
                  {song.section.collection.nameKreyol &&
                    song.section.collection.nameKreyol !== song.section.collection.name && (
                      <span className="text-gray-600"> ({song.section.collection.nameKreyol})</span>
                    )}
                  {" → "}
                  <Link
                    href={`/sections/${song.section.id}`}
                    className="text-primary hover:underline"
                  >
                    {song.section.name}
                    {song.section.nameKreyol && song.section.nameKreyol !== song.section.name && (
                      <span className="text-gray-600"> ({song.section.nameKreyol})</span>
                    )}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Themes */}
          {song.themes.length > 0 && (
            <div className="flex items-start gap-2 pt-4 border-t">
              <Tag className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Themes</p>
                <div className="flex flex-wrap gap-2">
                  {song.themes.map(({ theme }: any) => (
                    <Badge key={theme.id} variant="secondary">
                      {theme.name}
                      {theme.nameKreyol && theme.nameKreyol !== theme.name && (
                        <span className="text-gray-600"> / {theme.nameKreyol}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Biblical References */}
          {song.biblicalRefs.length > 0 && (
            <div className="flex items-start gap-2 pt-4 border-t">
              <Book className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-2">Biblical References</p>
                <div className="flex flex-wrap gap-2">
                  {song.biblicalRefs.map(({ biblicalReference: ref }: any) => (
                    <Badge key={ref.id} variant="outline">
                      {ref.book} {ref.chapter}:{ref.verseStart}
                      {ref.verseEnd && ref.verseEnd !== ref.verseStart && `-${ref.verseEnd}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Companion Song */}
          {song.companionSong && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Companion Song</p>
              <Link href={`/songs/${song.companionSong.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                  #{song.companionSong.songNumber} - {song.companionSong.title || song.companionSong.titleKreyol}
                </Badge>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Lyrics */}
      <Card className="p-8 print:shadow-none">
        <div className="space-y-8">
          {song.verses.map((verse: any) => (
            <div key={verse.id} className="space-y-2">
              <h3 className="font-semibold text-primary uppercase text-sm tracking-wide">
                {getVerseLabel(verse)}
              </h3>
              <div className="space-y-1">
                {verse.lines.map((line: any) => (
                  <div
                    key={line.id}
                    style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                    className="leading-relaxed"
                  >
                    {line.text && (
                      <p className="text-lg">{line.text}</p>
                    )}
                    {line.textKreyol && line.textKreyol !== line.text && (
                      <p className="text-lg text-gray-600 italic">{line.textKreyol}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Media */}
      {song.media && song.media.length > 0 && (
        <Card className="p-6 print:hidden">
          <h3 className="font-semibold text-lg mb-4">Media</h3>
          <div className="space-y-4">
            {song.media.map((media: any) => {
              const isYoutube =
                media.type === "VIDEO" &&
                typeof media.url === "string" &&
                /youtu(?:\.be|be\.com)/i.test(media.url)
              const youtubeId = isYoutube ? extractYouTubeId(media.url) : null

              return (
                <div key={media.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    {!isYoutube && (
                      <Badge variant="outline">
                        <a href={media.url} target="_blank" rel="noopener noreferrer">
                          Open
                        </a>
                      </Badge>
                    )}
                  </div>
                  {isYoutube && youtubeId ? (
                    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                        title={media.title || "YouTube video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </div>
                  ) : (
                    media.type === "AUDIO" && (
                      <audio controls className="w-full">
                        <source src={media.url} />
                        Your browser does not support the audio element.
                      </audio>
                    )
                  )}
                  {media.description && (
                    <p className="text-sm text-gray-500">{media.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Copyright */}
      {song.copyrightInfo && (
        <div className="text-center text-sm text-gray-500 print:block">
          <p>{song.copyrightInfo}</p>
          {song.copyrightStatus && (
            <p className="mt-1">Status: {song.copyrightStatus.replace("_", " ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
