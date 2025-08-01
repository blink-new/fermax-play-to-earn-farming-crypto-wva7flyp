import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { blink } from './blink/client'
import AnimalPen from './components/AnimalPen'
import Web3Auth from './components/Web3Auth'
import { Player, Crop, FarmPlot, ExpansionPlot, Animal, PlayerAnimal, PlayerInventoryItem } from './types/game'
import { GameHeader } from './components/GameHeader'
import { InteractiveFarm } from './components/InteractiveFarm'
import { ShopTab } from './components/ShopTab'
import { WalletTab } from './components/WalletTab'
import { MarketTab } from './components/MarketTab'
import { ChallengesTab } from './components/ChallengesTab'
import LeaderboardTab from './components/LeaderboardTab'
import StakingTab from './components/StakingTab'
import { DailyRewards } from './components/DailyRewards'
import { FlashSales } from './components/FlashSales'
import { Achievements } from './components/Achievements'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent } from './components/ui/card'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function App() {
  // Web3 state
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [web3Provider, setWeb3Provider] = useState<ethers.BrowserProvider | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  
  // Game state
  const [loading, setLoading] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [farmPlots, setFarmPlots] = useState<FarmPlot[]>([])
  const [expansionPlots, setExpansionPlots] = useState<ExpansionPlot[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [playerAnimals, setPlayerAnimals] = useState<PlayerAnimal[]>([])
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([])
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('farm')

  // Load game data when wallet is connected
  const loadGameData = async (userAddress: string) => {
    setLoading(true)
    try {
      // Load or create player using wallet address as userId
      const players = await blink.db.players.list({
        where: { userId: userAddress.toLowerCase() },
        limit: 1
      })

      let currentPlayer: Player
      if (players.length === 0) {
        try {
          // Create new player with wallet address
          const username = `Farmer_${userAddress.slice(0, 6)}`
          const uniqueId = `player_${userAddress.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          const newPlayer = await blink.db.players.create({
            id: uniqueId,
            userId: userAddress.toLowerCase(),
            username,
            level: 1,
            xp: 0,
            goldDucats: 100,
            goldSeeds: 100,
            fermaCoin: 5.0, // Start with some FermaCoin for engagement
            stakedFmc: 0.0,
            walletAddress: userAddress.toLowerCase(),
            walletType: 'metamask'
          })
          currentPlayer = newPlayer as Player
        } catch (error) {
          // Handle potential race condition
          console.log('Player creation failed, checking if player exists now:', error)
          const retryPlayers = await blink.db.players.list({
            where: { userId: userAddress.toLowerCase() },
            limit: 1
          })
          if (retryPlayers.length > 0) {
            currentPlayer = retryPlayers[0] as Player
          } else {
            throw error
          }
        }
      } else {
        currentPlayer = players[0] as Player
      }
      
      // Ensure numeric fields are properly typed
      currentPlayer.goldDucats = Number(currentPlayer.goldDucats) || 0
      currentPlayer.goldSeeds = Number(currentPlayer.goldSeeds) || 100
      currentPlayer.fermaCoin = Number(currentPlayer.fermaCoin) || 0
      currentPlayer.stakedFmc = Number(currentPlayer.stakedFmc) || 0
      currentPlayer.xp = Number(currentPlayer.xp) || 0
      currentPlayer.level = Number(currentPlayer.level) || 1
      setPlayer(currentPlayer)

      // Load farm plots
      const plots = await blink.db.farmPlots.list({
        where: { userId: userAddress.toLowerCase() }
      })

      // Initialize empty farm if no plots exist
      if (plots.length === 0) {
        const newPlots = []
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            const plot = await blink.db.farmPlots.create({
              id: `plot_${userAddress.toLowerCase()}_${x}_${y}`,
              userId: userAddress.toLowerCase(),
              plotX: x,
              plotY: y,
              growthStage: 0,
              isReady: false
            })
            newPlots.push(plot as FarmPlot)
          }
        }
        setFarmPlots(newPlots)
      } else {
        setFarmPlots(plots as FarmPlot[])
      }

      // Load crops
      const cropsData = await blink.db.crops.list()
      setCrops(cropsData as Crop[])

      // Load animals
      const animalsData = await blink.db.animals.list()
      setAnimals(animalsData as Animal[])

      // Load player animals
      const playerAnimalsData = await blink.db.playerAnimals.list({ 
        where: { userId: userAddress.toLowerCase() } 
      })
      setPlayerAnimals(playerAnimalsData as PlayerAnimal[])

      // Load player inventory
      const inventoryData = await blink.db.playerInventory.list({ 
        where: { userId: userAddress.toLowerCase() } 
      })
      setPlayerInventory(inventoryData as PlayerInventoryItem[])

      // Load expansion plots for this user
      const expansionData = await blink.db.expansionPlots.list({
        where: { userId: userAddress.toLowerCase() }
      })
      
      // If no expansion plots exist for this user, create them from template
      if (expansionData.length === 0) {
        const templateExpansions = await blink.db.expansionPlots.list({
          where: { userId: 'template' }
        })
        
        const userExpansions = []
        for (const template of templateExpansions) {
          const userExpansion = await blink.db.expansionPlots.create({
            id: `exp_${userAddress.toLowerCase()}_${template.plotX}_${template.plotY}`,
            userId: userAddress.toLowerCase(),
            plotX: template.plotX,
            plotY: template.plotY,
            plotType: template.plotType,
            fmcCost: template.fmcCost,
            yieldBonus: template.yieldBonus,
            growthSpeedBonus: template.growthSpeedBonus,
            isPurchased: false
          })
          userExpansions.push(userExpansion as ExpansionPlot)
        }
        setExpansionPlots(userExpansions)
      } else {
        setExpansionPlots(expansionData as ExpansionPlot[])
      }

    } catch (error) {
      console.error('Failed to load game data:', error)
      toast.error('Failed to load game data')
    } finally {
      setLoading(false)
    }
  }

  // Handle Web3 wallet connection
  const handleWalletConnect = async (address: string, provider: ethers.BrowserProvider) => {
    setWalletAddress(address)
    setWeb3Provider(provider)
    setIsWalletConnected(true)
    
    // Load game data for this wallet address
    await loadGameData(address)
  }

  const updatePlayer = (updates: Partial<Player>) => {
    if (!player) return
    
    // Handle function updates (for React state updates)
    const processedUpdates: any = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'function') {
        processedUpdates[key] = value((player as any)[key])
      } else {
        processedUpdates[key] = value
      }
    })
    
    // Ensure numeric values are properly typed
    const sanitizedUpdates = { ...processedUpdates }
    if (sanitizedUpdates.goldDucats !== undefined) {
      sanitizedUpdates.goldDucats = Number(sanitizedUpdates.goldDucats)
    }
    if (sanitizedUpdates.goldSeeds !== undefined) {
      sanitizedUpdates.goldSeeds = Number(sanitizedUpdates.goldSeeds)
    }
    if (sanitizedUpdates.fermaCoin !== undefined) {
      sanitizedUpdates.fermaCoin = Number(sanitizedUpdates.fermaCoin)
    }
    if (sanitizedUpdates.stakedFmc !== undefined) {
      sanitizedUpdates.stakedFmc = Number(sanitizedUpdates.stakedFmc)
    }
    if (sanitizedUpdates.xp !== undefined) {
      sanitizedUpdates.xp = Number(sanitizedUpdates.xp)
    }
    if (sanitizedUpdates.level !== undefined) {
      sanitizedUpdates.level = Number(sanitizedUpdates.level)
    }
    
    const updatedPlayer = { ...player, ...sanitizedUpdates }
    setPlayer(updatedPlayer)
    
    // Update in database with sanitized values
    blink.db.players.update(player.id, sanitizedUpdates).catch(console.error)
  }

  const updateFarmPlot = (plotId: string, updates: Partial<FarmPlot>) => {
    setFarmPlots(prev => prev.map(plot => 
      plot.id === plotId ? { ...plot, ...updates } : plot
    ))
    
    // Update in database
    blink.db.farmPlots.update(plotId, updates).catch(console.error)
  }

  const purchaseExpansion = async (expansionId: string) => {
    const expansion = expansionPlots.find(ep => ep.id === expansionId)
    if (!expansion || !player) return

    const currentFermaCoin = Number(player.fermaCoin) || 0
    if (currentFermaCoin < expansion.fmcCost) {
      toast.error(`Need ${expansion.fmcCost} FermaCoin!`)
      return
    }

    try {
      // Deduct FermaCoin and update expansion
      updatePlayer({ fermaCoin: currentFermaCoin - expansion.fmcCost })
      
      // Mark expansion as purchased
      await blink.db.expansionPlots.update(expansionId, { 
        isPurchased: true,
        purchasedAt: new Date().toISOString()
      })
      
      // Update local state
      setExpansionPlots(prev => prev.map(ep => 
        ep.id === expansionId ? { ...ep, isPurchased: true, purchasedAt: new Date().toISOString() } : ep
      ))

      // Create corresponding farm plot
      const newFarmPlot = await blink.db.farmPlots.create({
        id: `plot_${player.userId}_${expansion.plotX}_${expansion.plotY}`,
        userId: player.userId,
        plotX: expansion.plotX,
        plotY: expansion.plotY,
        growthStage: 0,
        isReady: false,
        plotType: expansion.plotType,
        yieldBonus: expansion.yieldBonus,
        growthSpeedBonus: expansion.growthSpeedBonus
      })

      setFarmPlots(prev => [...prev, newFarmPlot as FarmPlot])
      
      toast.success(`🎉 Purchased ${expansion.plotType} plot! +${Math.round((expansion.yieldBonus - 1) * 100)}% yield bonus!`, {
        duration: 4000,
        style: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: 'white', fontWeight: 'bold' }
      })
    } catch (error) {
      console.error('Failed to purchase expansion:', error)
      toast.error('Failed to purchase expansion')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-green-700">Loading FermaX...</p>
        </div>
      </div>
    )
  }

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-green-800 mb-4">🌾 FermaX</h1>
            <p className="text-xl text-green-600 mb-2">Play-to-Earn Farming Game</p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Audzējiet kultūras, nopelniet FermaCoin kriptovalūtu un tirgojiet NFT fermas produktus. 
              Pieslēdzieties ar savu Web3 wallet, lai sāktu!
            </p>
          </div>
          
          <Web3Auth 
            onConnect={handleWalletConnect}
            isConnected={isWalletConnected}
            address={walletAddress}
          />
          
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="p-6">
                <div className="text-3xl mb-3">🌱</div>
                <h3 className="font-semibold text-green-800 mb-2">Audzējiet Kultūras</h3>
                <p className="text-sm text-gray-600">Stādiet, laistiet un novāciet ražu, lai nopelnītu Gold Ducats</p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold text-green-800 mb-2">Nopelniet FermaCoin</h3>
                <p className="text-sm text-gray-600">Īsta kriptovalūta, ko var izņemt uz savu wallet</p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="font-semibold text-green-800 mb-2">Achievements</h3>
                <p className="text-sm text-gray-600">Unlock achievements and earn bonus FermaCoin</p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-green-800 mb-2">Flash Sales</h3>
                <p className="text-sm text-gray-600">Limited time offers and daily rewards</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <GameHeader player={player} />
      
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        <div className="mb-4 p-2 md:p-3 bg-green-100 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-medium text-xs md:text-sm">Web3 Wallet Connected</span>
            </div>
            <span className="text-green-600 font-mono text-xs md:text-sm">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-3)}
            </span>
          </div>
        </div>

        {/* Daily Rewards and Flash Sales - Always visible for engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <DailyRewards 
            userId={walletAddress.toLowerCase()}
            onUpdatePlayer={updatePlayer}
          />
          <FlashSales 
            userId={walletAddress.toLowerCase()}
            player={player}
            onUpdatePlayer={updatePlayer}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 mb-6 h-auto">
            <TabsTrigger value="farm" className="text-xs md:text-sm p-2 md:p-3">
              <span className="block md:hidden">🌱</span>
              <span className="hidden md:block">🌱 Farm</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="text-xs md:text-sm p-2 md:p-3">
              <span className="block md:hidden">🏪</span>
              <span className="hidden md:block">🏪 Shop</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="text-xs md:text-sm p-2 md:p-3">
              <span className="block md:hidden">📈</span>
              <span className="hidden md:block">📈 Market</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs md:text-sm p-2 md:p-3">
              <span className="block md:hidden">💰</span>
              <span className="hidden md:block">💰 Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs md:text-sm p-2 md:p-3 md:col-span-1 col-span-4">
              <span className="block md:hidden">🎯 Challenges</span>
              <span className="hidden md:block">🎯 Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs md:text-sm p-2 md:p-3 md:col-span-1 col-span-4">
              <span className="block md:hidden">🏆 Achievements</span>
              <span className="hidden md:block">🏆 Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs md:text-sm p-2 md:p-3 md:col-span-1 col-span-4">
              <span className="block md:hidden">👑 Leaderboard</span>
              <span className="hidden md:block">👑 Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="staking" className="text-xs md:text-sm p-2 md:p-3 md:col-span-1 col-span-4">
              <span className="block md:hidden">🏦 Staking</span>
              <span className="hidden md:block">🏦 Staking</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="farm">
            <InteractiveFarm
              farmPlots={farmPlots}
              expansionPlots={expansionPlots}
              crops={crops}
              player={player}
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              onPurchaseExpansion={purchaseExpansion}
              onPlantCrop={(plotId, cropId) => {
                const crop = crops.find(c => c.id === cropId)
                if (!crop || !player) return

                const currentGold = Number(player.goldDucats) || 0
                if (currentGold < crop.basePrice) {
                  toast.error('Not enough Gold Ducats!')
                  return
                }

                updatePlayer({ goldDucats: currentGold - crop.basePrice })
                updateFarmPlot(plotId, {
                  cropType: cropId,
                  plantedAt: new Date().toISOString(),
                  growthStage: 1,
                  isReady: false
                })
                toast.success(`Planted ${crop.name}!`)
              }}
              onWaterCrop={(plotId) => {
                updateFarmPlot(plotId, {
                  wateredAt: new Date().toISOString(),
                  growthStage: 2
                })
                toast.success('Crop watered!')
              }}
              onHarvestCrop={async (plotId) => {
                const plot = farmPlots.find(p => p.id === plotId)
                const crop = crops.find(c => c.id === plot?.cropType)
                if (!plot || !crop || !player) return

                // Ensure all values are numbers for proper calculation
                const currentGold = Number(player.goldDucats) || 0
                const currentXp = Number(player.xp) || 0
                const currentFermaCoin = Number(player.fermaCoin) || 0
                
                // Apply yield bonus from plot type
                const yieldMultiplier = plot.yieldBonus || 1.0
                const bonusGold = Math.round((crop.basePrice * 2) * yieldMultiplier)
                const bonusXp = Math.round(crop.xpReward * yieldMultiplier)
                const bonusFermaCoin = crop.fermaCoinReward * yieldMultiplier
                
                const newGold = currentGold + bonusGold
                const newXp = currentXp + bonusXp
                let newFermaCoin = currentFermaCoin + bonusFermaCoin

                // Legendary Harvest Event (1 in 1,000 chance for better engagement)
                const isLegendaryHarvest = Math.random() < (1 / 1000)
                let legendaryBonus = 0
                if (isLegendaryHarvest) {
                  legendaryBonus = Math.random() * 4 + 1 // 1-5 FMC
                  newFermaCoin += legendaryBonus
                  
                  // Record legendary harvest
                  try {
                    await blink.db.legendaryHarvests.create({
                      id: `lh_${player.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                      userId: player.userId,
                      cropType: crop.id,
                      fmcReward: legendaryBonus
                    })
                  } catch (error) {
                    console.error('Failed to record legendary harvest:', error)
                  }
                }

                updatePlayer({
                  goldDucats: newGold,
                  xp: newXp,
                  fermaCoin: newFermaCoin,
                  level: Math.floor(newXp / 100) + 1
                })

                // Add to player inventory
                try {
                  const existingInventory = await blink.db.playerInventory.list({
                    where: { userId: player.userId, itemId: crop.id, itemType: 'crop' },
                    limit: 1
                  })

                  if (existingInventory.length > 0) {
                    // Update existing inventory
                    const item = existingInventory[0]
                    await blink.db.playerInventory.update(item.id, {
                      quantity: Number(item.quantity) + 1
                    })
                  } else {
                    // Create new inventory item with more unique ID
                    const uniqueInventoryId = `inv_${player.userId}_${crop.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
                    try {
                      await blink.db.playerInventory.create({
                        id: uniqueInventoryId,
                        userId: player.userId,
                        itemId: crop.id,
                        itemType: 'crop',
                        quantity: 1
                      })
                    } catch (createError) {
                      // Handle potential duplicate ID - retry with new ID
                      const retryId = `inv_${player.userId}_${crop.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
                      await blink.db.playerInventory.create({
                        id: retryId,
                        userId: player.userId,
                        itemId: crop.id,
                        itemType: 'crop',
                        quantity: 1
                      })
                    }
                  }
                } catch (error) {
                  console.error('Failed to update inventory:', error)
                  toast.error('Failed to update inventory')
                }

                updateFarmPlot(plotId, {
                  cropType: undefined,
                  plantedAt: undefined,
                  wateredAt: undefined,
                  growthStage: 0,
                  isReady: false
                })

                let message = `Harvested ${crop.name}! +${bonusGold} Gold Ducats, +${bonusXp} XP${bonusFermaCoin > 0 ? `, +${bonusFermaCoin.toFixed(3)} FC` : ''}${yieldMultiplier > 1 ? ` (${Math.round((yieldMultiplier - 1) * 100)}% bonus!)` : ''}`
                if (isLegendaryHarvest) {
                  message += ` ✨ LEGENDARY HARVEST! +${legendaryBonus.toFixed(2)} FMC BONUS!`
                  toast.success(message, { duration: 6000, style: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: 'white', fontWeight: 'bold' } })
                } else {
                  toast.success(message)
                }
              }}
            />
            <div className="mt-8">
              <AnimalPen 
                animals={animals}
                playerAnimals={playerAnimals}
                onCollect={async (playerAnimalId) => {
                  const playerAnimal = playerAnimals.find(pa => pa.id === playerAnimalId);
                  const animal = animals.find(a => a.id === playerAnimal?.animalId);
                  if (!playerAnimal || !animal || !player) return;

                  const now = new Date();
                  const lastCollected = new Date(playerAnimal.lastCollectedAt);
                  const productionTime = animal.productionTimeSeconds * 1000;

                  if (now.getTime() - lastCollected.getTime() < productionTime) {
                    toast.error('Not ready to collect yet!');
                    return;
                  }

                  const currentXp = Number(player.xp) || 0;
                  const newXp = currentXp + animal.xpReward;
                  updatePlayer({ 
                    xp: newXp,
                    level: Math.floor(newXp / 100) + 1
                  });

                  // Update last collected time
                  await blink.db.playerAnimals.update(playerAnimal.id, { lastCollectedAt: now.toISOString() });
                  setPlayerAnimals(prev => prev.map(pa => pa.id === playerAnimalId ? { ...pa, lastCollectedAt: now.toISOString() } : pa));

                  // Add product to inventory
                  try {
                    const existingInventory = await blink.db.playerInventory.list({
                      where: { userId: player.userId, itemId: animal.id, itemType: 'animal_product' },
                      limit: 1
                    });

                    if (existingInventory.length > 0) {
                      const item = existingInventory[0];
                      await blink.db.playerInventory.update(item.id, {
                        quantity: Number(item.quantity) + 1
                      });
                    } else {
                      const uniqueInventoryId = `inv_${player.userId}_${animal.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
                      await blink.db.playerInventory.create({
                        id: uniqueInventoryId,
                        userId: player.userId,
                        itemId: animal.id,
                        itemType: 'animal_product',
                        quantity: 1
                      });
                    }
                  } catch (error) {
                    console.error('Failed to update inventory:', error);
                  }

                  toast.success(`Collected ${animal.productName}! +${animal.xpReward} XP`);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <ShopTab
              crops={crops}
              animals={animals}
              player={player}
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              onBuyAnimal={async (animalId) => {
                const animal = animals.find(a => a.id === animalId);
                if (!animal || !player) return;

                const currentGold = Number(player.goldDucats) || 0;
                if (currentGold < animal.cost) {
                  toast.error('Not enough Gold Ducats!');
                  return;
                }

                updatePlayer({ goldDucats: currentGold - animal.cost });

                const newPlayerAnimal = await blink.db.playerAnimals.create({
                  id: `pa_${player.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  userId: player.userId,
                  animalId: animal.id,
                });

                setPlayerAnimals(prev => [...prev, newPlayerAnimal as PlayerAnimal]);
                toast.success(`You bought a ${animal.name}!`);
              }}
            />
          </TabsContent>

          <TabsContent value="market">
            <MarketTab
              player={player}
              crops={crops}
              onUpdatePlayer={updatePlayer}
            />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletTab player={player} onUpdatePlayer={updatePlayer} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesTab
              player={player}
              playerInventory={playerInventory}
              crops={crops}
              onUpdatePlayer={updatePlayer}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <Achievements
              userId={walletAddress.toLowerCase()}
              player={player}
              onUpdatePlayer={updatePlayer}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab
              userId={walletAddress.toLowerCase()}
              onUpdatePlayer={updatePlayer}
            />
          </TabsContent>

          <TabsContent value="staking">
            <StakingTab
              userId={walletAddress.toLowerCase()}
              player={player}
              onUpdatePlayer={updatePlayer}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App