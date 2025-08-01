import React, { useState, useEffect, useCallback } from 'react'
import { Zap, Clock, ShoppingCart, Flame } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface FlashSalesProps {
  userId: string
  player: any
  onUpdatePlayer: (updates: any) => void
}

export function FlashSales({ userId, player, onUpdatePlayer }: FlashSalesProps) {
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({})

  const loadFlashSales = useCallback(async () => {
    try {
      const sales = await blink.db.flashSales.list({
        where: { isActive: true },
        orderBy: { expiresAt: 'asc' }
      })
      
      const now = new Date()
      const activeSales = sales.filter(sale => new Date(sale.expiresAt) > now)
      
      setFlashSales(activeSales)
    } catch (error) {
      console.error('Failed to load flash sales:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateTimeLeft = useCallback(() => {
    const now = new Date()
    const newTimeLeft: Record<string, string> = {}
    
    flashSales.forEach(sale => {
      const expiry = new Date(sale.expiresAt)
      const diff = expiry.getTime() - now.getTime()
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        newTimeLeft[sale.id] = `${hours}h ${minutes}m ${seconds}s`
      } else {
        newTimeLeft[sale.id] = 'EXPIRED'
      }
    })
    
    setTimeLeft(newTimeLeft)
  }, [flashSales])

  useEffect(() => {
    loadFlashSales()
  }, [loadFlashSales])

  useEffect(() => {
    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  const purchaseFlashSale = async (sale: any) => {
    if (!player || player.fermaCoin < sale.salePrice) {
      toast.error(`Need ${sale.salePrice} FermaCoin!`)
      return
    }

    try {
      await blink.db.flashSales.update(sale.id, {
        currentPurchases: sale.currentPurchases + 1
      })

      onUpdatePlayer({
        fermaCoin: Number(player.fermaCoin) - sale.salePrice
      })

      if (sale.itemType === 'crop_boost') {
        await blink.db.activeBoosts.create({
          id: `boost_${userId}_${Date.now()}`,
          userId,
          boostType: 'yield_2x',
          multiplier: 2.0,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        toast.success('🚀 2x Yield Boost activated for 24 hours!', {
          duration: 5000,
          style: { background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)', color: 'white', fontWeight: 'bold' }
        })
      } else if (sale.itemType === 'fmc_pack') {
        const bonusFmc = 2.0
        onUpdatePlayer({
          fermaCoin: Number(player.fermaCoin) + bonusFmc
        })
        toast.success(`💰 Received ${bonusFmc} FermaCoin bonus!`, {
          duration: 5000,
          style: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: 'white', fontWeight: 'bold' }
        })
      }

      loadFlashSales()
    } catch (error) {
      console.error('Failed to purchase flash sale:', error)
      toast.error('Failed to purchase item')
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    )
  }

  if (flashSales.length === 0) {
    return (
      <Card className="p-4 text-center text-gray-500">
        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No flash sales active right now</p>
        <p className="text-sm">Check back later for amazing deals!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Flame className="h-5 w-5 text-red-500" />
        <h3 className="font-bold text-red-600">⚡ Flash Sales</h3>
        <Badge variant="destructive" className="animate-pulse">
          LIMITED TIME
        </Badge>
      </div>
      
      {flashSales.map(sale => {
        const soldPercentage = (sale.currentPurchases / sale.maxPurchases) * 100
        const canAfford = Boolean(player && player.fermaCoin >= sale.salePrice)
        const isExpired = timeLeft[sale.id] === 'EXPIRED'
        const isSoldOut = sale.currentPurchases >= sale.maxPurchases
        
        return (
          <Card 
            key={sale.id} 
            className={`transition-all duration-300 ${
              !isExpired && !isSoldOut ? 'ring-2 ring-red-400 shadow-lg' : 'opacity-75'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{sale.itemName}</h4>
                    <Badge variant="destructive" className="text-xs">
                      -{sale.discountPercent}%
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="line-through text-gray-500">{sale.originalPrice} FMC</span>
                      <span className="font-bold text-red-600">{sale.salePrice} FMC</span>
                    </div>
                    <div className="flex items-center space-x-1 text-red-600">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono text-xs">{timeLeft[sale.id] || 'Loading...'}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => purchaseFlashSale(sale)}
                  disabled={!canAfford || isExpired || isSoldOut}
                  size="sm"
                  className={`${
                    canAfford && !isExpired && !isSoldOut
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {isSoldOut ? 'SOLD OUT' : isExpired ? 'EXPIRED' : 'BUY NOW'}
                </Button>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Stock: {sale.maxPurchases - sale.currentPurchases} left</span>
                  <span>{sale.currentPurchases}/{sale.maxPurchases} sold</span>
                </div>
                <Progress 
                  value={soldPercentage} 
                  className="h-2"
                />
              </div>
              
              {soldPercentage > 80 && (
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center space-x-1">
                  <Flame className="h-3 w-3" />
                  <span>Almost sold out!</span>
                </div>
              )}
              
              {timeLeft[sale.id] && timeLeft[sale.id].includes('0h') && !isExpired && (
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Ending soon!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}