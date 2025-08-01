import { useState, useEffect } from 'react'
import { FarmPlot, Crop } from '../types/game'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Droplets, Sparkles } from 'lucide-react'

interface FarmGridProps {
  farmPlots: FarmPlot[]
  crops: Crop[]
  selectedCrop: string | null
  onSelectCrop: (cropId: string | null) => void
  onPlantCrop: (plotId: string, cropId: string) => void
  onWaterCrop: (plotId: string) => void
  onHarvestCrop: (plotId: string) => void
}

export function FarmGrid({
  farmPlots,
  crops,
  selectedCrop,
  onSelectCrop,
  onPlantCrop,
  onWaterCrop,
  onHarvestCrop
}: FarmGridProps) {
  const [plotTimers, setPlotTimers] = useState<Record<string, number>>({})

  // Update growth progress for planted crops
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const newTimers: Record<string, number> = {}

      farmPlots.forEach(plot => {
        if (plot.cropType && plot.plantedAt) {
          const crop = crops.find(c => c.id === plot.cropType)
          if (crop) {
            const plantedTime = new Date(plot.plantedAt).getTime()
            const elapsed = now - plantedTime
            const progress = Math.min(elapsed / (crop.growthTime * 1000), 1)
            newTimers[plot.id] = progress * 100

            // Auto-mark as ready when fully grown
            if (progress >= 1 && !plot.isReady) {
              plot.isReady = true
            }
          }
        }
      })

      setPlotTimers(newTimers)
    }, 1000)

    return () => clearInterval(interval)
  }, [farmPlots, crops])

  const getPlotContent = (plot: FarmPlot) => {
    if (!plot.cropType) {
      return (
        <div className="h-full flex items-center justify-center">
          {selectedCrop ? (
            <Button
              onClick={() => onPlantCrop(plot.id, selectedCrop)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              size="sm"
            >
              Plant {crops.find(c => c.id === selectedCrop)?.name}
            </Button>
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              <div className="mb-2">🌱</div>
              <div>Select a crop to plant</div>
            </div>
          )}
        </div>
      )
    }

    const crop = crops.find(c => c.id === plot.cropType)
    if (!crop) return null

    const progress = plotTimers[plot.id] || 0
    const isReady = progress >= 100

    return (
      <div className="h-full flex flex-col items-center justify-center p-2">
        <div className="text-2xl mb-2">
          {isReady ? '🌾' : plot.growthStage >= 2 ? '🌱' : '🌰'}
        </div>
        <div className="text-xs font-medium text-center mb-2 text-foreground">{crop.name}</div>
        
        {!isReady && (
          <div className="w-full mb-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-center mt-1 text-muted-foreground">
              {Math.round(progress)}%
            </div>
          </div>
        )}

        <div className="flex gap-1">
          {!isReady && plot.growthStage === 1 && (
            <Button
              onClick={() => onWaterCrop(plot.id)}
              size="sm"
              variant="outline"
              className="h-6 px-2 border-accent/50 hover:bg-accent/10"
            >
              <Droplets className="h-3 w-3" />
            </Button>
          )}
          
          {isReady && (
            <Button
              onClick={() => onHarvestCrop(plot.id)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-6 px-2 shadow-lg shadow-primary/25"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Harvest
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Sort plots by position
  const sortedPlots = farmPlots.sort((a, b) => {
    if (a.plotY !== b.plotY) return a.plotY - b.plotY
    return a.plotX - b.plotX
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          🚜 Your Crypto Farm
        </h2>
        <p className="text-muted-foreground">Plant crops, water them, and harvest for rewards!</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {sortedPlots.map((plot) => (
          <Card
            key={plot.id}
            className={`h-32 cursor-pointer transition-all hover:shadow-xl hover:shadow-primary/10 border-border/50 backdrop-blur-sm ${
              plot.isReady ? 'ring-2 ring-primary shadow-xl shadow-primary/20' : ''
            }`}
          >
            <CardContent className="p-0 h-full">
              {getPlotContent(plot)}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCrop && (
        <div className="text-center">
          <Button
            onClick={() => onSelectCrop(null)}
            variant="outline"
            size="sm"
          >
            Cancel Selection
          </Button>
        </div>
      )}
    </div>
  )
}