import React, { useState, useEffect } from 'react'
import { Wallet, Shield, Coins, TrendingUp, Sparkles, Crown, Zap, Star, Gamepad2 } from 'lucide-react'

declare global {
  interface Window {
    ethereum?: any
    solana?: any
    phantom?: any
    trustWallet?: any
  }
}

interface Web3AuthProps {
  onConnect: (address: string, provider: any) => void
  isConnected: boolean
  address: string
}

const Web3Auth: React.FC<Web3AuthProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState({
    metamask: false,
    trustwallet: false,
    coinbase: false,
    phantom: false
  })

  const checkAvailableWallets = () => {
    setAvailableWallets({
      metamask: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
      trustwallet: typeof window.ethereum !== 'undefined' && window.ethereum.isTrust,
      coinbase: typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
      phantom: typeof window.solana !== 'undefined' && window.solana.isPhantom
    })
  }

  useEffect(() => {
    checkAvailableWallets()
  }, [])

  const connectMetaMask = async () => {
    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      if (isMobile) {
        // Try to open MetaMask mobile app with deep link
        const deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
        window.location.href = deepLink
        
        // Fallback to app store after a delay
        setTimeout(() => {
          setError('MetaMask nav instalēts! Instalējiet MetaMask mobile app.')
          window.open('https://metamask.io/download/', '_blank')
        }, 2000)
        return
      } else {
        setError('MetaMask nav instalēts! Lūdzu, instalējiet MetaMask.')
        window.open('https://metamask.io/download/', '_blank')
        return
      }
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        onConnect(accounts[0], provider)
      }
    } catch (err: any) {
      setError(`MetaMask kļūda: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectTrustWallet = async () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!window.ethereum || !window.ethereum.isTrust) {
      if (isMobile) {
        // Try Trust Wallet deep link
        const deepLink = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`
        window.location.href = deepLink
        
        setTimeout(() => {
          setError('Trust Wallet nav instalēts! Instalējiet Trust Wallet mobile app.')
          window.open('https://trustwallet.com/download', '_blank')
        }, 2000)
        return
      } else {
        setError('Trust Wallet nav instalēts! Lūdzu, instalējiet Trust Wallet.')
        window.open('https://trustwallet.com/download', '_blank')
        return
      }
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        onConnect(accounts[0], provider)
      }
    } catch (err: any) {
      setError(`Trust Wallet kļūda: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectCoinbaseWallet = async () => {
    if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
      setError('Coinbase Wallet nav instalēts! Lūdzu, instalējiet Coinbase Wallet.')
      window.open('https://www.coinbase.com/wallet', '_blank')
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        onConnect(accounts[0], provider)
      }
    } catch (err: any) {
      setError(`Coinbase Wallet kļūda: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectPhantom = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      setError('Phantom nav instalēts! Lūdzu, instalējiet Phantom.')
      window.open('https://phantom.app/', '_blank')
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      const response = await window.solana.connect()
      
      if (response.publicKey) {
        const mockProvider = { isPhantom: true, publicKey: response.publicKey }
        onConnect(response.publicKey.toString(), mockProvider)
      }
    } catch (err: any) {
      setError(`Phantom kļūda: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectGenericWallet = async () => {
    if (!window.ethereum) {
      setError('Nav atrasts neviens Web3 makiņš! Lūdzu, instalējiet kādu no atbalstītajiem makiņiem.')
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        onConnect(accounts[0], provider)
      }
    } catch (err: any) {
      setError(`Wallet kļūda: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const walletButtons = [
    {
      name: 'MetaMask',
      icon: '🦊',
      available: availableWallets.metamask,
      onClick: connectMetaMask,
      installUrl: 'https://metamask.io/download/',
      description: 'Populārākais Ethereum makiņš',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'Trust Wallet',
      icon: '🛡️',
      available: availableWallets.trustwallet,
      onClick: connectTrustWallet,
      installUrl: 'https://trustwallet.com/download',
      description: 'Drošs multi-chain makiņš',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔵',
      available: availableWallets.coinbase,
      onClick: connectCoinbaseWallet,
      installUrl: 'https://www.coinbase.com/wallet',
      description: 'Coinbase oficiālais makiņš',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Phantom',
      icon: '👻',
      available: availableWallets.phantom,
      onClick: connectPhantom,
      installUrl: 'https://phantom.app/',
      description: 'Solana ekosistēmas makiņš',
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-bounce delay-500"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-16 left-1/4 text-4xl opacity-30 animate-float">💎</div>
        <div className="absolute top-32 right-1/4 text-3xl opacity-25 animate-float delay-1000">⚡</div>
        <div className="absolute bottom-32 left-1/6 text-4xl opacity-30 animate-float delay-500">🚀</div>
        <div className="absolute bottom-16 right-1/3 text-3xl opacity-25 animate-float delay-1500">🌟</div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-gray-900/20"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* Hero Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 rounded-full shadow-2xl shadow-cyan-500/25 animate-pulse">
                  <Gamepad2 className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 p-2 rounded-full animate-bounce">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-emerald-400 to-teal-500 p-2 rounded-full animate-pulse delay-500">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 drop-shadow-lg animate-gradient">
              FermaX
            </h1>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
              <p className="text-2xl text-gray-300 font-semibold">Play-to-Earn Farming Game</p>
              <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Pieslēdzieties ar savu Web3 makiņu un sāciet nopelnīt īstu kriptovalūtu, 
              audzējot kultūras un attīstot savu fermu!
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                <span className="text-emerald-300 text-sm font-medium flex items-center space-x-2">
                  <span>💰</span>
                  <span>5 FMC Sākuma Bonus</span>
                </span>
              </div>
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-amber-400/30 shadow-lg shadow-amber-500/10">
                <span className="text-amber-300 text-sm font-medium flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Nedēļas Sacensības</span>
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-400/30 shadow-lg shadow-blue-500/10">
                <span className="text-blue-300 text-sm font-medium flex items-center space-x-2">
                  <span>⚡</span>
                  <span>12% APY Staking</span>
                </span>
              </div>
            </div>
          </div>

          {/* Game Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-slate-800/80 to-gray-800/80 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl border border-slate-700/50 hover:scale-105 transition-all duration-300 hover:shadow-emerald-500/20">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Coins className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Audzē & Nopelni</h3>
              <p className="text-gray-300 leading-relaxed">
                Stādiet sēklas, laistiet kultūras un novāciet ražu. 
                Katrs harvest dod Gold Seeds un iespēju nopelnīt FermaCoin!
              </p>
              <div className="mt-4 text-3xl">🌾🥕🌽</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/80 to-gray-800/80 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl border border-slate-700/50 hover:scale-105 transition-all duration-300 hover:shadow-amber-500/20">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">FermaCoin Rewards</h3>
              <p className="text-gray-300 leading-relaxed">
                Legendary Harvest (1:1000), Daily Rewards, Flash Sales, 
                un Weekly Challenges - vairāki veidi, kā nopelnīt īstu crypto!
              </p>
              <div className="mt-4 text-3xl">💎⚡🏆</div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/80 to-gray-800/80 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl border border-slate-700/50 hover:scale-105 transition-all duration-300 hover:shadow-blue-500/20">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Staking & Competition</h3>
              <p className="text-gray-300 leading-relaxed">
                Stake FermaCoin ar 12% APY, sacensieties leaderboard, 
                un paplašiniet fermu ar premium lauciņiem!
              </p>
              <div className="mt-4 text-3xl">📈💰🚀</div>
            </div>
          </div>

          {/* Wallet Connection Card */}
          <div className="bg-gradient-to-br from-slate-800/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-slate-700/50">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                <h2 className="text-3xl font-bold text-white">
                  Izvēlieties savu Web3 makiņu
                </h2>
                <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-gray-400 text-lg">
                Drošs un decentralizēts. Jūsu privātās atslēgas paliek jūsu kontrolē.
              </p>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6 mb-8 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-300 font-medium text-center">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {walletButtons.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={wallet.available ? wallet.onClick : () => window.open(wallet.installUrl, '_blank')}
                  disabled={isConnecting}
                  className={`
                    group relative p-4 md:p-8 rounded-2xl border transition-all duration-300 text-left overflow-hidden
                    ${wallet.available 
                      ? 'border-slate-600 bg-gradient-to-br from-slate-700/50 to-gray-700/50 hover:from-slate-600/50 hover:to-gray-600/50 hover:border-slate-500 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10' 
                      : 'border-slate-700 bg-gradient-to-br from-slate-800/50 to-gray-800/50 hover:from-slate-700/50 hover:to-gray-700/50 hover:scale-102'
                    }
                    ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Gradient Background Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${wallet.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10 flex items-center space-x-3 md:space-x-6">
                    <div className="text-3xl md:text-5xl transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      {wallet.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-gray-100">
                          {wallet.name}
                        </h3>
                        {wallet.available ? (
                          <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs md:text-sm font-medium rounded-full shadow-lg animate-pulse w-fit">
                            ✓ Instalēts
                          </span>
                        ) : (
                          <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-slate-500 to-gray-500 text-white text-xs md:text-sm font-medium rounded-full w-fit">
                            Instalēt
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 group-hover:text-gray-300 leading-relaxed text-sm md:text-base">
                        {wallet.description}
                      </p>
                      {wallet.available && (
                        <div className="mt-2 md:mt-3 text-cyan-400 font-medium text-xs md:text-sm">
                          → Klikšķiniet, lai pieslēgtos
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Generic Wallet Fallback */}
            {!availableWallets.metamask && !availableWallets.trustwallet && 
             !availableWallets.coinbase && !availableWallets.phantom && (
              <div className="border-t border-slate-700 pt-8">
                <button
                  onClick={connectGenericWallet}
                  disabled={isConnecting}
                  className="w-full p-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white rounded-2xl font-bold text-lg hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Pieslēdzas...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Wallet className="w-6 h-6" />
                      <span>Mēģināt pieslēgties ar jebkuru Web3 makiņu</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Mobile Instructions */}
            <div className="mt-8 md:hidden">
              <div className="bg-gradient-to-r from-blue-700/50 to-indigo-700/50 rounded-xl p-4 border border-blue-600/50 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-2xl">📱</span>
                  <span className="text-blue-300 font-semibold">Mobilajām ierīcēm</span>
                </div>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>• Ja jums nav wallet app, tiks atvērts App Store/Play Store</p>
                  <p>• Pēc instalēšanas, atgriezieties šeit un mēģiniet vēlreiz</p>
                  <p>• Wallet app automātiski atvērsies pieslēgšanai</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-slate-700/50 to-gray-700/50 rounded-xl p-4 md:p-6 border border-slate-600/50 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold text-sm md:text-base">100% Drošs</span>
                </div>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                  Jūsu wallet adrese tiks izmantota kā jūsu spēlētāja ID. 
                  Mēs nekad neprasīsim jūsu privātās atslēgas vai seed phrase.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-gray-300 text-lg mb-4">
              🌟 Pievienojieties tūkstošiem fermeru, kas jau pelna FermaCoin! 🌟
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center space-x-1">
                <span>🚀</span>
                <span>Bezmaksas spēle</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>💰</span>
                <span>Īsta crypto</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🏆</span>
                <span>Sacensības</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>⚡</span>
                <span>Tūlītēji sākums</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}

export default Web3Auth