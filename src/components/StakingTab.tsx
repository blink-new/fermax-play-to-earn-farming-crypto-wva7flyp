import React, { useState, useEffect, useCallback } from 'react'
import { Vault, TrendingUp, Lock, Unlock, Coins, Calculator, Clock } from 'lucide-react'
import { StakingVault } from '../types/game'
import { blink } from '../blink/client'

interface StakingTabProps {
  userId: string
  player: any
  onUpdatePlayer: (updates: any) => void
}

export default function StakingTab({ userId, player, onUpdatePlayer }: StakingTabProps) {
  const [stakingVaults, setStakingVaults] = useState<StakingVault[]>([])
  const [loading, setLoading] = useState(true)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [projectedEarnings, setProjectedEarnings] = useState(0)

  const APY_RATE = 0.12 // 12% APY

  const loadStakingData = useCallback(async () => {
    try {
      setLoading(true)
      const vaults = await blink.db.stakingVault.list({
        where: { userId },
        orderBy: { stakedAt: 'desc' }
      })
      setStakingVaults(vaults as StakingVault[])
    } catch (error) {
      console.error('Failed to load staking data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadStakingData()
  }, [loadStakingData])

  useEffect(() => {
    // Calculate projected earnings
    const amount = parseFloat(stakeAmount) || 0
    const dailyRate = APY_RATE / 365
    const projected = amount * dailyRate
    setProjectedEarnings(projected)
  }, [stakeAmount])

  const totalStaked = stakingVaults.reduce((sum, vault) => sum + vault.stakedAmount, 0)
  const dailyEarnings = totalStaked * (APY_RATE / 365)
  const monthlyEarnings = dailyEarnings * 30
  const yearlyEarnings = totalStaked * APY_RATE

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (!amount || amount <= 0 || amount > player.fermaCoin) {
      alert('Invalid stake amount')
      return
    }

    try {
      // Create staking vault entry
      const vaultId = `vault_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await blink.db.stakingVault.create({
        id: vaultId,
        userId,
        stakedAmount: amount,
        apyRate: APY_RATE,
        stakedAt: new Date().toISOString(),
        lastRewardCalculated: new Date().toISOString()
      })

      // Update player's FermaCoin and staked amount
      onUpdatePlayer({
        fermaCoin: Number(player.fermaCoin) - amount,
        stakedFmc: Number(player.stakedFmc || 0) + amount
      })

      setStakeAmount('')
      loadStakingData()
    } catch (error) {
      console.error('Failed to stake:', error)
      alert('Failed to stake FermaCoin')
    }
  }

  const handleUnstake = async (vault: StakingVault) => {
    const amount = parseFloat(unstakeAmount)
    if (!amount || amount <= 0 || amount > vault.stakedAmount) {
      alert('Invalid unstake amount')
      return
    }

    try {
      // Calculate pending rewards
      const now = new Date()
      const lastCalculated = new Date(vault.lastRewardCalculated)
      const daysSinceLastReward = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24)
      const pendingRewards = vault.stakedAmount * (vault.apyRate / 365) * daysSinceLastReward

      if (amount === vault.stakedAmount) {
        // Full unstake - remove vault
        await blink.db.stakingVault.delete(vault.id)
      } else {
        // Partial unstake - update vault
        await blink.db.stakingVault.update(vault.id, {
          stakedAmount: vault.stakedAmount - amount,
          lastRewardCalculated: now.toISOString()
        })
      }

      // Update player's balances
      onUpdatePlayer({
        fermaCoin: Number(player.fermaCoin) + amount + pendingRewards,
        stakedFmc: Number(player.stakedFmc || 0) - amount
      })

      setUnstakeAmount('')
      loadStakingData()
    } catch (error) {
      console.error('Failed to unstake:', error)
      alert('Failed to unstake FermaCoin')
    }
  }

  const claimRewards = async (vault: StakingVault) => {
    try {
      const now = new Date()
      const lastCalculated = new Date(vault.lastRewardCalculated)
      const daysSinceLastReward = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24)
      const rewards = vault.stakedAmount * (vault.apyRate / 365) * daysSinceLastReward

      if (rewards <= 0) {
        alert('No rewards to claim yet')
        return
      }

      // Update vault's last reward calculation time
      await blink.db.stakingVault.update(vault.id, {
        lastRewardCalculated: now.toISOString()
      })

      // Update player's FermaCoin
      onUpdatePlayer({
        fermaCoin: Number(player.fermaCoin) + rewards
      })

      loadStakingData()
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      alert('Failed to claim rewards')
    }
  }

  const calculatePendingRewards = (vault: StakingVault) => {
    const now = new Date()
    const lastCalculated = new Date(vault.lastRewardCalculated)
    const daysSinceLastReward = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24)
    return vault.stakedAmount * (vault.apyRate / 365) * daysSinceLastReward
  }

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
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Vault className="w-8 h-8" />
              Staking Vault
            </h2>
            <p className="text-purple-100 mt-1">Earn passive income with your FermaCoin</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{APY_RATE * 100}%</div>
            <div className="text-purple-100">Annual APY</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm font-medium">Total Staked</span>
          </div>
          <div className="text-2xl font-bold">{totalStaked.toFixed(4)} FMC</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Daily Earnings</span>
          </div>
          <div className="text-2xl font-bold">{dailyEarnings.toFixed(6)} FMC</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calculator className="w-5 h-5" />
            <span className="text-sm font-medium">Monthly Est.</span>
          </div>
          <div className="text-2xl font-bold">{monthlyEarnings.toFixed(4)} FMC</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-medium">Yearly Est.</span>
          </div>
          <div className="text-2xl font-bold">{yearlyEarnings.toFixed(4)} FMC</div>
        </div>
      </div>

      {/* Stake New FermaCoin */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lock className="w-6 h-6 text-purple-600" />
          Stake FermaCoin
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Stake
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.0000"
              step="0.0001"
              max={player.fermaCoin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-500 mt-1">
              Available: {player.fermaCoin.toFixed(4)} FMC
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projected Daily Earnings
            </label>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {projectedEarnings.toFixed(6)} FMC
              </div>
              <div className="text-sm text-purple-500">per day</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleStake}
          disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > player.fermaCoin}
          className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          Stake FermaCoin
        </button>
      </div>

      {/* Active Stakes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="font-bold text-gray-800">Your Staking Vaults</h3>
        </div>
        {stakingVaults.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Vault className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active stakes yet.</p>
            <p className="text-sm">Start staking to earn passive income!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stakingVaults.map((vault) => {
              const pendingRewards = calculatePendingRewards(vault)
              const daysSinceStaked = (new Date().getTime() - new Date(vault.stakedAt).getTime()) / (1000 * 60 * 60 * 24)
              
              return (
                <div key={vault.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-lg">{vault.stakedAmount.toFixed(4)} FMC</div>
                      <div className="text-sm text-gray-600">
                        Staked {Math.floor(daysSinceStaked)} days ago
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {pendingRewards.toFixed(6)} FMC
                      </div>
                      <div className="text-sm text-gray-600">Pending Rewards</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => claimRewards(vault)}
                      disabled={pendingRewards <= 0.000001}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      Claim Rewards
                    </button>
                    
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="Amount"
                        step="0.0001"
                        max={vault.stakedAmount}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleUnstake(vault)}
                        disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > vault.stakedAmount}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <Unlock className="w-4 h-4" />
                        Unstake
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}