import React, { useState, useEffect, useCallback } from 'react'
import { Package, Clock, Coins, CheckCircle, AlertCircle } from 'lucide-react'
import { CryptoShipment, PlayerInventoryItem, Crop } from '../types/game'
import { blink } from '../blink/client'

interface CryptoShipmentsProps {
  userId: string
  playerInventory: PlayerInventoryItem[]
  crops: Crop[]
  onUpdatePlayer: (updates: any) => void
}

export default function CryptoShipments({ userId, playerInventory, crops, onUpdatePlayer }: CryptoShipmentsProps) {
  const [cryptoShipments, setCryptoShipments] = useState<CryptoShipment[]>([])
  const [loading, setLoading] = useState(true)

  const generateDailyCryptoShipment = useCallback(async () => {
    try {
      // Create a challenging order requiring multiple rare crops
      const rareCrops = crops.filter(crop => crop.rarity === 'rare' || crop.rarity === 'uncommon')
      if (rareCrops.length === 0) return

      const requirements = []
      const numRequirements = Math.min(3, rareCrops.length)
      
      for (let i = 0; i < numRequirements; i++) {
        const crop = rareCrops[Math.floor(Math.random() * rareCrops.length)]
        const quantity = Math.floor(Math.random() * 10) + 5 // 5-15 items
        requirements.push({ itemId: crop.id, quantity })
      }

      const fmcReward = Math.floor(Math.random() * 15) + 10 // 10-25 FMC
      const expiresAt = new Date()
      expiresAt.setHours(23, 59, 59, 999) // Expires at end of day

      const shipment = await blink.db.cryptoShipments.create({
        id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: 'Daily Crypto Shipment',
        description: 'A rare and valuable order from the crypto markets. Complete before midnight!',
        requirements: JSON.stringify(requirements),
        fmcReward,
        expiresAt: expiresAt.toISOString()
      })

      setCryptoShipments([shipment as CryptoShipment])
    } catch (error) {
      console.error('Failed to generate crypto shipment:', error)
    }
  }, [crops])

  const loadCryptoShipments = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load active crypto shipments
      const shipments = await blink.db.cryptoShipments.list({
        where: { 
          completed: false,
          expiresAt: { gt: new Date().toISOString() }
        },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })

      setCryptoShipments(shipments as CryptoShipment[])
      
      // Generate daily crypto shipment if none exists for today
      if (shipments.length === 0) {
        await generateDailyCryptoShipment()
      }
    } catch (error) {
      console.error('Failed to load crypto shipments:', error)
    } finally {
      setLoading(false)
    }
  }, [generateDailyCryptoShipment])

  useEffect(() => {
    loadCryptoShipments()
  }, [loadCryptoShipments])

  const canCompleteShipment = (shipment: CryptoShipment) => {
    const requirements = JSON.parse(shipment.requirements)
    return requirements.every((req: { itemId: string; quantity: number }) => {
      const inventoryItem = playerInventory.find(item => 
        item.itemId === req.itemId && item.itemType === 'crop'
      )
      return inventoryItem && inventoryItem.quantity >= req.quantity
    })
  }

  const completeShipment = async (shipment: CryptoShipment) => {
    try {
      const requirements = JSON.parse(shipment.requirements)
      
      // Check if player has all required items
      if (!canCompleteShipment(shipment)) {
        alert('You don\'t have all the required items!')
        return
      }

      // Remove items from inventory
      for (const req of requirements) {
        const inventoryItem = playerInventory.find(item => 
          item.itemId === req.itemId && item.itemType === 'crop'
        )
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantity - req.quantity
          if (newQuantity <= 0) {
            await blink.db.playerInventory.delete(inventoryItem.id)
          } else {
            await blink.db.playerInventory.update(inventoryItem.id, {
              quantity: newQuantity
            })
          }
        }
      }

      // Mark shipment as completed
      await blink.db.cryptoShipments.update(shipment.id, {
        userId,
        completed: true,
        claimed: true
      })

      // Reward player with FermaCoin
      onUpdatePlayer({
        fermaCoin: (prev: number) => Number(prev) + Number(shipment.fmcReward)
      })

      // Refresh shipments
      loadCryptoShipments()
      
      alert(`Crypto Shipment completed! You earned ${shipment.fmcReward} FermaCoin!`)
    } catch (error) {
      console.error('Failed to complete shipment:', error)
      alert('Failed to complete shipment')
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime()
    const expires = new Date(expiresAt).getTime()
    const diff = expires - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-800">Crypto Shipments</h3>
        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
          Daily Special Orders
        </div>
      </div>

      {cryptoShipments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No crypto shipments available.</p>
          <p className="text-sm">Check back tomorrow for new orders!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cryptoShipments.map((shipment) => {
            const requirements = JSON.parse(shipment.requirements)
            const canComplete = canCompleteShipment(shipment)
            const timeRemaining = getTimeRemaining(shipment.expiresAt)
            const isExpired = timeRemaining === 'Expired'

            return (
              <div
                key={shipment.id}
                className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 ${
                  isExpired ? 'border-red-200 opacity-60' : 'border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                      {shipment.title}
                    </h4>
                    <p className="text-purple-600 text-sm mt-1">{shipment.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Coins className="w-5 h-5" />
                      <span className="text-xl font-bold">{shipment.fmcReward} FMC</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isExpired ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {timeRemaining}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Required Items:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {requirements.map((req: { itemId: string; quantity: number }, index: number) => {
                      const crop = crops.find(c => c.id === req.itemId)
                      const inventoryItem = playerInventory.find(item => 
                        item.itemId === req.itemId && item.itemType === 'crop'
                      )
                      const hasEnough = inventoryItem && inventoryItem.quantity >= req.quantity

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            hasEnough ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{crop?.emoji || '❓'}</span>
                            <div>
                              <div className="font-medium">{crop?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">
                                Need: {req.quantity}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {hasEnough ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-bold ${
                              hasEnough ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {inventoryItem?.quantity || 0}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => completeShipment(shipment)}
                  disabled={!canComplete || isExpired}
                  className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                    canComplete && !isExpired
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  {isExpired ? 'Expired' : canComplete ? `Complete Shipment (+${shipment.fmcReward} FMC)` : 'Missing Items'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}