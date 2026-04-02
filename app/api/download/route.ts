import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

const W = 1080
const H = 840

function buildSvgText(
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  stroke?: string,
): string {
  const strokeAttrs = stroke
    ? `stroke="${stroke}" stroke-width="3" paint-order="stroke"`
    : ""
  return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="bold" fill="${color}" ${strokeAttrs} text-anchor="middle" dominant-baseline="middle">${text}</text>`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const templateFile = searchParams.get("templateFile") ?? ""
    const code = searchParams.get("code") ?? ""
    const platform = searchParams.get("platform") ?? ""
    const product = searchParams.get("product") ?? "giftcard"
    const raffleNumber = searchParams.get("raffleNumber")

    if (!templateFile || !code || !platform) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const templatePath = path.join(process.cwd(), "public", "templates", templateFile)

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found: " + templateFile }, { status: 404 })
    }

    // Embed image as base64 data URI
    const imageBuffer = fs.readFileSync(templatePath)
    const ext = templateFile.split(".").pop()?.toLowerCase() ?? "png"
    const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png"
    const base64 = imageBuffer.toString("base64")
    const dataUri = `data:${mimeType};base64,${base64}`

    // Build text overlays
    let svgContent = ""

    if (platform === "roblox") {
      const x = W * (0.195 + 0.61 / 2)
      const y = H * (0.5625 + 0.155 / 2)
      svgContent += buildSvgText(code, x, y, Math.round(W * 0.04), "#000000")

      if (raffleNumber) {
        const rx = W * 0.5
        const ry = H * 0.65 + H * 0.04
        svgContent += buildSvgText(`#${raffleNumber}`, rx, ry, Math.round(W * 0.04), "#facc15", "#000000")
      }
    } else if (platform === "steam") {
      const x = W * 0.5
      const y = H * (0.541 + 0.030 / 2)
      svgContent += buildSvgText(code, x, y, Math.round(W * 0.022), "#000000")
    }

    const imageAspect = platform === "steam"
      ? `preserveAspectRatio="xMidYMid meet"`
      : `preserveAspectRatio="xMidYMid slice"`

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="black"/>
  <image href="${dataUri}" x="0" y="0" width="${W}" height="${H}" ${imageAspect}/>
  ${svgContent}
</svg>`

    const filename = `${platform}-${product.replace(/ /g, "-")}-giftcard.svg`

    return new NextResponse(Buffer.from(svg, "utf-8"), {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[v0] Download GET error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
