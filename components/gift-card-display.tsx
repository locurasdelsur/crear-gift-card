"use client"

import { useRef } from "react"

interface GiftCardDisplayProps {
  templateUrl: string
  code: string
  raffleNumber?: number | null
  platform: string
  product: string
}

export function GiftCardDisplay({ templateUrl, code, raffleNumber, platform }: GiftCardDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Platform-specific positioning for the overlay text
  const getCodeBoxStyle = (): React.CSSProperties => {
    if (platform === "roblox") {
      return {
        position: "absolute",
        left: "19.5%",
        top: "56.25%",
        width: "61%",
        height: "15.5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    } else if (platform === "steam") {
      return {
        position: "absolute",
        left: "50%",
        top: "54.1%",
        transform: "translateX(-50%)",
        width: "55.7%",
        height: "3.0%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }
    }
    return {}
  }

  const getRaffleBoxStyle = (): React.CSSProperties => {
    return {
      position: "absolute",
      left: "2.5%",
      bottom: "3%",
    }
  }

  // Font size for the code text - more responsive
  const getCodeFontSize = (): string => {
    if (platform === "steam") return "clamp(5px, 1.8vw, 7.5px)"
    return "clamp(8px, 3.5vw, 23.04px)"
  }

  return (
    <div
      ref={containerRef}
      data-gift-card-container
      className="relative w-full overflow-hidden rounded-lg border border-slate-600 bg-black"
      style={{ aspectRatio: "1080 / 840" }}
    >
      {/* Background Template Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={templateUrl}
        alt="Gift Card Template"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 h-full w-full ${platform === "steam" ? "object-contain" : "object-cover"}`}
      />

      {/* Code overlay */}
      <div style={getCodeBoxStyle()}>
        <span
          className="text-center font-bold text-black"
          style={{
            fontSize: getCodeFontSize(),
            lineHeight: "1.2",
            letterSpacing: platform === "steam" ? "0.2em" : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            textAlign: "center",
          }}
        >
          {code}
        </span>
      </div>

      {/* Raffle Number — esquina inferior izquierda */}
      {raffleNumber && (
        <div
          style={{
            ...getRaffleBoxStyle(),
            backgroundColor: "white",
            borderRadius: "4px",
            padding: "1% 2%",
            fontSize: "clamp(6px, 2vw, 15px)",
            color: "#1a1a1a",
            fontWeight: "bold",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          Sorteo: {raffleNumber}
        </div>
      )}
    </div>
  )
}
