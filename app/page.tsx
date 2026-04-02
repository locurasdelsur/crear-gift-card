"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Loader2, Gift, Gamepad2 } from "lucide-react"
import { GiftCardDisplay } from "@/components/gift-card-display"

type Platform = "roblox" | "steam"

interface GenerateResponse {
  success: boolean
  templateUrl: string
  code: string
  raffleNumber: number | null
  platform: string
  product: string
  error?: string
}

const products: Record<Platform, string[]> = {
  roblox: ["5 USD", "10 USD", "800 Robux"],
  steam: ["5 USD", "10 USD", "20 USD"],
}

// v2
export default function GiftCardGenerator() {
  const [platform, setPlatform] = useState<Platform>("roblox")
  const [product, setProduct] = useState<string>(products.roblox[0])
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [participates, setParticipates] = useState(false)
  const [generatedData, setGeneratedData] = useState<GenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePlatformChange = (value: Platform) => {
    setPlatform(value)
    setProduct(products[value][0])
  }

  const handleSubmit = async () => {
    setError(null)

    if (!code.trim()) {
      setError("Por favor ingresa el código")
      return
    }

    if (participates && (!name.trim() || !phone.trim())) {
      setError("Completa nombre y teléfono para participar en el sorteo")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          product,
          code: code.trim(),
          name: name.trim(),
          phone: phone.trim(),
          participates,
        }),
      })

      const data: GenerateResponse = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al generar la imagen")
      }

      setGeneratedData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedData) return

    const W = 1080
    const H = 840
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, W, H)

      try {
        if (generatedData.platform === "steam") {
          const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
          const dw = img.naturalWidth * scale
          const dh = img.naturalHeight * scale
          ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
        } else {
          const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
          const dw = img.naturalWidth * scale
          const dh = img.naturalHeight * scale
          ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
        }
      } catch (e) {
        if (e instanceof Error && !e.message.includes("lab")) throw e
      }

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      if (generatedData.platform === "roblox") {
        ctx.fillStyle = "#000000"
        ctx.font = `bold ${Math.round(W * 0.04)}px Arial, sans-serif`
        ctx.fillText(generatedData.code, W * (0.195 + 0.61 / 2), H * (0.5625 + 0.155 / 2), W * 0.61)
        if (generatedData.raffleNumber) {
          const label = `Sorteo: ${generatedData.raffleNumber}`
          const fontSize = Math.round(W * 0.028)
          ctx.font = `bold ${fontSize}px Arial, sans-serif`
          const measured = ctx.measureText(label)
          const padX = W * 0.02
          const padY = H * 0.015
          const boxX = W * 0.025
          const boxW = measured.width + padX * 2
          const boxH = fontSize + padY * 2
          const boxY = H - boxH - H * 0.03
          ctx.fillStyle = "#ffffff"
          ctx.beginPath()
          ctx.roundRect(boxX, boxY, boxW, boxH, 8)
          ctx.fill()
          ctx.fillStyle = "#1a1a1a"
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"
          ctx.fillText(label, boxX + padX, boxY + boxH / 2)
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
        }
      } else if (generatedData.platform === "steam") {
        ctx.fillStyle = "#000000"
        ctx.font = `bold ${Math.round(W * 0.02)}px Arial, sans-serif`
        ctx.fillText(generatedData.code, W * 0.5, H * (0.541 + 0.030 / 2), W * 0.557)
      }

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${generatedData.platform}-${generatedData.product.replace(/ /g, "-")}-giftcard.png`
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, "image/png")
    }

    img.onerror = () => setError("No se pudo cargar la imagen del template.")
    img.src = generatedData.templateUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 py-4 sm:p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            <Gift className="mr-2 inline-block h-6 w-6 text-emerald-400 sm:h-8 sm:w-8" />
            Gift Card Generator
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">Genera imágenes de gift cards con códigos personalizados</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Form */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
                Configuración
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona la plataforma y completa los datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-slate-200">Plataforma</Label>
                <Select value={platform} onValueChange={(v) => handlePlatformChange(v as Platform)}>
                  <SelectTrigger id="platform" className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700">
                    <SelectItem value="roblox" className="text-white hover:bg-slate-600">
                      Roblox
                    </SelectItem>
                    <SelectItem value="steam" className="text-white hover:bg-slate-600">
                      Steam
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-slate-200">Producto</Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger id="product" className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700">
                    {products[platform].map((p) => (
                      <SelectItem key={p} value={p} className="text-white hover:bg-slate-600">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">Código de la Gift Card</Label>
                <Input
                  id="code"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center space-x-2 rounded-lg border border-slate-600 bg-slate-700/50 p-4">
                <Checkbox
                  id="participates"
                  checked={participates}
                  onCheckedChange={(checked) => setParticipates(checked === true)}
                  className="border-slate-500 data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="participates" className="cursor-pointer text-slate-200">
                  Participa en el sorteo
                </Label>
              </div>

              {participates && (
                <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 sm:space-y-4 sm:p-4">
                  <p className="text-sm text-emerald-400">Completa tus datos para el sorteo:</p>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Nombre y Apellido</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-200">{"Últimos 4 dígitos del celular"}</Label>
                    <Input
                      id="phone"
                      placeholder="1234"
                      maxLength={4}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:from-blue-600 hover:to-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Generar Gift Card
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Vista Previa</CardTitle>
              <CardDescription className="text-slate-400">
                Tu gift card generada aparecerá aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedData ? (
                <div className="space-y-4">
                  <div data-gift-card-image>
                    <GiftCardDisplay
                      templateUrl={generatedData.templateUrl}
                      code={generatedData.code}
                      raffleNumber={generatedData.raffleNumber}
                      platform={generatedData.platform}
                      product={generatedData.product}
                    />
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Imagen
                  </Button>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-700/30">
                  <div className="text-center text-slate-500">
                    <Gift className="mx-auto mb-2 h-12 w-12" />
                    <p>La imagen generada aparecerá aquí</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
