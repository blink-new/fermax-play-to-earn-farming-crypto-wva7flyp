import { Player } from '../types/game'
import { Card, CardContent } from './ui/card'
import { Coins, Zap, Trophy } from 'lucide-react'

interface GameHeaderProps {
  player: Player | null
}

export function GameHeader({ player }: GameHeaderProps) {
  if (!player) return null

  return (
    <div className="bg-card border-b border-border shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ⚡ FermaX
            </h1>
            <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Welcome, {player.username}!
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-3 overflow-x-auto">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 flex-shrink-0 backdrop-blur-sm">
              <CardContent className="p-1 md:p-2 flex items-center space-x-1 md:space-x-2">
                <Coins className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
                <div className="text-xs md:text-sm">
                  <div className="font-medium text-yellow-300">{player.goldDucats}</div>
                  <div className="text-xs text-yellow-400/70 hidden md:block">Gold Ducats</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 flex-shrink-0 backdrop-blur-sm">
              <CardContent className="p-1 md:p-2 flex items-center space-x-1 md:space-x-2">
                <div className="text-green-400 text-sm md:text-base">🌱</div>
                <div className="text-xs md:text-sm">
                  <div className="font-medium text-green-300">{player.goldSeeds || 0}</div>
                  <div className="text-xs text-green-400/70 hidden md:block">Gold Seeds</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 flex-shrink-0 backdrop-blur-sm">
              <CardContent className="p-1 md:p-2 flex items-center space-x-1 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse shadow-lg shadow-purple-500/25"></div>
                <div className="text-xs md:text-sm">
                  <div className="font-medium text-purple-300">{player.fermaCoin.toFixed(3)}</div>
                  <div className="text-xs text-purple-400/70 hidden md:block">FermaCoin</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 flex-shrink-0 backdrop-blur-sm">
              <CardContent className="p-1 md:p-2 flex items-center space-x-1 md:space-x-2">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                <div className="text-xs md:text-sm">
                  <div className="font-medium text-blue-300">Lv {player.level}</div>
                  <div className="text-xs text-blue-400/70 hidden md:block">{player.xp} XP</div>
                  <div className="w-8 md:w-16 bg-blue-900/50 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-1 rounded-full transition-all duration-300 shadow-sm" 
                      style={{ width: `${((player.xp % 100) / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}