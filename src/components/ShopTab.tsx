import { Crop, Player, Animal } from '../types/game'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Coins, Clock, Zap, Sparkles, Egg, Milk } from 'lucide-react'

interface ShopTabProps {
  crops: Crop[]
  animals: Animal[]
  player: Player | null
  selectedCrop: string | null
  onSelectCrop: (cropId: string | null) => void
  onBuyAnimal: (animalId: string) => void
}

export function ShopTab({ crops, animals, player, selectedCrop, onSelectCrop, onBuyAnimal }: ShopTabProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'uncommon': return 'bg-blue-100 text-blue-800'
      case 'rare': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'rare': return '✨'
      case 'uncommon': return '🔹'
      default: return '🌱'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          🏪 Crypto Shop
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">Buy seeds and animals for your farm</p>
      </div>

      <Tabs defaultValue="seeds" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seeds">Seeds</TabsTrigger>
          <TabsTrigger value="animals">Animals</TabsTrigger>
        </TabsList>
        <TabsContent value="seeds">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
            {crops.map((crop) => {
              const canAfford = Boolean(player && player.goldDucats >= crop.basePrice)
              const isSelected = selectedCrop === crop.id

              return (
                <Card
                  key={crop.id}
                  className={`cursor-pointer transition-all hover:shadow-xl hover:shadow-primary/10 border-border/50 backdrop-blur-sm ${
                    isSelected ? 'ring-2 ring-primary shadow-xl shadow-primary/20' : ''
                  } ${!canAfford ? 'opacity-60' : ''}`}
                  onClick={() => onSelectCrop(isSelected ? null : crop.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getRarityIcon(crop.rarity)}</span>
                        <h3 className="font-semibold text-foreground">{crop.name}</h3>
                      </div>
                      <Badge className={`${getRarityColor(crop.rarity)} border-0`}>
                        {crop.rarity}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4 text-yellow-400" />
                          <span className="text-muted-foreground">Cost:</span>
                        </div>
                        <span className="font-medium text-yellow-300">{crop.basePrice} Gold</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-muted-foreground">Growth:</span>
                        </div>
                        <span className="font-medium text-blue-300">{crop.growthTime}s</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-green-400" />
                          <span className="text-muted-foreground">XP:</span>
                        </div>
                        <span className="font-medium text-green-300">+{crop.xpReward}</span>
                      </div>

                      {crop.fermaCoinReward > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-muted-foreground">FermaCoin:</span>
                          </div>
                          <span className="font-medium text-purple-300">
                            +{crop.fermaCoinReward} FC
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <Button
                        className={`w-full transition-all ${
                          isSelected
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                        }`}
                        disabled={!canAfford}
                      >
                        {isSelected ? 'Selected' : canAfford ? 'Select' : 'Not enough Gold'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="animals">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
            {animals.map((animal) => {
              const canAfford = Boolean(player && player.goldDucats >= animal.cost)
              return (
                <Card key={animal.id} className={`border-border/50 backdrop-blur-sm hover:shadow-xl hover:shadow-accent/10 transition-all ${!canAfford ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{animal.emoji}</span>
                        <h3 className="font-semibold text-foreground">{animal.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{animal.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Coins className="h-4 w-4 text-yellow-400" />
                          <span className="text-muted-foreground">Cost:</span>
                        </div>
                        <span className="font-medium text-yellow-300">{animal.cost} Gold</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {animal.productEmoji === '🥚' ? <Egg className="h-4 w-4 text-orange-400" /> : <Milk className="h-4 w-4 text-blue-300" />}
                          <span className="text-muted-foreground">Produces:</span>
                        </div>
                        <span className="font-medium text-foreground">{animal.productName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-muted-foreground">Time:</span>
                        </div>
                        <span className="font-medium text-blue-300">{animal.productionTimeSeconds / 60} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-green-400" />
                          <span className="text-muted-foreground">XP:</span>
                        </div>
                        <span className="font-medium text-green-300">+{animal.xpReward}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 transition-all"
                        disabled={!canAfford}
                        onClick={() => onBuyAnimal(animal.id)}
                      >
                        {canAfford ? 'Buy' : 'Not enough Gold'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selectedCrop && (
        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 backdrop-blur-sm">
          <p className="text-primary">
            <strong>{crops.find(c => c.id === selectedCrop)?.name}</strong> selected! 
            Go to the Farm tab to plant it.
          </p>
        </div>
      )}
    </div>
  )
}
