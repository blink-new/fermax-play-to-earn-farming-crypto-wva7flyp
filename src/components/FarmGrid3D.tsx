import { useState, useEffect } from 'react'
import { FarmPlot, ExpansionPlot, Crop, Player } from '../types/game'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Droplets, Sparkles, Lock, Plus, Coins } from 'lucide-react'
import toast from 'react-hot-toast'

interface FarmGrid3DProps {
  farmPlots: FarmPlot[]
  expansionPlots: ExpansionPlot[]
  crops: Crop[]
  player: Player | null
  selectedCrop: string | null
  onSelectCrop: (cropId: string | null) => void
  onPlantCrop: (plotId: string, cropId: string) => void
  onWaterCrop: (plotId: string) => void
  onHarvestCrop: (plotId: string) => void
  onPurchaseExpansion: (expansionId: string) => void
}

export function FarmGrid3D({
  farmPlots,
  expansionPlots,
  crops,
  player,
  selectedCrop,
  onSelectCrop,
  onPlantCrop,
  onWaterCrop,
  onHarvestCrop,
  onPurchaseExpansion
}: FarmGrid3DProps) {
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
            const growthSpeedMultiplier = plot.growthSpeedBonus || 1.0
            const adjustedGrowthTime = crop.growthTime / growthSpeedMultiplier
            const progress = Math.min(elapsed / (adjustedGrowthTime * 1000), 1)
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
        <div className="h-full flex flex-col items-center justify-center p-2">
          {selectedCrop ? (
            <Button
              onClick={() => onPlantCrop(plot.id, selectedCrop)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
              size="sm"
            >
              Plant {crops.find(c => c.id === selectedCrop)?.emoji}
            </Button>
          ) : (
            <div className="text-center text-gray-500 text-xs">
              <div className="mb-1 text-lg">🌱</div>
              <div>Select crop</div>
            </div>
          )}
          {plot.plotType && plot.plotType !== 'standard' && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {plot.plotType === 'premium' ? '⭐' : '💎'} {plot.plotType}
            </Badge>
          )}
        </div>
      )
    }

    const crop = crops.find(c => c.id === plot.cropType)
    if (!crop) return null

    const progress = plotTimers[plot.id] || 0
    const isReady = progress >= 100
    const yieldMultiplier = plot.yieldBonus || 1.0

    return (
      <div className="h-full flex flex-col items-center justify-center p-2">
        <div className="text-xl mb-1">
          {isReady ? crop.emoji : plot.growthStage >= 2 ? '🌱' : '🌰'}
        </div>
        <div className="text-xs font-medium text-center mb-1">{crop.name}</div>
        
        {yieldMultiplier > 1 && (
          <Badge variant="outline" className="text-xs mb-1">
            +{Math.round((yieldMultiplier - 1) * 100)}% yield
          </Badge>
        )}
        
        {!isReady && (
          <div className="w-full mb-1">
            <Progress value={progress} className="h-1" />
            <div className="text-xs text-center mt-1 text-gray-600">
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
              className="h-5 px-1 text-xs"
            >
              <Droplets className="h-2 w-2" />
            </Button>
          )}
          
          {isReady && (
            <Button
              onClick={() => onHarvestCrop(plot.id)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white h-5 px-1 text-xs"
            >
              <Sparkles className="h-2 w-2 mr-1" />
              Harvest
            </Button>
          )}
        </div>
      </div>
    )
  }

  const getExpansionPlotContent = (expansion: ExpansionPlot) => {
    if (expansion.isPurchased) {
      // Find corresponding farm plot
      const farmPlot = farmPlots.find(fp => fp.plotX === expansion.plotX && fp.plotY === expansion.plotY)
      if (farmPlot) {
        return getPlotContent(farmPlot)
      }
    }

    const canAfford = Boolean(player && player.fermaCoin >= expansion.fmcCost)
    
    return (
      <div className="h-full flex flex-col items-center justify-center p-2 bg-gray-100 border-2 border-dashed border-gray-300">
        <Lock className="h-4 w-4 text-gray-400 mb-1" />
        <div className="text-xs text-center text-gray-600 mb-2">
          <div className="font-medium">{expansion.plotType}</div>
          <div>+{Math.round((expansion.yieldBonus - 1) * 100)}% yield</div>
          <div>+{Math.round((expansion.growthSpeedBonus - 1) * 100)}% speed</div>
        </div>
        <Button
          onClick={() => {
            if (!canAfford) {
              toast.error(`Need ${expansion.fmcCost} FermaCoin!`)
              return
            }
            onPurchaseExpansion(expansion.id)
          }}
          size="sm"
          variant={canAfford ? "default" : "secondary"}
          className={`h-6 px-2 text-xs ${
            canAfford 
              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!canAfford}
        >
          <Coins className="h-2 w-2 mr-1" />
          {expansion.fmcCost} FC
        </Button>
      </div>
    )
  }

  // Create 5x5 grid with center 3x3 as free plots
  const renderGrid = () => {
    const grid = []
    for (let y = 0; y < 5; y++) {
      const row = []
      for (let x = 0; x < 5; x++) {
        // Center 3x3 are free farm plots (adjusted coordinates)
        const isCenterPlot = x >= 1 && x <= 3 && y >= 1 && y <= 3
        
        if (isCenterPlot) {
          // Free farm plot
          const farmPlot = farmPlots.find(fp => fp.plotX === (x - 1) && fp.plotY === (y - 1))
          if (farmPlot) {
            row.push(
              <Card
                key={`farm-${x}-${y}`}
                className={`h-24 cursor-pointer transition-all hover:shadow-lg transform hover:scale-105 ${
                  farmPlot.isReady ? 'ring-2 ring-amber-400 shadow-lg animate-pulse' : ''
                } bg-gradient-to-br from-green-50 to-green-100 border-green-200`}
                style={{
                  transform: 'perspective(200px) rotateX(5deg)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                <CardContent className="p-0 h-full">
                  {getPlotContent(farmPlot)}
                </CardContent>
              </Card>
            )
          } else {
            row.push(
              <div key={`empty-${x}-${y}`} className="h-24 bg-green-100 rounded border-2 border-dashed border-green-300 flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-400" />
              </div>
            )
          }
        } else {
          // Expansion plot
          const expansion = expansionPlots.find(ep => ep.plotX === x && ep.plotY === y)
          if (expansion) {
            const isPremium = expansion.plotType === 'premium'
            const isLegendary = expansion.plotType === 'legendary'
            
            row.push(
              <Card
                key={`expansion-${x}-${y}`}
                className={`h-24 cursor-pointer transition-all hover:shadow-lg transform hover:scale-105 ${
                  expansion.isPurchased 
                    ? (isPremium ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' 
                       : isLegendary ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                       : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200')
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}
                style={{
                  transform: 'perspective(200px) rotateX(5deg)',
                  boxShadow: expansion.isPurchased 
                    ? '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
                    : '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <CardContent className="p-0 h-full">
                  {getExpansionPlotContent(expansion)}
                </CardContent>
              </Card>
            )
          } else {
            row.push(
              <div key={`placeholder-${x}-${y}`} className="h-24 bg-gray-50 rounded border border-gray-200 opacity-50" />
            )
          }
        }
      }
      grid.push(
        <div key={`row-${y}`} className="flex gap-2 justify-center">
          {row}
        </div>
      )
    }
    return grid
  }

  const totalPlots = farmPlots.length + expansionPlots.filter(ep => ep.isPurchased).length
  const activePlots = farmPlots.filter(fp => fp.cropType).length + 
                     expansionPlots.filter(ep => ep.isPurchased && farmPlots.find(fp => fp.plotX === ep.plotX && fp.plotY === ep.plotY)?.cropType).length
  const readyPlots = farmPlots.filter(fp => fp.isReady).length

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-2">🚜 Your 3D Farm</h2>
        <p className="text-green-600 mb-4">Plant crops, expand with FermaCoin, and harvest for rewards!</p>
        
        {/* Farm Statistics */}
        <div className="flex justify-center gap-4 mb-4">
          <Badge variant="outline" className="px-3 py-1">
            📊 Total Plots: {totalPlots}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            🌱 Active: {activePlots}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            ✅ Ready: {readyPlots}
          </Badge>
        </div>
      </div>

      {/* 3D Isometric Farm Grid */}
      <div className="space-y-2 max-w-2xl mx-auto">
        {renderGrid()}
      </div>

      {/* Expansion Info */}
      <div className="text-center bg-amber-50 p-4 rounded-lg border border-amber-200 max-w-md mx-auto">
        <h3 className="font-semibold text-amber-800 mb-2">💰 Expand Your Farm</h3>
        <p className="text-sm text-amber-700 mb-2">
          Purchase expansion plots with FermaCoin for bonus yields and faster growth!
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <div className="text-center">
            <div className="font-medium">Standard</div>
            <div className="text-gray-600">5 FC • Base stats</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-amber-600">Premium</div>
            <div className="text-gray-600">15 FC • +50% yield</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-600">Legendary</div>
            <div className="text-gray-600">50 FC • +100% yield</div>
          </div>
        </div>
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