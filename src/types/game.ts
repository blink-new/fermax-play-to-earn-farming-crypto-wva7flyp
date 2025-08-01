export interface Player {
  id: string
  userId: string
  username: string
  level: number
  xp: number
  goldDucats: number
  goldSeeds: number // New soft currency
  fermaCoin: number
  stakedFmc: number // Staked FermaCoin amount
  walletAddress: string // Required for Web3 auth
  walletType: string // Required for Web3 auth
  goldenLicenseExpires?: string // Premium marketplace access
  createdAt: string
  updatedAt: string
}

export interface Crop {
  id: string
  name: string
  emoji: string
  growthTime: number
  basePrice: number
  xpReward: number
  fermaCoinReward: number
  rarity: 'common' | 'uncommon' | 'rare'
}

export interface FarmPlot {
  id: string
  userId: string
  plotX: number
  plotY: number
  cropType?: string
  plantedAt?: string
  wateredAt?: string
  growthStage: number
  isReady: boolean
  plotType?: 'standard' | 'premium' | 'legendary'
  yieldBonus?: number
  growthSpeedBonus?: number
  createdAt: string
  updatedAt: string
}

export interface ExpansionPlot {
  id: string
  userId: string
  plotX: number
  plotY: number
  plotType: 'standard' | 'premium' | 'legendary'
  fmcCost: number
  yieldBonus: number
  growthSpeedBonus: number
  isPurchased: boolean
  purchasedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MarketListing {
  id: string
  sellerId: string
  sellerName: string
  cropId: string
  cropName: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  status: 'active' | 'sold' | 'expired'
  createdAt: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'harvest' | 'plant' | 'earn' | 'level' | 'trade'
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  targetValue: number
  goldReward: number
  fermaCoinReward: number
  xpReward: number
  startDate: string
  endDate: string
  isActive: boolean
  priority: number
}

export interface ChallengeProgress {
  id: string
  userId: string
  challengeId: string
  currentProgress: number
  isCompleted: boolean
  completedAt?: string
}

export interface Animal {
  id: string
  name: string
  emoji: string
  description: string
  cost: number
  productName: string
  productEmoji: string
  productionTimeSeconds: number
  xpReward: number
}

export interface PlayerAnimal {
  id: string
  userId: string
  animalId: string
  lastCollectedAt: string
}

export interface PlayerInventoryItem {
  id: string
  userId: string
  itemId: string
  itemType: 'crop' | 'animal_product'
  quantity: number
}

// New economy-related interfaces
export interface WeeklyLeaderboard {
  id: string
  userId: string
  weekStart: string
  weekEnd: string
  xpGained: number
  ordersCompleted: number
  totalValue: number
  rankPosition: number
  fmcReward: number
  claimed: boolean
  createdAt: string
}

export interface LegendaryHarvest {
  id: string
  userId: string
  cropType: string
  fmcReward: number
  createdAt: string
}

export interface CryptoShipment {
  id: string
  userId?: string
  title: string
  description: string
  requirements: { itemId: string; quantity: number }[]
  fmcReward: number
  expiresAt: string
  completed: boolean
  claimed: boolean
  createdAt: string
}

export interface LegendaryLand {
  id: string
  userId: string
  plotX: number
  plotY: number
  landType: 'golden' | 'diamond' | 'platinum'
  yieldBonus: number
  growthTimeModifier: number
  fmcCost: number
  purchasedAt: string
}

export interface StakingVault {
  id: string
  userId: string
  stakedAmount: number
  apyRate: number
  stakedAt: string
  lastRewardCalculated: string
}

export interface PremiumMarketListing {
  id: string
  userId: string
  itemId: string
  itemType: string
  quantity: number
  priceGoldSeeds: number
  premiumBonus: number
  createdAt: string
}

// New engagement and monetization interfaces
export interface DailyReward {
  id: string
  userId: string
  dayStreak: number
  lastClaimDate?: string
  totalClaims: number
  createdAt: string
  updatedAt: string
}

export interface FlashSale {
  id: string
  itemType: 'crop_boost' | 'fmc_pack' | 'premium_plot'
  itemName: string
  originalPrice: number
  salePrice: number
  discountPercent: number
  startsAt: string
  expiresAt: string
  maxPurchases: number
  currentPurchases: number
  isActive: boolean
  createdAt: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'farming' | 'trading' | 'social' | 'premium'
  requirementType: string
  requirementValue: number
  fmcReward: number
  goldReward: number
  xpReward: number
  isPremium: boolean
  createdAt: string
}

export interface PlayerAchievement {
  id: string
  userId: string
  achievementId: string
  progress: number
  isCompleted: boolean
  completedAt?: string
  claimed: boolean
  createdAt: string
}

export interface ActiveBoost {
  id: string
  userId: string
  boostType: 'yield_2x' | 'growth_speed_2x' | 'legendary_chance_10x'
  multiplier: number
  expiresAt: string
  createdAt: string
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: string
}

export interface Gift {
  id: string
  senderId: string
  receiverId: string
  giftType: 'fmc' | 'gold' | 'boost'
  giftValue: number
  message?: string
  isClaimed: boolean
  expiresAt: string
  createdAt: string
}

// New interactive farm features
export interface WeatherEvent {
  id: string
  weatherType: 'sunny' | 'rainy' | 'storm' | 'drought'
  startTime: string
  endTime: string
  growthModifier: number
  yieldModifier: number
  description: string
}

export interface CropDisease {
  id: string
  plotId: string
  diseaseType: 'aphids' | 'blight' | 'rust' | 'wilt'
  severity: 1 | 2 | 3
  discoveredAt: string
  treatedAt?: string
}

export interface FarmDecoration {
  id: string
  userId: string
  decorationType: 'scarecrow' | 'fountain' | 'fence' | 'flowers' | 'windmill' | 'barn'
  positionX: number
  positionY: number
  purchasedAt: string
  fmcCost: number
}

export interface SeasonalEvent {
  id: string
  eventName: string
  eventType: 'harvest_festival' | 'spring_bloom' | 'winter_sale'
  startDate: string
  endDate: string
  bonusMultiplier: number
  specialRewards: string // JSON string
  isActive: boolean
}

export interface FarmAchievement {
  id: string
  userId: string
  achievementType: string
  unlockedAt: string
  fmcReward: number
}

export interface GameState {
  player: Player | null
  farmPlots: FarmPlot[]
  crops: Crop[]
  animals: Animal[]
  playerAnimals: PlayerAnimal[]
  playerInventory: PlayerInventoryItem[]
  weeklyLeaderboard: WeeklyLeaderboard[]
  cryptoShipments: CryptoShipment[]
  legendaryLands: LegendaryLand[]
  stakingVault: StakingVault[]
  dailyRewards: DailyReward[]
  flashSales: FlashSale[]
  achievements: Achievement[]
  playerAchievements: PlayerAchievement[]
  activeBoosts: ActiveBoost[]
  weatherEvents: WeatherEvent[]
  cropDiseases: CropDisease[]
  farmDecorations: FarmDecoration[]
  seasonalEvents: SeasonalEvent[]
  selectedCrop: string | null
  activeTab: 'farm' | 'shop' | 'market' | 'wallet' | 'challenges' | 'leaderboard' | 'staking'
}