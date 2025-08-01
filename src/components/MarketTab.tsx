import { useState, useEffect, useCallback } from 'react'
import { Player, Crop, MarketListing } from '../types/game'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { blink } from '../blink/client'

interface MarketTabProps {
  player: Player | null
  crops: Crop[]
  onUpdatePlayer: (updates: Partial<Player>) => void
}

export function MarketTab({ player, crops, onUpdatePlayer }: MarketTabProps) {
  const [marketListings, setMarketListings] = useState<MarketListing[]>([])
  const [playerInventory, setPlayerInventory] = useState<any[]>([])
  const [sellQuantity, setSellQuantity] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(false)

  const loadMarketData = async () => {
    try {
      const listings = await blink.db.marketListings.list({
        orderBy: { createdAt: 'desc' },
        limit: 20
      })
      setMarketListings(listings as MarketListing[])
    } catch (error) {
      console.error('Failed to load market data:', error)
    }
  }

  const loadPlayerInventory = useCallback(async () => {
    if (!player?.userId) return
    
    try {
      const inventory = await blink.db.playerInventory.list({
        where: { userId: player.userId },
        orderBy: { quantity: 'desc' }
      })
      setPlayerInventory(inventory)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    }
  }, [player?.userId])

  useEffect(() => {
    loadMarketData()
    loadPlayerInventory()
  }, [player?.id, loadPlayerInventory])

  const createListing = async (cropId: string, quantity: number, pricePerUnit: number) => {
    if (!player) return

    setLoading(true)
    try {
      const crop = crops.find(c => c.id === cropId)
      if (!crop) return

      await blink.db.marketListings.create({
        id: `listing_${Date.now()}`,
        sellerId: player.userId,
        sellerName: player.username,
        cropId,
        cropName: crop.name,
        quantity,
        pricePerUnit,
        totalPrice: quantity * pricePerUnit,
        status: 'active',
        createdAt: new Date().toISOString()
      })

      // Remove from player inventory
      const inventoryItem = playerInventory.find(item => item.itemId === cropId && item.itemType === 'crop')
      if (inventoryItem) {
        const newQuantity = inventoryItem.quantity - quantity
        if (newQuantity <= 0) {
          await blink.db.playerInventory.delete(inventoryItem.id)
        } else {
          await blink.db.playerInventory.update(inventoryItem.id, { quantity: newQuantity })
        }
      }

      toast.success(`Listed ${quantity} ${crop.name} for sale!`)
      loadMarketData()
      loadPlayerInventory()
    } catch (error) {
      console.error('Failed to create listing:', error)
      toast.error('Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  const buyListing = async (listing: MarketListing) => {
    if (!player) return

    const currentGold = Number(player.goldDucats) || 0
    if (currentGold < listing.totalPrice) {
      toast.error('Not enough Gold Ducats!')
      return
    }

    setLoading(true)
    try {
      // Update buyer's gold
      onUpdatePlayer({ goldDucats: currentGold - listing.totalPrice })

      // Add to buyer's inventory
      const existingItem = playerInventory.find(item => item.itemId === listing.cropId && item.itemType === 'crop')
      if (existingItem) {
        await blink.db.playerInventory.update(existingItem.id, {
          quantity: existingItem.quantity + listing.quantity
        })
      } else {
        const uniqueInventoryId = `inv_${player.userId}_${listing.cropId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        await blink.db.playerInventory.create({
          id: uniqueInventoryId,
          userId: player.userId,
          itemId: listing.cropId,
          itemType: 'crop',
          quantity: listing.quantity
        })
      }

      // Update seller's gold (find seller and add gold)
      const sellers = await blink.db.players.list({
        where: { userId: listing.sellerId },
        limit: 1
      })
      
      if (sellers.length > 0) {
        const seller = sellers[0] as Player
        const sellerGold = Number(seller.goldDucats) || 0
        await blink.db.players.update(seller.id, {
          goldDucats: sellerGold + listing.totalPrice
        })
      }

      // Mark listing as sold
      await blink.db.marketListings.update(listing.id, { status: 'sold' })

      toast.success(`Bought ${listing.quantity} ${listing.cropName}!`)
      loadMarketData()
      loadPlayerInventory()
    } catch (error) {
      console.error('Failed to buy listing:', error)
      toast.error('Failed to buy listing')
    } finally {
      setLoading(false)
    }
  }

  const getMarketTrend = (cropId: string) => {
    const recentListings = marketListings
      .filter(l => l.cropId === cropId && l.status === 'sold')
      .slice(0, 5)
    
    if (recentListings.length < 2) return 'stable'
    
    const avgOld = recentListings.slice(2).reduce((sum, l) => sum + l.pricePerUnit, 0) / (recentListings.length - 2)
    const avgNew = recentListings.slice(0, 2).reduce((sum, l) => sum + l.pricePerUnit, 0) / 2
    
    if (avgNew > avgOld * 1.1) return 'up'
    if (avgNew < avgOld * 0.9) return 'down'
    return 'stable'
  }

  const activeListings = marketListings.filter(l => l.status === 'active' && l.sellerId !== player?.userId)
  const myListings = marketListings.filter(l => l.sellerId === player?.userId)

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          🏪 FermaX Marketplace
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">Trade crops with other farmers worldwide</p>
      </div>

      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">🛒 Buy Crops</TabsTrigger>
          <TabsTrigger value="sell">📦 Sell Crops</TabsTrigger>
          <TabsTrigger value="my-listings">📋 My Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <div className="grid gap-4">
            {activeListings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No crops available for purchase right now.</p>
                  <p className="text-sm text-gray-500 mt-2">Check back later or start selling your own crops!</p>
                </CardContent>
              </Card>
            ) : (
              activeListings.map((listing) => {
                const crop = crops.find(c => c.id === listing.cropId)
                const trend = getMarketTrend(listing.cropId)
                
                return (
                  <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{crop?.emoji || '🌾'}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{listing.cropName}</h3>
                            <p className="text-sm text-gray-600">
                              Sold by {listing.sellerName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">
                                {listing.quantity} units
                              </Badge>
                              <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                                {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                                {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                                {listing.pricePerUnit} Gold/unit
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {listing.totalPrice} 🪙
                          </div>
                          <Button
                            onClick={() => buyListing(listing)}
                            disabled={loading || !player || Number(player.goldDucats) < listing.totalPrice}
                            className="mt-2"
                          >
                            {loading ? 'Buying...' : 'Buy Now'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="grid gap-4">
            {playerInventory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Your inventory is empty.</p>
                  <p className="text-sm text-gray-500 mt-2">Harvest some crops first to start selling!</p>
                </CardContent>
              </Card>
            ) : (
              playerInventory.filter(item => item.itemType === 'crop').map((item) => {
                const crop = crops.find(c => c.id === item.itemId)
                const suggestedPrice = Math.floor((crop?.basePrice || 10) * 1.5)
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{crop?.emoji || '🌾'}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{crop?.name || 'Unknown Crop'}</h3>
                            <p className="text-sm text-gray-600">
                              Available: {item.quantity} units
                            </p>
                            <p className="text-xs text-gray-500">
                              Suggested price: {suggestedPrice} Gold/unit
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            max={item.quantity}
                            value={sellQuantity[item.id] || ''}
                            onChange={(e) => setSellQuantity(prev => ({
                              ...prev,
                              [item.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-20"
                          />
                          <Input
                            type="number"
                            placeholder="Price/unit"
                            min="1"
                            value={sellQuantity[`price_${item.id}`] || suggestedPrice}
                            onChange={(e) => setSellQuantity(prev => ({
                              ...prev,
                              [`price_${item.id}`]: parseInt(e.target.value) || suggestedPrice
                            }))}
                            className="w-24"
                          />
                          <Button
                            onClick={() => {
                              const quantity = sellQuantity[item.id] || 1
                              const price = sellQuantity[`price_${item.id}`] || suggestedPrice
                              if (quantity > 0 && quantity <= item.quantity) {
                                createListing(item.itemId, quantity, price)
                              }
                            }}
                            disabled={loading || !sellQuantity[item.id] || sellQuantity[item.id] > item.quantity}
                          >
                            List for Sale
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-4">
          <div className="grid gap-4">
            {myListings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">You have no active listings.</p>
                </CardContent>
              </Card>
            ) : (
              myListings.map((listing) => {
                const crop = crops.find(c => c.id === listing.cropId)
                
                return (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{crop?.emoji || '🌾'}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{listing.cropName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">
                                {listing.quantity} units
                              </Badge>
                              <Badge variant="secondary">
                                {listing.pricePerUnit} Gold/unit
                              </Badge>
                              <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                                {listing.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {listing.totalPrice} 🪙
                          </div>
                          <p className="text-xs text-gray-500">
                            Listed {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}