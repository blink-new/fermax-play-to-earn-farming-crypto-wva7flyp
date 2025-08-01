import { useState } from 'react'
import { Player } from '../types/game'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Wallet, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface WalletTabProps {
  player: Player | null
  onUpdatePlayer: (updates: Partial<Player>) => void
}

export function WalletTab({ player, onUpdatePlayer }: WalletTabProps) {
  const [walletAddress, setWalletAddress] = useState(player?.walletAddress || '')
  const [walletType, setWalletType] = useState(player?.walletType || 'ethereum')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address')
      return
    }

    setIsConnecting(true)
    try {
      onUpdatePlayer({
        walletAddress: walletAddress.trim(),
        walletType
      })
      toast.success('Wallet connected successfully!')
    } catch (error) {
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectWallet = () => {
    onUpdatePlayer({
      walletAddress: undefined,
      walletType: undefined
    })
    setWalletAddress('')
    toast.success('Wallet disconnected')
  }

  const handleWithdraw = () => {
    if (!player?.walletAddress) {
      toast.error('Please connect a wallet first')
      return
    }

    if (!player.fermaCoin || player.fermaCoin < 0.001) {
      toast.error('Minimum withdrawal is 0.001 FermaCoin')
      return
    }

    // In a real implementation, this would trigger a blockchain transaction
    toast.success('Withdrawal initiated! (Demo mode)')
  }

  const copyAddress = () => {
    if (player?.walletAddress) {
      navigator.clipboard.writeText(player.walletAddress)
      toast.success('Address copied to clipboard')
    }
  }

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'ethereum': return 'Ethereum (ETH)'
      case 'polygon': return 'Polygon (MATIC)'
      case 'bsc': return 'Binance Smart Chain (BNB)'
      case 'solana': return 'Solana (SOL)'
      default: return type
    }
  }

  if (!player) return null

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto px-2 md:px-0">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          💰 Crypto Wallet
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">Connect your wallet to withdraw FermaCoin</p>
      </div>

      {/* FermaCoin Balance */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-500/25"></div>
            <span className="text-foreground">FermaCoin Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-300 mb-2">
            {player.fermaCoin.toFixed(4)} FC
          </div>
          <p className="text-sm text-purple-400/70">
            Minimum withdrawal: 0.001 FC
          </p>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Wallet Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {player.walletAddress ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 space-y-2 md:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 mb-1">
                    <Badge className="bg-green-100 text-green-800 w-fit">Connected</Badge>
                    <span className="text-xs md:text-sm font-medium">
                      {getWalletTypeLabel(player.walletType || 'ethereum')}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 font-mono break-all">
                    {player.walletAddress.slice(0, 8)}...{player.walletAddress.slice(-6)}
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button
                    onClick={copyAddress}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden md:inline ml-1">Copy</span>
                  </Button>
                  <Button
                    onClick={handleDisconnectWallet}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                className="w-full bg-purple-600 hover:bg-purple-700 text-sm md:text-base py-3"
                disabled={player.fermaCoin < 0.001}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Withdraw FermaCoin
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Connect your wallet to withdraw FermaCoin
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="walletType">Blockchain Network</Label>
                  <Select value={walletType} onValueChange={setWalletType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="polygon">Polygon (MATIC)</SelectItem>
                      <SelectItem value="bsc">Binance Smart Chain (BNB)</SelectItem>
                      <SelectItem value="solana">Solana (SOL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address..."
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleConnectWallet}
                  className="w-full"
                  disabled={isConnecting || !walletAddress.trim()}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn FermaCoin */}
      <Card>
        <CardHeader>
          <CardTitle>💡 How to Earn FermaCoin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">✨</span>
              <span>Harvest rare crops like Golden Pumpkin (+0.1 FC)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">🎯</span>
              <span>Complete special crypto orders (coming soon)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">🏆</span>
              <span>Finish weekly challenges (coming soon)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}