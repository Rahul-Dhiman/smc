"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PriceHistory {
  timestamp: number
  price: number
  status: "buy" | "sell" | "conflict" | "neutral"
}

interface LivePriceTrackerProps {
  currentPrice: number
  onPriceUpdate: (price: number) => void
  priceStatus: "buy" | "sell" | "conflict" | "neutral"
}

export function LivePriceTracker({ currentPrice, onPriceUpdate, priceStatus }: LivePriceTrackerProps) {
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [updateInterval, setUpdateInterval] = useState(5000) // 5 seconds
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [volatility, setVolatility] = useState(0.5) // Price movement volatility
  const [trend, setTrend] = useState<"up" | "down" | "sideways">("sideways")

  // Simulate live price updates
  const generateNextPrice = useCallback(() => {
    const baseVolatility = volatility * 2 // Max 2 point movement
    const randomChange = (Math.random() - 0.5) * baseVolatility

    // Apply trend bias
    let trendBias = 0
    if (trend === "up") trendBias = 0.3
    else if (trend === "down") trendBias = -0.3

    const newPrice = currentPrice + randomChange + trendBias

    // Keep price within reasonable bounds
    return Math.max(1790, Math.min(1840, newPrice))
  }, [currentPrice, volatility, trend])

  // Live price update effect
  useEffect(() => {
    if (!isLiveMode) return

    const interval = setInterval(() => {
      const newPrice = generateNextPrice()
      onPriceUpdate(newPrice)

      // Add to price history
      setPriceHistory((prev) => {
        const newEntry: PriceHistory = {
          timestamp: Date.now(),
          price: newPrice,
          status: priceStatus,
        }
        return [...prev.slice(-49), newEntry] // Keep last 50 entries
      })
    }, updateInterval)

    return () => clearInterval(interval)
  }, [isLiveMode, updateInterval, generateNextPrice, onPriceUpdate, priceStatus])

  // Initialize price history with current price
  useEffect(() => {
    if (priceHistory.length === 0) {
      setPriceHistory([
        {
          timestamp: Date.now(),
          price: currentPrice,
          status: priceStatus,
        },
      ])
    }
  }, [currentPrice, priceStatus, priceHistory.length])

  const handleToggleLiveMode = () => {
    setIsLiveMode(!isLiveMode)
    if (!isLiveMode) {
      // Add current price to history when starting live mode
      setPriceHistory((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          price: currentPrice,
          status: priceStatus,
        },
      ])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "buy":
        return "text-green-600"
      case "sell":
        return "text-red-600"
      case "conflict":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "buy":
        return "🟢"
      case "sell":
        return "🔴"
      case "conflict":
        return "🟠"
      default:
        return "⚪"
    }
  }

  const priceChange = priceHistory.length > 1 ? currentPrice - priceHistory[priceHistory.length - 2].price : 0
  const priceChangePercent =
    priceHistory.length > 1 ? (priceChange / priceHistory[priceHistory.length - 2].price) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Price Tracking
          <Badge variant={isLiveMode ? "default" : "secondary"}>{isLiveMode ? "LIVE" : "PAUSED"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">{currentPrice.toFixed(2)}</div>
          <div className="flex items-center justify-center space-x-2">
            <span className={cn("text-sm font-medium", priceChange >= 0 ? "text-green-600" : "text-red-600")}>
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}
              {priceChangePercent.toFixed(2)}%)
            </span>
            <Badge variant="outline" className="text-xs">
              {getStatusIcon(priceStatus)} {priceStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Live Mode Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="live-mode">Live Mode</Label>
            <Switch id="live-mode" checked={isLiveMode} onCheckedChange={handleToggleLiveMode} />
          </div>

          {isLiveMode && (
            <>
              <div>
                <Label className="text-sm">Update Interval</Label>
                <Select value={updateInterval.toString()} onValueChange={(value) => setUpdateInterval(Number(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 second</SelectItem>
                    <SelectItem value="5000">5 seconds</SelectItem>
                    <SelectItem value="15000">15 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Market Trend</Label>
                <Select value={trend} onValueChange={(value) => setTrend(value as typeof trend)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Bullish 📈</SelectItem>
                    <SelectItem value="sideways">Sideways ↔️</SelectItem>
                    <SelectItem value="down">Bearish 📉</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Volatility: {volatility.toFixed(1)}</Label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={volatility}
                  onChange={(e) => setVolatility(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            </>
          )}
        </div>

        {/* Price History */}
        {priceHistory.length > 1 && (
          <div>
            <Label className="text-sm font-medium">Recent Price History</Label>
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {priceHistory
                .slice(-10)
                .reverse()
                .map((entry, index) => (
                  <div
                    key={entry.timestamp}
                    className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                  >
                    <span className="font-mono">{entry.price.toFixed(2)}</span>
                    <span className={getStatusColor(entry.status)}>
                      {getStatusIcon(entry.status)} {entry.status}
                    </span>
                    <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {priceHistory.length > 1 && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {Math.max(...priceHistory.map((h) => h.price)).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Session High</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {Math.min(...priceHistory.map((h) => h.price)).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Session Low</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => setPriceHistory([])} className="flex-1 text-xs">
            Clear History
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const dataStr = JSON.stringify(priceHistory, null, 2)
              const dataBlob = new Blob([dataStr], { type: "application/json" })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement("a")
              link.href = url
              link.download = "price-history.json"
              link.click()
            }}
            className="flex-1 text-xs"
          >
            Export History
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
