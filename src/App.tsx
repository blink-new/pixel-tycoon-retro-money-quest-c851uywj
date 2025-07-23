import { useState, useEffect, useCallback, useMemo } from 'react'

interface Upgrade {
  id: string
  name: string
  cost: number
  owned: number
  coinsPerSecond: number
  coinsPerClick: number
  description: string
  icon: string
}

interface TaxReduction {
  id: string
  name: string
  cost: number
  reduction: number
  duration: number
  description: string
}

interface StoryEvent {
  id: string
  title: string
  character: string
  message: string
  choices: {
    text: string
    cost?: number
    reward?: number
    effect?: string
  }[]
}

interface BadEvent {
  id: string
  title: string
  message: string
  cost: number
  character: string
}

function App() {
  const [coins, setCoins] = useState(0)
  const [coinsPerSecond, setCoinsPerSecond] = useState(0)
  const [coinsPerClick, setCoinsPerClick] = useState(1)
  const [experience, setExperience] = useState(0)
  const [level, setLevel] = useState(1)
  const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, x: number, y: number}[]>([])
  const [showStoryEvent, setShowStoryEvent] = useState(false)
  const [currentStoryEvent, setCurrentStoryEvent] = useState<StoryEvent | null>(null)
  const [completedEvents, setCompletedEvents] = useState<string[]>([])
  
  // New states for advanced features
  const [loanAmount, setLoanAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(35)
  const [activeTaxReductions, setActiveTaxReductions] = useState<{id: string, endTime: number, reduction: number}[]>([])
  const [showBadEvent, setShowBadEvent] = useState(false)
  const [currentBadEvent, setCurrentBadEvent] = useState<BadEvent | null>(null)
  const [lastTaxTime, setLastTaxTime] = useState(Date.now())

  const upgrades: Upgrade[] = [
    {
      id: 'pickaxe',
      name: 'Rusty Pickaxe',
      cost: 15,
      owned: 0,
      coinsPerSecond: 0,
      coinsPerClick: 1,
      description: 'An old mining tool. +1 coin per click',
      icon: '⛏️'
    },
    {
      id: 'boots',
      name: 'Work Boots',
      cost: 100,
      owned: 0,
      coinsPerSecond: 1,
      coinsPerClick: 0,
      description: 'Sturdy boots for hard work. +1 coin/sec',
      icon: '🥾'
    },
    {
      id: 'coffee',
      name: 'Coffee Thermos',
      cost: 500,
      owned: 0,
      coinsPerSecond: 0,
      coinsPerClick: 5,
      description: 'Keeps you energized! +5 coins per click',
      icon: '☕'
    },
    {
      id: 'hat',
      name: 'Lucky Cowboy Hat',
      cost: 2000,
      owned: 0,
      coinsPerSecond: 10,
      coinsPerClick: 0,
      description: 'Brings good fortune. +10 coins/sec',
      icon: '🤠'
    },
    {
      id: 'shovel',
      name: 'Steel Shovel',
      cost: 5000,
      owned: 0,
      coinsPerSecond: 0,
      coinsPerClick: 15,
      description: 'Heavy duty digging tool. +15 coins per click',
      icon: '🪣'
    },
    {
      id: 'cart',
      name: 'Mining Cart',
      cost: 12000,
      owned: 0,
      coinsPerSecond: 25,
      coinsPerClick: 0,
      description: 'Hauls materials automatically. +25 coins/sec',
      icon: '🛒'
    },
    {
      id: 'drill',
      name: 'Power Drill',
      cost: 25000,
      owned: 0,
      coinsPerSecond: 0,
      coinsPerClick: 50,
      description: 'Modern drilling equipment. +50 coins per click',
      icon: '🔧'
    },
    {
      id: 'truck',
      name: 'Pickup Truck',
      cost: 50000,
      owned: 0,
      coinsPerSecond: 75,
      coinsPerClick: 0,
      description: 'Transport goods efficiently. +75 coins/sec',
      icon: '🚚'
    },
    {
      id: 'factory',
      name: 'Small Factory',
      cost: 150000,
      owned: 0,
      coinsPerSecond: 200,
      coinsPerClick: 0,
      description: 'Automated production facility. +200 coins/sec',
      icon: '🏭'
    },
    {
      id: 'robot',
      name: 'Work Robot',
      cost: 500000,
      owned: 0,
      coinsPerSecond: 0,
      coinsPerClick: 500,
      description: 'AI-powered assistant. +500 coins per click',
      icon: '🤖'
    },
    {
      id: 'satellite',
      name: 'Gold Satellite',
      cost: 2000000,
      owned: 0,
      coinsPerSecond: 1000,
      coinsPerClick: 0,
      description: 'Space-age mining technology. +1000 coins/sec',
      icon: '🛰️'
    }
  ]

  const taxReductions: TaxReduction[] = [
    {
      id: 'lawyer1',
      name: 'Cheap Lawyer',
      cost: 1000,
      reduction: 5,
      duration: 30,
      description: 'Reduces tax by 5% for 30 seconds'
    },
    {
      id: 'lawyer2',
      name: 'Good Lawyer',
      cost: 5000,
      reduction: 10,
      duration: 30,
      description: 'Reduces tax by 10% for 30 seconds'
    },
    {
      id: 'lawyer3',
      name: 'Expert Lawyer',
      cost: 15000,
      reduction: 15,
      duration: 30,
      description: 'Reduces tax by 15% for 30 seconds'
    },
    {
      id: 'lawyer4',
      name: 'Elite Lawyer',
      cost: 50000,
      reduction: 20,
      duration: 30,
      description: 'Reduces tax by 20% for 30 seconds'
    },
    {
      id: 'lawyer5',
      name: 'Supreme Lawyer',
      cost: 200000,
      reduction: 25,
      duration: 30,
      description: 'Reduces tax by 25% for 30 seconds'
    }
  ]

  const [ownedUpgrades, setOwnedUpgrades] = useState<{[key: string]: number}>({
    pickaxe: 0,
    boots: 0,
    coffee: 0,
    hat: 0,
    shovel: 0,
    cart: 0,
    drill: 0,
    truck: 0,
    factory: 0,
    robot: 0,
    satellite: 0
  })

  const badEvents: BadEvent[] = useMemo(() => [
    {
      id: 'robber',
      title: 'Desert Bandit!',
      message: 'A masked bandit appears and steals some of your hard-earned coins!',
      cost: Math.floor(coins * 0.15), // 15% of current coins
      character: '🦹‍♂️'
    },
    {
      id: 'accident',
      title: 'Work Accident!',
      message: 'You fell while working and need medical attention. Hospital bills are expensive!',
      cost: Math.floor(Math.random() * 500) + 200, // 200-700 coins
      character: '🏥'
    },
    {
      id: 'thief',
      title: 'Pickpocket!',
      message: 'A sneaky thief bumped into you and stole coins from your pocket!',
      cost: Math.floor(Math.random() * 300) + 100, // 100-400 coins
      character: '🥷'
    },
    {
      id: 'storm',
      title: 'Desert Storm!',
      message: 'A sandstorm damaged your equipment and you need repairs!',
      cost: Math.floor(Math.random() * 800) + 300, // 300-1100 coins
      character: '🌪️'
    }
  ], [coins])

  const storyEvents: StoryEvent[] = useMemo(() => [
    {
      id: 'pete_encounter',
      title: 'Old Prospector Pete',
      character: '🤠',
      message: 'Howdy there, young fella! I see you working hard in this desert heat. I got some advice for ya...',
      choices: [
        { text: 'Listen to his advice', reward: 50, effect: 'Pete gives you 50 coins!' },
        { text: 'Politely decline', reward: 10, effect: 'Pete respects your independence. +10 coins.' }
      ]
    },
    {
      id: 'investment_opportunity',
      title: 'Mysterious Trader',
      character: '🎩',
      message: 'I have a business proposition. Invest 200 coins now, and I\'ll double it in a few minutes...',
      choices: [
        { text: 'Invest 200 coins', cost: 200, reward: 400, effect: 'Risky investment pays off! +400 coins!' },
        { text: 'Keep your money', effect: 'Sometimes the safe choice is the smart choice.' }
      ]
    },
    {
      id: 'bank_offer',
      title: 'Bank Manager',
      character: '🏦',
      message: 'We notice you\'re doing well! Would you like to take out a loan to expand your operations?',
      choices: [
        { text: 'Take 1000 coin loan', reward: 1000, effect: 'Loan approved! Remember to pay interest!' },
        { text: 'No thanks', effect: 'Staying debt-free is wise too.' }
      ]
    }
  ], [])

  const addFloatingText = useCallback((text: string, x: number, y: number) => {
    const id = Date.now() + Math.random()
    setFloatingTexts(prev => [...prev, { id, text, x, y }])
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id))
    }, 2000)
  }, [])

  const triggerStoryEvent = useCallback((eventId: string) => {
    const event = storyEvents.find(e => e.id === eventId)
    if (event) {
      setCurrentStoryEvent(event)
      setShowStoryEvent(true)
    }
  }, [storyEvents])

  const triggerBadEvent = useCallback(() => {
    if (coins > 50) { // Only trigger if player has some coins
      const event = badEvents[Math.floor(Math.random() * badEvents.length)]
      const actualCost = Math.min(event.cost, coins) // Don't take more than they have
      setCurrentBadEvent({...event, cost: actualCost})
      setShowBadEvent(true)
    }
  }, [badEvents, coins])

  // Calculate current tax rate with reductions
  const getCurrentTaxRate = useCallback(() => {
    const now = Date.now()
    const activeReductions = activeTaxReductions.filter(reduction => now < reduction.endTime)
    const totalReduction = activeReductions.reduce((sum, reduction) => sum + reduction.reduction, 0)
    return Math.max(0, taxRate - totalReduction)
  }, [taxRate, activeTaxReductions])

  // Loan interest effect (0.004% per second)
  useEffect(() => {
    if (loanAmount > 0) {
      const interval = setInterval(() => {
        const interest = loanAmount * 0.00004 // 0.004% per second
        setLoanAmount(prev => prev + interest)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [loanAmount])

  // Passive income effect
  useEffect(() => {
    if (coinsPerSecond > 0) {
      const interval = setInterval(() => {
        setCoins(prev => prev + coinsPerSecond)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [coinsPerSecond])

  // Tax collection every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastTaxTime >= 10000 && coins > 0) { // 10 seconds
        const currentTaxRate = getCurrentTaxRate()
        const taxAmount = Math.floor(coins * (currentTaxRate / 100))
        if (taxAmount > 0) {
          setCoins(prev => Math.max(0, prev - taxAmount))
          addFloatingText(`-${taxAmount} TAX (${currentTaxRate}%)`, 400, 100)
        }
        setLastTaxTime(now)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [coins, getCurrentTaxRate, lastTaxTime, addFloatingText])

  // Random bad events
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.005 && coins > 100) { // 0.5% chance per second, only if player has coins
        triggerBadEvent()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [triggerBadEvent, coins])

  // Clean up expired tax reductions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setActiveTaxReductions(prev => prev.filter(reduction => now < reduction.endTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Story event triggers
  useEffect(() => {
    if (coins >= 100 && !completedEvents.includes('pete_encounter')) {
      triggerStoryEvent('pete_encounter')
    }
    if (coins >= 500 && !completedEvents.includes('investment_opportunity')) {
      triggerStoryEvent('investment_opportunity')
    }
    if (coins >= 2000 && !completedEvents.includes('bank_offer')) {
      triggerStoryEvent('bank_offer')
    }
  }, [coins, completedEvents, triggerStoryEvent])

  // Level up system
  useEffect(() => {
    const newLevel = Math.floor(experience / 100) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      addFloatingText(`LEVEL UP! Level ${newLevel}`, 400, 200)
    }
  }, [experience, level, addFloatingText])

  const handleStoryChoice = (choice: any) => {
    if (choice.cost && coins >= choice.cost) {
      setCoins(prev => prev - choice.cost)
    }
    if (choice.reward) {
      setCoins(prev => prev + choice.reward)
      // Special handling for loan
      if (currentStoryEvent?.id === 'bank_offer' && choice.reward === 1000) {
        setLoanAmount(prev => prev + 1000)
      }
    }
    
    if (currentStoryEvent) {
      setCompletedEvents(prev => [...prev, currentStoryEvent.id])
      addFloatingText(choice.effect || 'Choice made!', 400, 300)
    }
    
    setShowStoryEvent(false)
    setCurrentStoryEvent(null)
  }

  const handleBadEvent = () => {
    if (currentBadEvent) {
      setCoins(prev => Math.max(0, prev - currentBadEvent.cost))
      addFloatingText(`-${currentBadEvent.cost} coins`, 400, 300)
    }
    setShowBadEvent(false)
    setCurrentBadEvent(null)
  }

  const handleWork = () => {
    const earnedCoins = coinsPerClick
    setCoins(prev => prev + earnedCoins)
    setExperience(prev => prev + 1)
    addFloatingText(`+${earnedCoins}`, 400 + Math.random() * 100 - 50, 350 + Math.random() * 50 - 25)
  }

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId)
    if (!upgrade) return

    const currentOwned = ownedUpgrades[upgradeId]
    const cost = Math.floor(upgrade.cost * Math.pow(1.15, currentOwned))

    if (coins >= cost) {
      setCoins(prev => prev - cost)
      setOwnedUpgrades(prev => ({
        ...prev,
        [upgradeId]: prev[upgradeId] + 1
      }))

      // Update passive income and click power
      if (upgrade.coinsPerSecond > 0) {
        setCoinsPerSecond(prev => prev + upgrade.coinsPerSecond)
      }
      if (upgrade.coinsPerClick > 0) {
        setCoinsPerClick(prev => prev + upgrade.coinsPerClick)
      }

      addFloatingText(`Bought ${upgrade.name}!`, 200, 400)
    }
  }

  const buyTaxReduction = (reductionId: string) => {
    const reduction = taxReductions.find(r => r.id === reductionId)
    if (!reduction || coins < reduction.cost) return

    setCoins(prev => prev - reduction.cost)
    const endTime = Date.now() + (reduction.duration * 1000)
    setActiveTaxReductions(prev => [...prev, {
      id: reductionId,
      endTime,
      reduction: reduction.reduction
    }])
    addFloatingText(`Tax reduced by ${reduction.reduction}%!`, 400, 150)
  }

  const payOffLoan = () => {
    if (coins >= loanAmount && loanAmount > 0) {
      setCoins(prev => prev - loanAmount)
      addFloatingText(`Loan paid off! -${Math.floor(loanAmount)}`, 400, 200)
      setLoanAmount(0)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return Math.floor(num).toString()
  }

  return (
    <div className="min-h-screen bg-desert-dark font-pixel text-desert-light overflow-hidden relative">
      {/* Floating texts */}
      {floatingTexts.map(ft => (
        <div
          key={ft.id}
          className="absolute text-accent font-bold animate-bounce pointer-events-none z-50"
          style={{
            left: ft.x,
            top: ft.y,
            animation: 'float 2s ease-out forwards'
          }}
        >
          {ft.text}
        </div>
      ))}

      {/* Story Event Modal */}
      {showStoryEvent && currentStoryEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-desert-brown border-4 border-accent p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{currentStoryEvent.character}</div>
              <h3 className="text-accent text-lg mb-2">{currentStoryEvent.title}</h3>
              <p className="text-sm leading-relaxed">{currentStoryEvent.message}</p>
            </div>
            <div className="space-y-2">
              {currentStoryEvent.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleStoryChoice(choice)}
                  disabled={choice.cost ? coins < choice.cost : false}
                  className="w-full bg-desert-brown border-2 border-accent hover:bg-accent hover:text-desert-dark p-2 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {choice.text}
                  {choice.cost && ` (-${choice.cost} coins)`}
                  {choice.reward && ` (+${choice.reward} coins)`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bad Event Modal */}
      {showBadEvent && currentBadEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-red-900 border-4 border-red-500 p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{currentBadEvent.character}</div>
              <h3 className="text-red-300 text-lg mb-2">{currentBadEvent.title}</h3>
              <p className="text-sm leading-relaxed text-red-100">{currentBadEvent.message}</p>
              <p className="text-red-300 font-bold mt-2">Cost: {currentBadEvent.cost} coins</p>
            </div>
            <button
              onClick={handleBadEvent}
              className="w-full bg-red-700 border-2 border-red-300 hover:bg-red-600 p-2 text-sm transition-colors text-red-100"
            >
              Accept the loss
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header with Tax Rate */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl text-accent mb-2">PIXEL TYCOON</h1>
          <p className="text-xs md:text-sm">Retro Money Quest</p>
          <div className="mt-2 text-red-300">
            Tax Rate: {getCurrentTaxRate()}% (every 10 sec)
            {activeTaxReductions.length > 0 && (
              <span className="text-green-300 ml-2">
                ({activeTaxReductions.length} reduction{activeTaxReductions.length > 1 ? 's' : ''} active)
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-desert-brown border-2 border-accent p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-accent text-lg">{formatNumber(coins)}</div>
              <div className="text-xs">COINS</div>
            </div>
            <div>
              <div className="text-accent text-lg">{formatNumber(coinsPerSecond)}/sec</div>
              <div className="text-xs">PASSIVE</div>
            </div>
            <div>
              <div className="text-accent text-lg">Level {level}</div>
              <div className="text-xs">EXPERIENCE</div>
            </div>
            <div>
              <div className="text-accent text-lg">{formatNumber(coinsPerClick)}</div>
              <div className="text-xs">PER CLICK</div>
            </div>
            <div>
              <div className={`text-lg ${loanAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {loanAmount > 0 ? `-${formatNumber(loanAmount)}` : 'No Debt'}
              </div>
              <div className="text-xs">LOAN</div>
            </div>
          </div>
          
          {/* Experience Bar */}
          <div className="mt-4">
            <div className="bg-desert-dark border border-accent h-4 relative">
              <div 
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${(experience % 100)}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs">
                {experience % 100}/100 XP
              </div>
            </div>
          </div>

          {/* Loan Payoff Button */}
          {loanAmount > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={payOffLoan}
                disabled={coins < loanAmount}
                className="bg-green-700 border-2 border-green-400 px-4 py-2 text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay Off Loan ({formatNumber(loanAmount)} coins)
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="bg-desert-brown border-2 border-accent p-6">
            <div className="text-center">
              <h2 className="text-accent text-xl mb-4">WORK AREA</h2>
              <div className="mb-6">
                <div className="text-6xl mb-4">⛏️</div>
                <p className="text-xs mb-4">Click to work and earn coins!</p>
              </div>
              
              <button
                onClick={handleWork}
                className="bg-accent text-desert-dark px-8 py-4 text-lg font-bold hover:bg-yellow-400 transition-colors border-2 border-desert-dark hover:scale-105 transform"
              >
                WORK (+{formatNumber(coinsPerClick)})
              </button>
              
              <div className="mt-4 text-xs">
                <p>A humble worker in the Texas-Arizona desert</p>
                <p>Every click brings you closer to wealth!</p>
              </div>
            </div>
          </div>

          {/* Upgrade Shop */}
          <div className="bg-desert-brown border-2 border-accent p-6">
            <h2 className="text-accent text-xl mb-4 text-center">UPGRADE SHOP</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upgrades.map(upgrade => {
                const owned = ownedUpgrades[upgrade.id]
                const cost = Math.floor(upgrade.cost * Math.pow(1.15, owned))
                const canAfford = coins >= cost
                
                return (
                  <div key={upgrade.id} className="border border-accent p-2">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{upgrade.icon}</span>
                        <div>
                          <div className="text-accent font-bold text-xs">{upgrade.name}</div>
                          <div className="text-xs">Owned: {owned}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className="bg-desert-dark border border-accent px-2 py-1 text-xs hover:bg-accent hover:text-desert-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formatNumber(cost)}
                      </button>
                    </div>
                    <div className="text-xs text-gray-300">{upgrade.description}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tax Reduction Shop */}
          <div className="bg-desert-brown border-2 border-accent p-6">
            <h2 className="text-accent text-xl mb-4 text-center">TAX LAWYERS</h2>
            <div className="space-y-2">
              {taxReductions.map(reduction => {
                const canAfford = coins >= reduction.cost
                
                return (
                  <div key={reduction.id} className="border border-accent p-2">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-accent font-bold text-xs">{reduction.name}</div>
                        <div className="text-xs">-{reduction.reduction}% tax</div>
                      </div>
                      <button
                        onClick={() => buyTaxReduction(reduction.id)}
                        disabled={!canAfford}
                        className="bg-desert-dark border border-accent px-2 py-1 text-xs hover:bg-accent hover:text-desert-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formatNumber(reduction.cost)}
                      </button>
                    </div>
                    <div className="text-xs text-gray-300">{reduction.description}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs">
          <p>🌵 Welcome to the desert, partner! Work hard, avoid taxes, and watch out for bandits! 🌵</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default App