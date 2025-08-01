import { useState, useEffect, useCallback } from 'react'
import { Player, Challenge, ChallengeProgress, PlayerInventoryItem, Crop } from '../types/game'
import CryptoShipments from './CryptoShipments'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Trophy, Clock, Star, Gift } from 'lucide-react'
import toast from 'react-hot-toast'
import { blink } from '../blink/client'

interface ChallengesTabProps {
  player: Player | null
  playerInventory?: PlayerInventoryItem[]
  crops?: Crop[]
  onUpdatePlayer: (updates: Partial<Player>) => void
}

export function ChallengesTab({ player, playerInventory = [], crops = [], onUpdatePlayer }: ChallengesTabProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [playerProgress, setPlayerProgress] = useState<ChallengeProgress[]>([])
  const [loading, setLoading] = useState(false)

  const loadChallenges = async () => {
    try {
      const challengesData = await blink.db.challenges.list({
        where: { isActive: true },
        orderBy: { priority: 'asc' }
      })
      setChallenges(challengesData as Challenge[])
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }
  }

  const loadPlayerProgress = useCallback(async () => {
    if (!player?.userId) return
    
    try {
      const progress = await blink.db.challengeProgress.list({
        where: { userId: player.userId }
      })
      setPlayerProgress(progress as ChallengeProgress[])
    } catch (error) {
      console.error('Failed to load challenge progress:', error)
    }
  }, [player?.userId])

  useEffect(() => {
    loadChallenges()
    if (player?.id) {
      loadPlayerProgress()
    }
  }, [player?.id, loadPlayerProgress])

  const claimReward = async (challengeId: string) => {
    if (!player) return

    const challenge = challenges.find(c => c.id === challengeId)
    const progress = playerProgress.find(p => p.challengeId === challengeId)
    
    if (!challenge || !progress || progress.isCompleted) return

    setLoading(true)
    try {
      // Update player rewards
      const currentGold = Number(player.goldDucats) || 0
      const currentFermaCoin = Number(player.fermaCoin) || 0
      const currentXp = Number(player.xp) || 0

      onUpdatePlayer({
        goldDucats: currentGold + challenge.goldReward,
        fermaCoin: currentFermaCoin + challenge.fermaCoinReward,
        xp: currentXp + challenge.xpReward
      })

      // Mark challenge as completed
      await blink.db.challengeProgress.update(progress.id, {
        isCompleted: true,
        completedAt: new Date().toISOString()
      })

      toast.success(`Challenge completed! +${challenge.goldReward} Gold, +${challenge.fermaCoinReward} FC, +${challenge.xpReward} XP`)
      loadPlayerProgress()
    } catch (error) {
      console.error('Failed to claim reward:', error)
      toast.error('Failed to claim reward')
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'harvest': return '🌾'
      case 'plant': return '🌱'
      case 'earn': return '🪙'
      case 'level': return '⭐'
      case 'trade': return '🤝'
      default: return '🎯'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      case 'legendary': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Sample challenges data (in real app, this would come from database)
  const sampleChallenges: Challenge[] = [
    {
      id: 'weekly_harvest_100',
      title: 'Weekly Harvest Master',
      description: 'Harvest 100 crops this week',
      type: 'harvest',
      difficulty: 'medium',
      targetValue: 100,
      goldReward: 500,
      fermaCoinReward: 0.5,
      xpReward: 200,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      priority: 1
    },
    {
      id: 'daily_plant_10',
      title: 'Daily Planter',
      description: 'Plant 10 crops today',
      type: 'plant',
      difficulty: 'easy',
      targetValue: 10,
      goldReward: 100,
      fermaCoinReward: 0.1,
      xpReward: 50,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      priority: 2
    },
    {
      id: 'golden_pumpkin_5',
      title: 'Golden Farmer',
      description: 'Harvest 5 Golden Pumpkins',
      type: 'harvest',
      difficulty: 'hard',
      targetValue: 5,
      goldReward: 1000,
      fermaCoinReward: 1.0,
      xpReward: 500,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      priority: 3
    },
    {
      id: 'level_up_5',
      title: 'Rising Star',
      description: 'Reach level 5',
      type: 'level',
      difficulty: 'medium',
      targetValue: 5,
      goldReward: 750,
      fermaCoinReward: 0.75,
      xpReward: 300,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      priority: 4
    }
  ]

  const activeChallenges = challenges.length > 0 ? challenges : sampleChallenges

  return (
    <div className="space-y-8">
      {/* Crypto Shipments Section */}
      {player && (
        <CryptoShipments
          userId={player.userId}
          playerInventory={playerInventory}
          crops={crops}
          onUpdatePlayer={onUpdatePlayer}
        />
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-2">🎯 Weekly Challenges</h2>
        <p className="text-green-600">Complete challenges to earn FermaCoin and exclusive rewards</p>
      </div>

      <div className="grid gap-4">
        {activeChallenges.map((challenge) => {
          const progress = playerProgress.find(p => p.challengeId === challenge.id)
          const currentProgress = progress?.currentProgress || 0
          const isCompleted = progress?.isCompleted || false
          const progressPercentage = Math.min((currentProgress / challenge.targetValue) * 100, 100)
          const canClaim = currentProgress >= challenge.targetValue && !isCompleted
          const timeRemaining = getTimeRemaining(challenge.endDate)
          
          return (
            <Card key={challenge.id} className={`hover:shadow-lg transition-all duration-300 ${
              isCompleted ? 'bg-green-50 border-green-200' : 
              canClaim ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-300' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getChallengeIcon(challenge.type)}</div>
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{challenge.title}</span>
                        {isCompleted && <Trophy className="h-5 w-5 text-yellow-500" />}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {timeRemaining}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress: {currentProgress} / {challenge.targetValue}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span>🪙</span>
                        <span>{challenge.goldReward}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>💎</span>
                        <span>{challenge.fermaCoinReward} FC</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{challenge.xpReward} XP</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => claimReward(challenge.id)}
                      disabled={!canClaim || loading || timeRemaining === 'Expired'}
                      variant={canClaim ? 'default' : 'outline'}
                      size="sm"
                      className={canClaim ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse' : ''}
                    >
                      {isCompleted ? (
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>Completed</span>
                        </div>
                      ) : canClaim ? (
                        <div className="flex items-center space-x-1">
                          <Gift className="h-4 w-4" />
                          <span>Claim Reward</span>
                        </div>
                      ) : timeRemaining === 'Expired' ? (
                        'Expired'
                      ) : (
                        'In Progress'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Challenge Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Challenge Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Focus on Golden Pumpkins for maximum FermaCoin rewards</li>
            <li>• Complete daily challenges first for quick rewards</li>
            <li>• Weekly challenges offer the biggest FermaCoin bonuses</li>
            <li>• Check back daily for new challenges and opportunities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}