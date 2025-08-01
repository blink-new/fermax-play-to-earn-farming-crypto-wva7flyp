import { useState, useEffect } from 'react'
import { FarmPlot, ExpansionPlot, Crop, Player, WeatherEvent, CropDisease, FarmDecoration, SeasonalEvent } from '../types/game'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Droplets, Sparkles, Lock, Plus, Coins, Cloud, Sun, CloudRain, 
  Zap, Bug, Flower, TreePine, Gift, TrendingUp,
  Shield, Heart, Leaf, Star
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InteractiveFarmProps {
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

export function InteractiveFarm({
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
}: InteractiveFarmProps) {
  const [plotTimers, setPlotTimers] = useState<Record<string, number>>({})
  const [currentWeather, setCurrentWeather] = useState<WeatherEvent | null>(null)
  const [cropDiseases, setCropDiseases] = useState<CropDisease[]>([])
  const [seasonalEvent, setSeasonalEvent] = useState<SeasonalEvent | null>(null)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [miniGameScore, setMiniGameScore] = useState(0)

  // Load weather and events
  useEffect(() => {
    const loadFarmData = async () => {
      if (!player) return

      try {
        // Mock weather for demo
        const mockWeather: WeatherEvent = {
          id: 'weather_1',
          weatherType: Math.random() > 0.5 ? 'sunny' : 'rainy',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          growthModifier: Math.random() > 0.5 ? 1.2 : 1.0,
          yieldModifier: Math.random() > 0.5 ? 1.1 : 1.0,
          description: Math.random() > 0.5 ? '☀️ Perfect growing weather!' : '🌧️ Gentle rain nourishes crops!'
        }
        setCurrentWeather(mockWeather)

        // Mock seasonal event
        const mockEvent: SeasonalEvent = {
          id: 'spring_festival',
          eventName: 'Spring Harvest Festival',
          eventType: 'harvest_festival',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          bonusMultiplier: 2.0,
          specialRewards: JSON.stringify({ fmc_bonus: 5, rare_seeds: 3 }),
          isActive: true
        }
        setSeasonalEvent(mockEvent)

        // Simulate random crop diseases (10% chance per plot)
        const diseases: CropDisease[] = []
        farmPlots.forEach(plot => {
          if (plot.cropType && Math.random() < 0.1) {
            const diseaseTypes = ['aphids', 'blight', 'rust', 'wilt'] as const
            diseases.push({
              id: `disease_${plot.id}`,
              plotId: plot.id,
              diseaseType: diseaseTypes[Math.floor(Math.random() * diseaseTypes.length)],
              severity: Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3,
              discoveredAt: new Date().toISOString()
            })
          }
        })
        setCropDiseases(diseases)

      } catch (error) {
        console.error('Failed to load farm data:', error)
      }
    }

    loadFarmData()
  }, [player, farmPlots])

  // Update growth progress with weather effects
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
            
            // Apply weather and plot bonuses
            let growthSpeedMultiplier = plot.growthSpeedBonus || 1.0
            if (currentWeather) {
              growthSpeedMultiplier *= currentWeather.growthModifier
            }
            
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
  }, [farmPlots, crops, currentWeather])

  const getWeatherIcon = (weatherType: string) => {
    switch (weatherType) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />
      case 'storm': return <Zap className="h-4 w-4 text-purple-500" />
      case 'drought': return <Cloud className="h-4 w-4 text-gray-500" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  const getDiseaseIcon = (diseaseType: string) => {
    switch (diseaseType) {
      case 'aphids': return <Bug className="h-3 w-3 text-green-600" />
      case 'blight': return <Leaf className="h-3 w-3 text-brown-600" />
      case 'rust': return <Shield className="h-3 w-3 text-orange-600" />
      case 'wilt': return <Heart className="h-3 w-3 text-red-600" />
      default: return <Bug className="h-3 w-3" />
    }
  }

  const treatDisease = async (diseaseId: string) => {
    if (!player) return
    
    const treatmentCost = 10 // Gold Ducats
    const currentGold = Number(player.goldDucats) || 0
    
    if (currentGold < treatmentCost) {
      toast.error('Need 10 Gold Ducats to treat disease!')
      return
    }

    // Remove disease and deduct cost
    setCropDiseases(prev => prev.filter(d => d.id !== diseaseId))
    toast.success('🌿 Disease treated successfully! Crop is healthy again.')
  }

  const startMiniGame = () => {
    setShowMiniGame(true)
    setMiniGameScore(0)
    
    // Simple clicking mini-game
    let score = 0
    const gameInterval = setInterval(() => {
      score += Math.floor(Math.random() * 10) + 1
      setMiniGameScore(score)
    }, 100)

    setTimeout(() => {
      clearInterval(gameInterval)
      setShowMiniGame(false)
      
      // Reward based on score
      const fmcReward = Math.floor(score / 100) * 0.1
      if (fmcReward > 0) {
        toast.success(`🎮 Mini-game complete! Earned ${fmcReward.toFixed(1)} FMC!`, {
          duration: 4000,
          style: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: 'white', fontWeight: 'bold' }
        })
      }
    }, 5000)
  }

  const getPlotContent = (plot: FarmPlot) => {
    const disease = cropDiseases.find(d => d.plotId === plot.id)
    
    if (!plot.cropType) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-2 relative">
          {selectedCrop ? (
            <Button
              onClick={() => onPlantCrop(plot.id, selectedCrop)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 relative z-10"
              size="sm"
            >
              Plant {crops.find(c => c.id === selectedCrop)?.emoji}
            </Button>
          ) : (
            <div className="text-center text-gray-500 text-xs">
              <div className="mb-1 text-lg animate-bounce">🌱</div>
              <div>Select crop</div>
            </div>
          )}
          
          {/* Weather effect overlay */}
          {currentWeather && (
            <div className="absolute top-1 right-1 opacity-70">
              {getWeatherIcon(currentWeather.weatherType)}
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
    const yieldMultiplier = (plot.yieldBonus || 1.0) * (currentWeather?.yieldModifier || 1.0) * (seasonalEvent?.bonusMultiplier || 1.0)

    return (
      <div className="h-full flex flex-col items-center justify-center p-2 relative">
        {/* Weather effect overlay */}
        {currentWeather && (
          <div className="absolute top-1 right-1 opacity-70">
            {getWeatherIcon(currentWeather.weatherType)}
          </div>
        )}
        
        {/* Disease indicator */}
        {disease && (
          <div className="absolute top-1 left-1">
            <Button
              onClick={() => treatDisease(disease.id)}
              size="sm"
              variant="destructive"
              className="h-5 w-5 p-0"
              title={`${disease.diseaseType} (severity ${disease.severity})`}
            >
              {getDiseaseIcon(disease.diseaseType)}
            </Button>
          </div>
        )}
        
        <div className={`text-xl mb-1 ${isReady ? 'animate-bounce' : ''} ${disease ? 'filter brightness-75' : ''}`}>
          {isReady ? crop.emoji : plot.growthStage >= 2 ? '🌱' : '🌰'}
        </div>
        <div className="text-xs font-medium text-center mb-1">{crop.name}</div>
        
        {/* Bonus indicators */}
        <div className="flex flex-wrap justify-center gap-1 mb-1">
          {yieldMultiplier > 1 && (
            <Badge variant="outline" className="text-xs">
              +{Math.round((yieldMultiplier - 1) * 100)}% yield
            </Badge>
          )}
          {seasonalEvent && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
              🎉 Event
            </Badge>
          )}
        </div>
        
        {!isReady && (
          <div className="w-full mb-1">
            <Progress 
              value={progress} 
              className={`h-1 ${disease ? 'opacity-50' : ''}`} 
            />
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
              className={`h-5 px-1 text-xs ${
                seasonalEvent 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-700'
              } text-white`}
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
      const farmPlot = farmPlots.find(fp => fp.plotX === expansion.plotX && fp.plotY === expansion.plotY)
      if (farmPlot) {
        return getPlotContent(farmPlot)
      }
    }

    const canAfford = Boolean(player && player.fermaCoin >= expansion.fmcCost)
    
    return (
      <div className="h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
        
        <Lock className="h-4 w-4 text-gray-400 mb-1" />
        <div className="text-xs text-center text-gray-600 mb-2">
          <div className="font-medium text-purple-600">{expansion.plotType}</div>
          <div className="text-green-600">+{Math.round((expansion.yieldBonus - 1) * 100)}% yield</div>
          <div className="text-blue-600">+{Math.round((expansion.growthSpeedBonus - 1) * 100)}% speed</div>
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
          className={`h-6 px-2 text-xs relative z-10 ${
            canAfford 
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg' 
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

  // Create enhanced 5x5 grid
  const renderGrid = () => {
    const grid = []
    for (let y = 0; y < 5; y++) {
      const row = []
      for (let x = 0; x < 5; x++) {
        const isCenterPlot = x >= 1 && x <= 3 && y >= 1 && y <= 3
        
        if (isCenterPlot) {
          const farmPlot = farmPlots.find(fp => fp.plotX === (x - 1) && fp.plotY === (y - 1))
          if (farmPlot) {
            const hasDisease = cropDiseases.some(d => d.plotId === farmPlot.id)
            row.push(
              <Card
                key={`farm-${x}-${y}`}
                className={`h-20 md:h-28 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 ${
                  farmPlot.isReady 
                    ? 'ring-2 ring-amber-400 shadow-lg animate-pulse' 
                    : hasDisease 
                    ? 'ring-2 ring-red-400 shadow-lg'
                    : ''
                } bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-green-200 relative overflow-hidden`}
                style={{
                  transform: window.innerWidth >= 768 ? 'perspective(300px) rotateX(8deg) rotateY(-2deg)' : 'none',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Seasonal event glow */}
                {seasonalEvent && farmPlot.isReady && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-20 animate-pulse" />
                )}
                
                <CardContent className="p-0 h-full relative z-10">
                  {getPlotContent(farmPlot)}
                </CardContent>
              </Card>
            )
          } else {
            row.push(
              <div key={`empty-${x}-${y}`} className="h-20 md:h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-lg border-2 border-dashed border-green-300 flex items-center justify-center transform hover:scale-105 transition-all duration-200">
                <Plus className="h-4 w-4 md:h-6 md:w-6 text-green-400 animate-pulse" />
              </div>
            )
          }
        } else {
          const expansion = expansionPlots.find(ep => ep.plotX === x && ep.plotY === y)
          if (expansion) {
            const isPremium = expansion.plotType === 'premium'
            const isLegendary = expansion.plotType === 'legendary'
            
            row.push(
              <Card
                key={`expansion-${x}-${y}`}
                className={`h-20 md:h-28 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 ${
                  expansion.isPurchased 
                    ? (isPremium ? 'bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 border-amber-200' 
                       : isLegendary ? 'bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 border-purple-200'
                       : 'bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 border-green-200')
                    : 'bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 border-gray-200 hover:border-amber-300'
                } relative overflow-hidden`}
                style={{
                  transform: window.innerWidth >= 768 ? 'perspective(300px) rotateX(8deg) rotateY(-2deg)' : 'none',
                  boxShadow: expansion.isPurchased 
                    ? '0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)'
                    : '0 4px 8px rgba(0,0,0,0.08)'
                }}
              >
                <CardContent className="p-0 h-full">
                  {getExpansionPlotContent(expansion)}
                </CardContent>
              </Card>
            )
          } else {
            row.push(
              <div key={`placeholder-${x}-${y}`} className="h-20 md:h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 opacity-30" />
            )
          }
        }
      }
      grid.push(
        <div key={`row-${y}`} className="flex gap-1 md:gap-3 justify-center">
          {row}
        </div>
      )
    }
    return grid
  }

  const totalPlots = farmPlots.length + expansionPlots.filter(ep => ep.isPurchased).length
  const activePlots = farmPlots.filter(fp => fp.cropType).length
  const readyPlots = farmPlots.filter(fp => fp.isReady).length
  const diseasedPlots = cropDiseases.length

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Weather and Events */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-10 rounded-lg" />
        <div className="relative z-10 py-6">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            🚜 Interactive Farm Experience
          </h2>
          <p className="text-green-600 mb-4">Dynamic weather, seasonal events, and interactive farming!</p>
          
          {/* Weather and Event Status */}
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
            {currentWeather && (
              <Card className="p-3 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
                <div className="flex items-center gap-2">
                  {getWeatherIcon(currentWeather.weatherType)}
                  <div className="text-sm">
                    <div className="font-medium text-blue-800">Current Weather</div>
                    <div className="text-blue-600 text-xs">{currentWeather.description}</div>
                  </div>
                </div>
              </Card>
            )}
            
            {seasonalEvent && (
              <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-500" />
                  <div className="text-sm">
                    <div className="font-medium text-purple-800">{seasonalEvent.eventName}</div>
                    <div className="text-purple-600 text-xs">{seasonalEvent.bonusMultiplier}x harvest bonus!</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          {/* Farm Statistics */}
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
            <Badge variant="outline" className="px-3 py-1 bg-green-50">
              📊 Total: {totalPlots}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-blue-50">
              🌱 Active: {activePlots}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-amber-50">
              ✅ Ready: {readyPlots}
            </Badge>
            {diseasedPlots > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                🦠 Diseased: {diseasedPlots}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Farm Grid */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {renderGrid()}
      </div>

      {/* Farm Management Tabs */}
      <Tabs defaultValue="expansion" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expansion">🏗️ Expansion</TabsTrigger>
          <TabsTrigger value="decorations">🎨 Decorations</TabsTrigger>
          <TabsTrigger value="minigames">🎮 Mini-Games</TabsTrigger>
          <TabsTrigger value="social">👥 Social</TabsTrigger>
        </TabsList>

        <TabsContent value="expansion" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Expand Your Farm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 mb-4">
                Purchase expansion plots with FermaCoin for massive yield bonuses and faster growth!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-2xl mb-2">🌱</div>
                  <div className="font-medium">Standard</div>
                  <div className="text-sm text-gray-600">5 FC • Base stats</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg border border-amber-200">
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="font-medium text-amber-600">Premium</div>
                  <div className="text-sm text-amber-700">15 FC • +50% yield, +20% speed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="font-medium text-purple-600">Legendary</div>
                  <div className="text-sm text-purple-700">50 FC • +100% yield, +50% speed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decorations" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Flower className="h-5 w-5" />
                Farm Decorations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pink-700 mb-4">
                Personalize your farm with beautiful decorations! (Coming Soon)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['🏠 Farmhouse', '⛲ Fountain', '🌸 Flowers', '🌲 Trees', '🚜 Tractor', '🦅 Scarecrow'].map((decoration, index) => (
                  <div key={index} className="text-center p-4 bg-white rounded-lg border border-gray-200 opacity-50">
                    <div className="text-2xl mb-2">{decoration.split(' ')[0]}</div>
                    <div className="font-medium text-sm">{decoration.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minigames" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Farm Mini-Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                Play fun mini-games to earn bonus FermaCoin and boost your crops!
              </p>
              
              {showMiniGame ? (
                <div className="text-center p-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                  <div className="text-4xl mb-4">🎮</div>
                  <div className="text-2xl font-bold text-purple-800 mb-2">Farming Frenzy!</div>
                  <div className="text-lg text-purple-600 mb-4">Score: {miniGameScore}</div>
                  <div className="text-sm text-purple-500">Keep clicking to harvest faster!</div>
                  <Progress value={(miniGameScore % 100)} className="mt-4" />
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={startMiniGame}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                  >
                    <Star className="h-5 w-5 mr-2" />
                    Start Harvest Challenge
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">5-second challenge • Earn up to 0.5 FMC</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Social Farming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">
                Connect with other farmers, visit their farms, and trade resources! (Coming Soon)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200 opacity-50">
                  <div className="text-lg font-medium mb-2">👥 Visit Friends</div>
                  <div className="text-sm text-gray-600">Help friends with their crops and earn rewards</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 opacity-50">
                  <div className="text-lg font-medium mb-2">🤝 Trade Resources</div>
                  <div className="text-sm text-gray-600">Exchange crops and items with other players</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCrop && (
        <div className="text-center">
          <Button
            onClick={() => onSelectCrop(null)}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50"
          >
            Cancel Selection
          </Button>
        </div>
      )}
    </div>
  )
}