import React, { useState, useEffect, useCallback } from 'react'
import { Trophy, Crown, Medal, Star, Clock, Coins } from 'lucide-react'
import { WeeklyLeaderboard } from '../types/game'
import { blink } from '../blink/client'

interface LeaderboardTabProps {
  userId: string
  onUpdatePlayer: (updates: any) => void
}

export default function LeaderboardTab({ userId, onUpdatePlayer }: LeaderboardTabProps) {
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState('')
  const [timeUntilReset, setTimeUntilReset] = useState('')

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current week start (Monday 00:01 UTC)
      const now = new Date()
      const monday = new Date(now)
      monday.setUTCDate(now.getUTCDate() - (now.getUTCDay() + 6) % 7)
      monday.setUTCHours(0, 1, 0, 0)
      const weekStart = monday.toISOString()
      setCurrentWeekStart(weekStart)

      // Load current week's leaderboard
      const leaderboardData = await blink.db.weeklyLeaderboard.list({
        where: { weekStart },
        orderBy: { rankPosition: 'asc' },
        limit: 100
      })

      setLeaderboard(leaderboardData as WeeklyLeaderboard[])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateTimeUntilReset = useCallback(() => {
    const now = new Date()
    const nextMonday = new Date(now)
    nextMonday.setUTCDate(now.getUTCDate() + (7 - (now.getUTCDay() + 6) % 7) % 7)
    nextMonday.setUTCHours(0, 1, 0, 0)
    
    const diff = nextMonday.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    setTimeUntilReset(`${days}d ${hours}h ${minutes}m`)
  }, [])

  useEffect(() => {
    loadLeaderboard()
    calculateTimeUntilReset()
    
    // Update countdown every minute
    const interval = setInterval(calculateTimeUntilReset, 60000)
    return () => clearInterval(interval)
  }, [loadLeaderboard, calculateTimeUntilReset])

  const claimReward = async (leaderboardEntry: WeeklyLeaderboard) => {
    try {
      // Mark as claimed
      await blink.db.weeklyLeaderboard.update(leaderboardEntry.id, {
        claimed: true
      })

      // Update player's FermaCoin
      onUpdatePlayer({
        fermaCoin: (prev: number) => Number(prev) + Number(leaderboardEntry.fmcReward)
      })

      // Refresh leaderboard
      loadLeaderboard()
    } catch (error) {
      console.error('Failed to claim reward:', error)
    }
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Medal className="w-6 h-6 text-amber-600" />
      default: return <Trophy className="w-5 h-5 text-gray-500" />
    }
  }

  const getRankColor = (position: number) => {
    if (position <= 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (position <= 10) return 'bg-gradient-to-r from-purple-400 to-purple-600'
    if (position <= 25) return 'bg-gradient-to-r from-blue-400 to-blue-600'
    return 'bg-gradient-to-r from-gray-400 to-gray-600'
  }

  const userEntry = leaderboard.find(entry => entry.userId === userId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Weekly Leaderboard
            </h2>
            <p className="text-yellow-100 mt-1">Compete for FermaCoin rewards!</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-yellow-100">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Resets in:</span>
            </div>
            <div className="text-xl font-bold">{timeUntilReset}</div>
          </div>
        </div>
      </div>

      {/* Reward Tiers */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-4 text-white text-center">
          <Crown className="w-8 h-8 mx-auto mb-2" />
          <div className="font-bold">Top 1%</div>
          <div className="text-2xl font-bold">50 FMC</div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-4 text-white text-center">
          <Medal className="w-8 h-8 mx-auto mb-2" />
          <div className="font-bold">Top 10%</div>
          <div className="text-2xl font-bold">10 FMC</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-4 text-white text-center">
          <Star className="w-8 h-8 mx-auto mb-2" />
          <div className="font-bold">Top 25%</div>
          <div className="text-2xl font-bold">1 FMC</div>
        </div>
      </div>

      {/* User's Position */}
      {userEntry && (
        <div className={`rounded-xl p-4 text-white ${getRankColor(userEntry.rankPosition)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRankIcon(userEntry.rankPosition)}
              <div>
                <div className="font-bold">Your Rank: #{userEntry.rankPosition}</div>
                <div className="text-sm opacity-90">
                  {userEntry.xpGained} XP gained this week
                </div>
              </div>
            </div>
            {userEntry.fmcReward > 0 && !userEntry.claimed && (
              <button
                onClick={() => claimReward(userEntry)}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Claim {userEntry.fmcReward} FMC
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="font-bold text-gray-800">Current Week Rankings</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rankings yet this week.</p>
              <p className="text-sm">Start farming to get on the leaderboard!</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 ${
                  entry.userId === userId ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rankPosition)}
                    <span className="font-bold text-lg">#{entry.rankPosition}</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {entry.userId === userId ? 'You' : `Player ${entry.userId.slice(-4)}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.xpGained} XP • {entry.ordersCompleted} orders
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {entry.fmcReward > 0 && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-amber-600">
                        {entry.fmcReward} FMC
                      </span>
                      {entry.claimed && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Claimed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}