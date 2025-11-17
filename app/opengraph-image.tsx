import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Chant d'Espérance - Digital Haitian Hymnal"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
            textAlign: 'center',
          }}
        >
          {/* Music Icon */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              margin: 0,
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}
          >
            Chant d&apos;Espérance
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '32px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              margin: 0,
              marginBottom: '16px',
            }}
          >
            Songs of Hope
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: '24px',
              fontWeight: '400',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
              maxWidth: '800px',
            }}
          >
            Digital Haitian Hymnal • Français & Kreyòl
          </p>

          {/* Stats Badge */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                📖 Browse Hymns
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                🎵 Bilingual Lyrics
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
