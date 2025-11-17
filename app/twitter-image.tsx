import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Chant d'Espérance - Digital Haitian Hymnal"
export const size = {
  width: 1200,
  height: 600,
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
            padding: '60px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Music Icon */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '25px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <svg
              width="56"
              height="56"
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
              fontSize: '64px',
              fontWeight: '900',
              color: 'white',
              margin: 0,
              marginBottom: '16px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            Chant d&apos;Espérance
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              margin: 0,
              marginBottom: '12px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            Songs of Hope • Chante Lespwa
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: '22px',
              fontWeight: '400',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
              maxWidth: '700px',
              lineHeight: 1.5,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Digital Haitian Adventist Hymnal • Français & Kreyòl
          </p>

          {/* Stats Badge */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                📖 Search & Browse
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                🎵 Projection Mode
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
