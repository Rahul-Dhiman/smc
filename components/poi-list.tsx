"use client"

import { useState } from "react"
import type { POI } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface POIListProps {
  pois: POI[]
  onRemove: (index: number) => void
  onJump: (poi: POI) => void
  onEdit?: (index: number, poi: POI) => void
}

export function POIList({ pois, onRemove, onJump, onEdit }: POIListProps) {
  const [selectedPOIs, setSelectedPOIs] = useState<number[]>([])
  const [filterTimeframe, setFilterTimeframe] = useState<string>("all")
  const [filterSide, setFilterSide] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("timeframe")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const [editingPOI, setEditingPOI] = useState<{ index: number; poi: POI } | null>(null)
  const [editForm, setEditForm] = useState<POI | null>(null)

  // Filter and sort POIs
  const filteredAndSortedPOIs = pois
    .map((poi, index) => ({ poi, originalIndex: index }))
    .filter(({ poi }) => {
      const matchesTimeframe = filterTimeframe === "all" || poi.timeframe === filterTimeframe
      const matchesSide = filterSide === "all" || poi.side === filterSide
      const matchesSearch = searchTerm === "" || poi.label.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesTimeframe && matchesSide && matchesSearch
    })
    .sort(({ poi: a }, { poi: b }) => {
      switch (sortBy) {
        case "timeframe":
          const timeframeOrder = ["monthly", "weekly", "daily", "4h", "1h", "15m"]
          return timeframeOrder.indexOf(a.timeframe) - timeframeOrder.indexOf(b.timeframe)
        case "side":
          return a.side.localeCompare(b.side)
        case "price":
          return a.start - b.start
        case "strength":
          return (b.strength || 0.6) - (a.strength || 0.6)
        default:
          return 0
      }
    })

  const handleSelectAll = () => {
    if (selectedPOIs.length === filteredAndSortedPOIs.length) {
      setSelectedPOIs([])
    } else {
      setSelectedPOIs(filteredAndSortedPOIs.map(({ originalIndex }) => originalIndex))
    }
  }

  const handleSelectPOI = (index: number) => {
    setSelectedPOIs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleBulkRemove = () => {
    if (selectedPOIs.length === 0) return

    const sortedIndices = [...selectedPOIs].sort((a, b) => b - a)
    sortedIndices.forEach((index) => onRemove(index))
    setSelectedPOIs([])
  }

  const handleEditPOI = (index: number, poi: POI) => {
    setEditingPOI({ index, poi })
    setEditForm({ ...poi })
  }

  const handleSaveEdit = () => {
    if (editingPOI && editForm && onEdit) {
      onEdit(editingPOI.index, editForm)
      setEditingPOI(null)
      setEditForm(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingPOI(null)
    setEditForm(null)
  }

  const getTimeframeStrength = (timeframe: string) => {
    const strengths = { monthly: 1.0, weekly: 0.9, daily: 0.8, "4h": 0.7, "1h": 0.6, "15m": 0.5 }
    return strengths[timeframe as keyof typeof strengths] || 0.6
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-xs font-medium">Search</Label>
          <Input
            placeholder="Search POIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <div>
          <Label className="text-xs font-medium">Timeframe</Label>
          <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timeframes</SelectItem>
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
          <Label className="text-xs font-medium">Side</Label>
          <Select value={filterSide} onValueChange={setFilterSide}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeframe">Timeframe</SelectItem>
              <SelectItem value="side">Side</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredAndSortedPOIs.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedPOIs.length === filteredAndSortedPOIs.length && filteredAndSortedPOIs.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedPOIs.length} of {filteredAndSortedPOIs.length} selected
            </span>
          </div>

          {selectedPOIs.length > 0 && (
            <div className="flex space-x-2">
              <Button size="sm" variant="destructive" onClick={handleBulkRemove}>
                Remove Selected ({selectedPOIs.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* POI List */}
      <div className="space-y-2">
        {filteredAndSortedPOIs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {pois.length === 0 ? "No POIs configured" : "No POIs match the current filters"}
          </p>
        ) : (
          filteredAndSortedPOIs.map(({ poi, originalIndex }) => (
            <div
              key={originalIndex}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg bg-card transition-colors",
                selectedPOIs.includes(originalIndex) && "bg-muted/50 border-primary",
              )}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedPOIs.includes(originalIndex)}
                  onCheckedChange={() => handleSelectPOI(originalIndex)}
                />

                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      poi.timeframe === "monthly" && "bg-purple-100 text-purple-800 border-purple-300",
                      poi.timeframe === "weekly" && "bg-blue-100 text-blue-800 border-blue-300",
                      poi.timeframe === "daily" && "bg-indigo-100 text-indigo-800 border-indigo-300",
                      poi.timeframe === "4h" && "bg-cyan-100 text-cyan-800 border-cyan-300",
                      poi.timeframe === "1h" && "bg-teal-100 text-teal-800 border-teal-300",
                      poi.timeframe === "15m" && "bg-emerald-100 text-emerald-800 border-emerald-300",
                    )}
                  >
                    {poi.timeframe.toUpperCase()}
                  </Badge>

                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium",
                      poi.side === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                    )}
                  >
                    {poi.side.toUpperCase()}
                  </Badge>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{poi.label}</span>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>
                        {poi.start.toFixed(2)} - {poi.end.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>Strength: {(poi.strength || getTimeframeStrength(poi.timeframe)).toFixed(1)}</span>
                      <span>•</span>
                      <span>Range: {(poi.end - poi.start).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => onJump(poi)}>
                  Jump
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => handleEditPOI(originalIndex, poi)}>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit POI</DialogTitle>
                    </DialogHeader>
                    {editForm && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Timeframe</Label>
                            <Select
                              value={editForm.timeframe}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, timeframe: value as POI["timeframe"] })
                              }
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
                              value={editForm.side}
                              onValueChange={(value) => setEditForm({ ...editForm, side: value as POI["side"] })}
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
                              value={editForm.start}
                              onChange={(e) => setEditForm({ ...editForm, start: Number(e.target.value) })}
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label>End Price</Label>
                            <Input
                              type="number"
                              value={editForm.end}
                              onChange={(e) => setEditForm({ ...editForm, end: Number(e.target.value) })}
                              step="0.1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Label</Label>
                          <Input
                            value={editForm.label}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label>Strength</Label>
                          <Slider
                            value={[editForm.strength || 0.6]}
                            onValueChange={(value) => setEditForm({ ...editForm, strength: value[0] })}
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            className="mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            Current: {(editForm.strength || 0.6).toFixed(1)}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={handleSaveEdit} className="flex-1">
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit} className="flex-1 bg-transparent">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button size="sm" variant="destructive" onClick={() => onRemove(originalIndex)}>
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {pois.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{pois.filter((poi) => poi.side === "buy").length}</div>
            <div className="text-xs text-muted-foreground">Buy POIs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{pois.filter((poi) => poi.side === "sell").length}</div>
            <div className="text-xs text-muted-foreground">Sell POIs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {pois.filter((poi) => ["monthly", "weekly", "daily"].includes(poi.timeframe)).length}
            </div>
            <div className="text-xs text-muted-foreground">HTF POIs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {pois.filter((poi) => ["4h", "1h", "15m"].includes(poi.timeframe)).length}
            </div>
            <div className="text-xs text-muted-foreground">LTF POIs</div>
          </div>
        </div>
      )}
    </div>
  )
}
