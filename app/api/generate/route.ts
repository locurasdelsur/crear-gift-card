import { NextRequest, NextResponse } from "next/server"

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzB_qODglc3IJM4klYrlf79VNX38qWRFbzC1JyT27VkotDPCygYMQZ88SH3T3MGA8ps/exec"

// Base numbers for each product (used as fallback if no data exists)
const baseNumbers: Record<string, number> = {
  "roblox-5 USD": 50000,
  "roblox-10 USD": 100000,
  "roblox-800 Robux": 80000,
  "steam-5 USD": 50,
  "steam-10 USD": 100,
  "steam-20 USD": 200,
}

// Template mapping
const templateMap: Record<string, string> = {
  "roblox-5 USD": "roblox-5.png",
  "roblox-10 USD": "roblox-10.png",
  "roblox-800 Robux": "roblox-800.png",
  "steam-5 USD": "steam-5.png",
  "steam-10 USD": "steam-10.png",
  "steam-20 USD": "steam-20.png",
}

// Fetch the last raffle number from Google Sheets for a specific platform and product
async function getLastRaffleNumber(platform: string, product: string): Promise<number> {
  const key = `${platform}-${product}`
  const sheetName = platform === "roblox" ? "Roblox" : "Steam"
  
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getLastNumber&sheetName=${sheetName}&product=${encodeURIComponent(product)}`, {
      method: "GET",
      redirect: "follow",
    })
    
    const data = await response.json()
    
    if (data.lastNumber && typeof data.lastNumber === "number") {
      return data.lastNumber
    }
  } catch (error) {
    console.error("[v0] Failed to get last raffle number:", error)
  }
  
  // Return base number as fallback
  return baseNumbers[key] || 0
}

async function getNextNumber(platform: string, product: string): Promise<number> {
  const lastNumber = await getLastRaffleNumber(platform, product)
  return lastNumber + 1
}

export async function POST(req: NextRequest) {
  try {
    const { platform, product, code, name, phone, participates } = await req.json()

    if (!platform || !product || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const key = `${platform}-${product}`
    const templateFile = templateMap[key]

    if (!templateFile) {
      return NextResponse.json({ error: "Invalid platform or product" }, { status: 400 })
    }

    let raffleNumber: number | null = null

    if (participates) {
      // Tarjeta CON sorteo → guardar en hoja "Roblox" o "Steam"
      if (!name || !phone) {
        return NextResponse.json({ error: "Name and phone required for raffle" }, { status: 400 })
      }
      
      // Get the next sequential raffle number from Google Sheets
      raffleNumber = await getNextNumber(platform, product)

      const sheetNameSorteo = platform === "roblox" ? "Roblox" : "Steam"
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "sorteo", platform, product, name, phone, code, number: raffleNumber, sheetName: sheetNameSorteo }),
          redirect: "follow",
        })
      } catch (error) {
        console.error("[v0] Failed to save raffle to Sheets:", error)
      }
    } else {
      // Tarjeta SIN sorteo → guardar en hoja "RobloxML" o "SteamML"
      const sheetName = platform === "roblox" ? "RobloxML" : "SteamML"
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "tarjeta", platform, product, code, sheetName }),
          redirect: "follow",
        })
      } catch (error) {
        console.error("[v0] Failed to save card to Sheets:", error)
      }
    }

    // Get template URL
    const templateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/templates/${templateFile}`

    // Return data for client-side rendering with CSS positioning
    return NextResponse.json({
      success: true,
      templateUrl,
      code,
      raffleNumber,
      platform,
      product,
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
