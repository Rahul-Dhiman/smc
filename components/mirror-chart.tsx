"use client"

import type { POI } from "@/app/page"

interface MirrorChartProps {
  pois: POI[]
  livePrice: number
}

const timeframes = ["monthly", "weekly", "daily", "4h", "1h", "15m"] as const
const timeframeLabels = {
  monthly: "Monthly",
  weekly: "Weekly",
  daily: "Daily",
  "4h": "4H",
  "1h": "1H",
  "15m": "15M",
}

const timeframeStrength = {
  monthly: 1.0,
  weekly: 0.9,
  daily: 0.8,
  "4h": 0.7,
  "1h": 0.6,
  "15m": 0.5,
}

export function MirrorChart({ pois, livePrice }: MirrorChartProps) {
  const chartHeight = 600
  const margin = { top: 40, right: 120, bottom: 40, left: 120 }

  // Price range calculation with better padding
  const allPrices = pois.flatMap((poi) => [poi.start, poi.end])
  allPrices.push(livePrice)
  const minPrice = Math.min(...allPrices) - 8
  const maxPrice = Math.max(...allPrices) + 8
  const priceRange = maxPrice - minPrice

  // Scale function - now uses percentage-based calculations
  const priceToY = (price: number) => {
    const plotHeight = chartHeight - margin.top - margin.bottom
    return margin.top + ((maxPrice - price) / priceRange) * plotHeight
  }

  const timeframeHeight = (chartHeight - margin.top - margin.bottom) / timeframes.length
  const getTimeframeY = (timeframe: string) => {
    const index = timeframes.indexOf(timeframe as any)
    return margin.top + index * timeframeHeight
  }

  // Group POIs by timeframe
  const poisByTimeframe = timeframes.map((tf) => ({
    timeframe: tf,
    buyPois: pois.filter((poi) => poi.timeframe === tf && poi.side === "buy"),
    sellPois: pois.filter((poi) => poi.timeframe === tf && poi.side === "sell"),
  }))

  const getCurrentPOIs = () => {
    const buyPOIs = pois.filter((poi) => poi.side === "buy" && livePrice >= poi.start && livePrice <= poi.end)
    const sellPOIs = pois.filter((poi) => poi.side === "sell" && livePrice >= poi.start && livePrice <= poi.end)
    return { buyPOIs, sellPOIs }
  }

  const { buyPOIs, sellPOIs } = getCurrentPOIs()
  const priceStatus =
    buyPOIs.length > 0 && sellPOIs.length > 0
      ? "conflict"
      : buyPOIs.length > 0
        ? "buy"
        : sellPOIs.length > 0
          ? "sell"
          : "neutral"

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 1200 ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="border border-border rounded-lg shadow-sm bg-background"
      >
        <defs>
          <linearGradient id="chartBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--background))" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1200" height={chartHeight} fill="url(#chartBg)" />

        {timeframes.map((tf, index) => {
          const plotWidth = 1200 - margin.left - margin.right
          return (
            <g key={tf}>
              {/* Alternating background for better visual separation */}
              {index % 2 === 0 && (
                <rect
                  x={margin.left}
                  y={margin.top + index * timeframeHeight}
                  width={plotWidth}
                  height={timeframeHeight}
                  fill="hsl(var(--muted))"
                  fillOpacity="0.05"
                />
              )}

              {/* Timeframe separator lines */}
              <line
                x1={margin.left}
                y1={margin.top + index * timeframeHeight}
                x2={1200 - margin.right}
                y2={margin.top + index * timeframeHeight}
                stroke="hsl(var(--border))"
                strokeWidth={index === 0 ? 2 : 1}
                strokeDasharray={index === 0 ? "0" : "3,3"}
              />

              <text
                x={margin.left - 20}
                y={margin.top + index * timeframeHeight + timeframeHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-base font-bold"
                fill="hsl(var(--foreground))"
              >
                {timeframeLabels[tf]}
              </text>

              {/* Strength indicator bar */}
              <rect
                x={margin.left - 12}
                y={margin.top + index * timeframeHeight + timeframeHeight / 2 - 3}
                width={6}
                height={6}
                fill="hsl(var(--primary))"
                fillOpacity={timeframeStrength[tf]}
                rx="1"
              />
            </g>
          )
        })}

        {poisByTimeframe.map(({ timeframe, buyPois, sellPois }) => {
          const tfIndex = timeframes.indexOf(timeframe)
          const tfY = margin.top + tfIndex * timeframeHeight
          const tfHeight = timeframeHeight
          const plotWidth = 1200 - margin.left - margin.right

          return (
            <g key={timeframe}>
              {/* Buy POIs */}
              {buyPois.map((poi, index) => {
                const y1 = priceToY(poi.end)
                const y2 = priceToY(poi.start)
                const height = y2 - y1
                const isActive = livePrice >= poi.start && livePrice <= poi.end
                const strength = poi.strength || timeframeStrength[timeframe]

                return (
                  <g key={`buy-${timeframe}-${index}`}>
                    {/* POI Band */}
                    <rect
                      x={margin.left}
                      y={y1}
                      width={plotWidth}
                      height={height}
                      fill={`rgba(34, 197, 94, ${strength * 0.4})`}
                      stroke="rgb(34, 197, 94)"
                      strokeWidth={isActive ? 3 : 1}
                      strokeDasharray={isActive ? "0" : "2,2"}
                      filter={isActive ? "url(#glow)" : "none"}
                      rx="4"
                    />

                    {/* POI Label */}
                    <text
                      x={margin.left + 20}
                      y={y1 + height / 2}
                      dominantBaseline="middle"
                      className="text-sm font-semibold"
                      fill="rgb(21, 128, 61)"
                    >
                      {poi.label}
                    </text>

                    {/* Price range indicator */}
                    <text
                      x={1200 - margin.right - 15}
                      y={y1 + height / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="text-sm font-medium"
                      fill="rgb(21, 128, 61)"
                    >
                      {poi.start.toFixed(1)}-{poi.end.toFixed(1)}
                    </text>
                  </g>
                )
              })}

              {/* Sell POIs */}
              {sellPois.map((poi, index) => {
                const y1 = priceToY(poi.end)
                const y2 = priceToY(poi.start)
                const height = y2 - y1
                const isActive = livePrice >= poi.start && livePrice <= poi.end
                const strength = poi.strength || timeframeStrength[timeframe]

                return (
                  <g key={`sell-${timeframe}-${index}`}>
                    {/* POI Band */}
                    <rect
                      x={margin.left}
                      y={y1}
                      width={plotWidth}
                      height={height}
                      fill={`rgba(239, 68, 68, ${strength * 0.4})`}
                      stroke="rgb(239, 68, 68)"
                      strokeWidth={isActive ? 3 : 1}
                      strokeDasharray={isActive ? "0" : "2,2"}
                      filter={isActive ? "url(#glow)" : "none"}
                      rx="4"
                    />

                    {/* POI Label */}
                    <text
                      x={margin.left + 20}
                      y={y1 + height / 2}
                      dominantBaseline="middle"
                      className="text-sm font-semibold"
                      fill="rgb(185, 28, 28)"
                    >
                      {poi.label}
                    </text>

                    {/* Price range indicator */}
                    <text
                      x={1200 - margin.right - 15}
                      y={y1 + height / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="text-sm font-medium"
                      fill="rgb(185, 28, 28)"
                    >
                      {poi.start.toFixed(1)}-{poi.end.toFixed(1)}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}

        <line
          x1={margin.left}
          y1={priceToY(livePrice)}
          x2={1200 - margin.right}
          y2={priceToY(livePrice)}
          stroke={
            priceStatus === "buy"
              ? "rgb(34, 197, 94)"
              : priceStatus === "sell"
                ? "rgb(239, 68, 68)"
                : priceStatus === "conflict"
                  ? "rgb(249, 115, 22)"
                  : "hsl(var(--foreground))"
          }
          strokeWidth={4}
          filter="url(#glow)"
        />

        {/* Price indicator circle */}
        <circle
          cx={1200 - margin.right + 30}
          cy={priceToY(livePrice)}
          r={8}
          fill={
            priceStatus === "buy"
              ? "rgb(34, 197, 94)"
              : priceStatus === "sell"
                ? "rgb(239, 68, 68)"
                : priceStatus === "conflict"
                  ? "rgb(249, 115, 22)"
                  : "hsl(var(--foreground))"
          }
          filter="url(#glow)"
        />

        {/* Price text */}
        <text
          x={1200 - margin.right + 50}
          y={priceToY(livePrice)}
          dominantBaseline="middle"
          className="text-base font-bold"
          fill="hsl(var(--foreground))"
        >
          {livePrice.toFixed(2)}
        </text>

        {/* Price scale */}
        {Array.from({ length: 11 }, (_, i) => {
          const price = minPrice + (priceRange * i) / 10
          const y = priceToY(price)
          return (
            <g key={i}>
              <line
                x1={margin.left - 10}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
              />
              <text
                x={margin.left - 15}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-sm"
                fill="hsl(var(--muted-foreground))"
              >
                {price.toFixed(1)}
              </text>
            </g>
          )
        })}

        <text x="600" y="25" textAnchor="middle" className="text-lg font-bold" fill="hsl(var(--foreground))">
          SMC POI Mirror Chart - Price: {livePrice.toFixed(2)} ({priceStatus.toUpperCase()})
        </text>
      </svg>
    </div>
  )
}
