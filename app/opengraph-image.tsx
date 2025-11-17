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
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,.03) 10px,
              rgba(255,255,255,.03) 20px
            )`,
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Music Icon */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
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
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
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
              lineHeight: 1.5,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
                backdropFilter: 'blur(10px)',
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
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
                backdropFilter: 'blur(10px)',
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
