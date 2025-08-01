import React, { useState, useEffect, useCallback } from 'react'
import { Gift, Calendar, Coins, Star, Flame } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'

interface DailyRewardsProps {
  userId: string
  onUpdatePlayer: (updates: any) => void
}

export function DailyRewards({ userId, onUpdatePlayer }: DailyRewardsProps) {
  const [dailyReward, setDailyReward] = useState<any>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadDailyReward = useCallback(async () => {
    try {
      const rewards = await blink.db.dailyRewards.list({
        where: { userId },
        limit: 1
      })

      if (rewards.length === 0) {
        const newReward = await blink.db.dailyRewards.create({
          id: `dr_${userId}_${Date.now()}`,
          userId,
          dayStreak: 1,
          lastClaimDate: null,
          totalClaims: 0
        })
        setDailyReward(newReward)
        setCanClaim(true)
      } else {
        const reward = rewards[0]
        setDailyReward(reward)
        
        const today = new Date().toDateString()
        const lastClaim = reward.lastClaimDate ? new Date(reward.lastClaimDate).toDateString() : null
        setCanClaim(lastClaim !== today)
      }
    } catch (error) {
      console.error('Failed to load daily reward:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadDailyReward()
  }, [userId, loadDailyReward])

  const claimDailyReward = async () => {
    if (!dailyReward || !canClaim) return

    try {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const lastClaim = dailyReward.lastClaimDate ? new Date(dailyReward.lastClaimDate) : null
      const isConsecutive = lastClaim && lastClaim.toDateString() === yesterday.toDateString()
      
      const newStreak = isConsecutive ? dailyReward.dayStreak + 1 : 1
      const streakMultiplier = Math.min(newStreak, 7)
      
      const baseFmc = 0.1
      const baseGold = 50
      const baseXp = 25
      
      const fmcReward = baseFmc * streakMultiplier
      const goldReward = baseGold * streakMultiplier
      const xpReward = baseXp * streakMultiplier

      await blink.db.dailyRewards.update(dailyReward.id, {
        dayStreak: newStreak,
        lastClaimDate: today.toISOString(),
        totalClaims: dailyReward.totalClaims + 1
      })

      onUpdatePlayer({
        fermaCoin: (prev: number) => Number(prev) + fmcReward,
        goldDucats: (prev: number) => Number(prev) + goldReward,
        xp: (prev: number) => Number(prev) + xpReward
      })

      setDailyReward(prev => ({
        ...prev,
        dayStreak: newStreak,
        lastClaimDate: today.toISOString(),
        totalClaims: prev.totalClaims + 1
      }))
      setCanClaim(false)

      toast.success(
        `🎁 Day ${newStreak} Reward! +${fmcReward.toFixed(3)} FMC, +${goldReward} Gold, +${xpReward} XP`,
        { 
          duration: 5000,
          style: { 
            background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
            color: 'white', 
            fontWeight: 'bold' 
          }
        }
      )
    } catch (error) {
      console.error('Failed to claim daily reward:', error)
      toast.error('Failed to claim daily reward')
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  const streakMultiplier = Math.min(dailyReward?.dayStreak || 1, 7)
  const nextRewardFmc = 0.1 * streakMultiplier
  const nextRewardGold = 50 * streakMultiplier
  const nextRewardXp = 25 * streakMultiplier

  return (
    <Card className={`transition-all duration-300 ${canClaim ? 'ring-2 ring-amber-400 shadow-lg animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${canClaim ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Gift className={`h-6 w-6 ${canClaim ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-800">Daily Reward</h3>
                {dailyReward?.dayStreak > 1 && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>{dailyReward.dayStreak} day streak</span>
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {canClaim ? (
                  <span className="text-green-600 font-medium">Ready to claim!</span>
                ) : (
                  <span>Come back tomorrow</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {canClaim ? (
              <Button
                onClick={claimDailyReward}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Gift className="h-4 w-4 mr-2" />
                Claim
              </Button>
            ) : (
              <div className="text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Tomorrow</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {canClaim && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Coins className="h-4 w-4 text-amber-500" />
                <span>{nextRewardFmc.toFixed(3)} FMC</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-600">💰</span>
                <span>{nextRewardGold} Gold</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-blue-500" />
                <span>{nextRewardXp} XP</span>
              </div>
            </div>
            {streakMultiplier > 1 && (
              <div className="text-xs text-center text-amber-600 mt-1">
                {streakMultiplier}x streak bonus!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}