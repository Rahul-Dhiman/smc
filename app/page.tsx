"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MirrorChart } from "@/components/mirror-chart"
import { POIList } from "@/components/poi-list"
import { LivePriceTracker } from "@/components/live-price-tracker"
import { cn } from "@/lib/utils"

// POI Data Model
export interface POI {
  timeframe: "monthly" | "weekly" | "daily" | "4h" | "1h" | "15m"
  side: "buy" | "sell"
  start: number
  end: number
  label: string
  strength?: number
}

// Sample POI data for demonstration
const defaultPOIs: POI[] = [
  { timeframe: "monthly", side: "sell", start: 1820, end: 1825, label: "Monthly Sell 1820-1825", strength: 1.0 },
  { timeframe: "weekly", side: "buy", start: 1800, end: 1805, label: "Weekly Buy 1800-1805", strength: 0.9 },
  { timeframe: "daily", side: "sell", start: 1815, end: 1818, label: "Daily Sell 1815-1818", strength: 0.8 },
  { timeframe: "4h", side: "buy", start: 1810, end: 1812, label: "4H Buy 1810-1812", strength: 0.7 },
  { timeframe: "1h", side: "sell", start: 1816, end: 1818, label: "1H Sell 1816-1818", strength: 0.6 },
  { timeframe: "15m", side: "buy", start: 1813, end: 1814, label: "15M Buy 1813-1814", strength: 0.5 },
]

export default function SMCTradingTool() {
  const [pois, setPOIs] = useState<POI[]>(defaultPOIs)
  const [livePrice, setLivePrice] = useState<number>(1814)
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(defaultPOIs, null, 2))

  const [isAddPOIOpen, setIsAddPOIOpen] = useState(false)
  const [newPOI, setNewPOI] = useState<Partial<POI>>({
    timeframe: "15m",
    side: "buy",
    start: 1810,
    end: 1815,
    label: "",
    strength: 0.6,
  })

  const [priceRange, setPriceRange] = useState({ min: 1790, max: 1840 })

  // Determine price status based on POIs
  const getPriceStatus = () => {
    const buyPOIs = pois.filter((poi) => poi.side === "buy" && livePrice >= poi.start && livePrice <= poi.end)
    const sellPOIs = pois.filter((poi) => poi.side === "sell" && livePrice >= poi.start && livePrice <= poi.end)

    if (buyPOIs.length > 0 && sellPOIs.length > 0) return "conflict"
    if (buyPOIs.length > 0) return "buy"
    if (sellPOIs.length > 0) return "sell"
    return "neutral"
  }

  const priceStatus = getPriceStatus()

  const handleApplyJSON = () => {
    try {
      const parsedPOIs = JSON.parse(jsonInput)
      if (Array.isArray(parsedPOIs)) {
        setPOIs(parsedPOIs)
        const allPrices = parsedPOIs.flatMap((poi: POI) => [poi.start, poi.end])
        if (allPrices.length > 0) {
          const minPrice = Math.min(...allPrices) - 10
          const maxPrice = Math.max(...allPrices) + 10
          setPriceRange({ min: minPrice, max: maxPrice })
        }
      } else {
        throw new Error("Invalid POI array format")
      }
    } catch (error) {
      alert("Invalid JSON format: " + (error as Error).message)
    }
  }

  const handleDumpCurrent = () => {
    setJsonInput(JSON.stringify(pois, null, 2))
  }

  const handleReset = () => {
    setPOIs(defaultPOIs)
    setJsonInput(JSON.stringify(defaultPOIs, null, 2))
    setPriceRange({ min: 1790, max: 1840 })
    setLivePrice(1814)
  }

  const handleCreatePOI = () => {
    if (!newPOI.label || !newPOI.start || !newPOI.end) {
      alert("Please fill in all required fields")
      return
    }

    const poi: POI = {
      timeframe: newPOI.timeframe as POI["timeframe"],
      side: newPOI.side as POI["side"],
      start: Number(newPOI.start),
      end: Number(newPOI.end),
      label: newPOI.label,
      strength: newPOI.strength || 0.6,
    }

    setPOIs([...pois, poi])
    setIsAddPOIOpen(false)

    // Reset form
    setNewPOI({
      timeframe: "15m",
      side: "buy",
      start: livePrice - 2,
      end: livePrice + 2,
      label: "",
      strength: 0.6,
    })
  }

  const handleQuickAddPOI = () => {
    const quickPOI: POI = {
      timeframe: "15m",
      side: "buy",
      start: livePrice - 2,
      end: livePrice + 2,
      label: `Quick POI ${(livePrice - 2).toFixed(1)}-${(livePrice + 2).toFixed(1)}`,
      strength: 0.6,
    }
    setPOIs([...pois, quickPOI])
  }

  const pricePresets = [
    { label: "Support 1", price: 1800 },
    { label: "Support 2", price: 1810 },
    { label: "Current", price: 1814 },
    { label: "Resistance 1", price: 1820 },
    { label: "Resistance 2", price: 1830 },
  ]

  const handleRemovePOI = (index: number) => {
    setPOIs(pois.filter((_, i) => i !== index))
  }

  const handleJumpToPOI = (poi: POI) => {
    const centerPrice = (poi.start + poi.end) / 2
    setLivePrice(centerPrice)
  }

  const handleEditPOI = (index: number, updatedPOI: POI) => {
    const newPOIs = [...pois]
    newPOIs[index] = updatedPOI
    setPOIs(newPOIs)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">SMC Trading Visualization Tool</h1>
          <p className="text-muted-foreground">Smart Money Concept POI (Price of Interest) Mirror Chart</p>
        </div>

        {/* Price Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-lg font-medium">Live Price:</span>
              <span className="text-2xl font-bold">{livePrice.toFixed(2)}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm font-medium",
                  priceStatus === "buy" && "bg-green-100 text-green-800 border-green-300",
                  priceStatus === "sell" && "bg-red-100 text-red-800 border-red-300",
                  priceStatus === "conflict" && "bg-orange-100 text-orange-800 border-orange-300",
                  priceStatus === "neutral" && "bg-gray-100 text-gray-800 border-gray-300",
                )}
              >
                {priceStatus === "buy" && "🟢 In Buy Zone"}
                {priceStatus === "sell" && "🔴 In Sell Zone"}
                {priceStatus === "conflict" && "🟠 Conflict Zone"}
                {priceStatus === "neutral" && "⚪ No POI Zone"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Full Width Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mirror Chart - POI Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <MirrorChart pois={pois} livePrice={livePrice} />
          </CardContent>
        </Card>

        {/* Grid Layout for Controls and Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Live Price Tracker */}
          <LivePriceTracker currentPrice={livePrice} onPriceUpdate={setLivePrice} priceStatus={priceStatus} />

          {/* Price Control */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Price Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Live Price: {livePrice.toFixed(2)}</Label>
                <Slider
                  value={[livePrice]}
                  onValueChange={(value) => setLivePrice(value[0])}
                  min={priceRange.min}
                  max={priceRange.max}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min Price</Label>
                  <Input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Price</Label>
                  <Input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Jump</Label>
                <div className="grid grid-cols-2 gap-1">
                  {pricePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      size="sm"
                      variant="outline"
                      onClick={() => setLivePrice(preset.price)}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={isAddPOIOpen} onOpenChange={setIsAddPOIOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Add POI</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New POI</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Timeframe</Label>
                        <Select
                          value={newPOI.timeframe}
                          onValueChange={(value) => setNewPOI({ ...newPOI, timeframe: value as POI["timeframe"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="4h">4H</SelectItem>
                            <SelectItem value="1h">1H</SelectItem>
                            <SelectItem value="15m">15M</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Side</Label>
                        <Select
                          value={newPOI.side}
                          onValueChange={(value) => setNewPOI({ ...newPOI, side: value as POI["side"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy (Demand)</SelectItem>
                            <SelectItem value="sell">Sell (Supply)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Price</Label>
                        <Input
                          type="number"
                          value={newPOI.start}
                          onChange={(e) => setNewPOI({ ...newPOI, start: Number(e.target.value) })}
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label>End Price</Label>
                        <Input
                          type="number"
                          value={newPOI.end}
                          onChange={(e) => setNewPOI({ ...newPOI, end: Number(e.target.value) })}
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Label</Label>
                      <Input
                        value={newPOI.label}
                        onChange={(e) => setNewPOI({ ...newPOI, label: e.target.value })}
                        placeholder="e.g., Daily Support Zone"
                      />
                    </div>

                    <div>
                      <Label>Strength (0.1 - 1.0)</Label>
                      <Slider
                        value={[newPOI.strength || 0.6]}
                        onValueChange={(value) => setNewPOI({ ...newPOI, strength: value[0] })}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Current: {(newPOI.strength || 0.6).toFixed(1)}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={handleCreatePOI} className="flex-1">
                        Create POI
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddPOIOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleQuickAddPOI} variant="outline" className="w-full bg-transparent">
                Quick Add POI
              </Button>
              <Button onClick={handleApplyJSON} variant="outline" className="w-full bg-transparent">
                Apply JSON
              </Button>
              <Button onClick={handleDumpCurrent} variant="outline" className="w-full bg-transparent">
                Dump Current
              </Button>
              <Button onClick={handleReset} variant="destructive" className="w-full">
                Reset All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* POI Management - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>POI Management ({pois.length} POIs)</CardTitle>
          </CardHeader>
          <CardContent>
            <POIList pois={pois} onRemove={handleRemovePOI} onJump={handleJumpToPOI} onEdit={handleEditPOI} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
