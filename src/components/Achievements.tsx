import React, { useState, useEffect, useCallback } from 'react'
import { Trophy, Star, Crown, Gift, Lock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface AchievementsProps {
  userId: string
  player: any
  onUpdatePlayer: (updates: any) => void
}

export function Achievements({ userId, player, onUpdatePlayer }: AchievementsProps) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [playerAchievements, setPlayerAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAchievements = useCallback(async () => {
    try {
      const allAchievements = await blink.db.achievements.list({
        orderBy: { category: 'asc' }
      })
      
      const playerProgress = await blink.db.playerAchievements.list({
        where: { userId }
      })
      
      setAchievements(allAchievements)
      setPlayerAchievements(playerProgress)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  const getPlayerProgress = (achievementId: string) => {
    return playerAchievements.find(pa => pa.achievementId === achievementId)
  }

  const claimAchievement = async (achievement: any) => {
    const progress = getPlayerProgress(achievement.id)
    if (!progress || !progress.isCompleted || progress.claimed) return

    try {
      await blink.db.playerAchievements.update(progress.id, {
        claimed: true
      })

      const updates: any = {}
      if (achievement.fmcReward > 0) {
        updates.fermaCoin = Number(player.fermaCoin) + achievement.fmcReward
      }
      if (achievement.goldReward > 0) {
        updates.goldDucats = Number(player.goldDucats) + achievement.goldReward
      }
      if (achievement.xpReward > 0) {
        updates.xp = Number(player.xp) + achievement.xpReward
        updates.level = Math.floor((Number(player.xp) + achievement.xpReward) / 100) + 1
      }

      onUpdatePlayer(updates)

      setPlayerAchievements(prev => prev.map(pa => 
        pa.id === progress.id ? { ...pa, claimed: true } : pa
      ))

      toast.success(
        `🏆 Achievement Unlocked: ${achievement.title}! +${achievement.fmcReward} FMC, +${achievement.goldReward} Gold, +${achievement.xpReward} XP`,
        { 
          duration: 6000,
          style: { 
            background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
            color: 'white', 
            fontWeight: 'bold' 
          }
        }
      )
    } catch (error) {
      console.error('Failed to claim achievement:', error)
      toast.error('Failed to claim achievement')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'farming': return '🌾'
      case 'trading': return '📈'
      case 'social': return '👥'
      case 'premium': return '💎'
      default: return '🏆'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'farming': return 'bg-green-100 text-green-800'
      case 'trading': return 'bg-blue-100 text-blue-800'
      case 'social': return 'bg-purple-100 text-purple-800'
      case 'premium': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span>Achievements</span>
        </h2>
        <p className="text-gray-600">Complete challenges to earn FermaCoin and rewards!</p>
      </div>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            <h3 className="font-semibold text-lg capitalize">{category}</h3>
            <Badge className={getCategoryColor(category)}>
              {categoryAchievements.length} achievements
            </Badge>
          </div>

          <div className="grid gap-3">
            {categoryAchievements.map(achievement => {
              const progress = getPlayerProgress(achievement.id)
              const progressPercent = progress 
                ? Math.min((progress.progress / achievement.requirementValue) * 100, 100)
                : 0
              const isCompleted = progress?.isCompleted || false
              const isClaimed = progress?.claimed || false
              const canClaim = isCompleted && !isClaimed

              return (
                <Card 
                  key={achievement.id}
                  className={`transition-all duration-300 ${
                    canClaim ? 'ring-2 ring-yellow-400 shadow-lg animate-pulse' : 
                    isCompleted ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          isCompleted ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : achievement.isPremium ? (
                            <Crown className="h-6 w-6 text-amber-500" />
                          ) : (
                            <span className="text-xl">{achievement.icon}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                            {achievement.isPremium && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          
                          {!isCompleted && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Progress</span>
                                <span>{progress?.progress || 0}/{achievement.requirementValue}</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 mt-2 text-xs">
                            {achievement.fmcReward > 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="text-amber-500">💰</span>
                                <span>{achievement.fmcReward} FMC</span>
                              </div>
                            )}
                            {achievement.goldReward > 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">🪙</span>
                                <span>{achievement.goldReward} Gold</span>
                              </div>
                            )}
                            {achievement.xpReward > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-blue-500" />
                                <span>{achievement.xpReward} XP</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {canClaim ? (
                          <Button
                            onClick={() => claimAchievement(achievement)}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold animate-pulse"
                          >
                            <Gift className="h-3 w-3 mr-1" />
                            Claim
                          </Button>
                        ) : isCompleted ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : achievement.isPremium && !player.stakedFmc ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                            <Lock className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {Math.round(progressPercent)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}