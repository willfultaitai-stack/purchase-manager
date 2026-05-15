import { useState, useEffect } from 'react'
import CostCalculator from './components/CostCalculator'
import PurchaseManager from './components/PurchaseManager'
import ReceiptManager from './components/ReceiptManager'

const TABS = [
  {
    id: 'calculator',
    label: '成本計算機',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    id: 'purchases',
    label: '採購管理',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'receipts',
    label: '點貨管理',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

function loadSavedItems() {
  try {
    const raw = localStorage.getItem('comparison_items')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

let nextItemId = (loadSavedItems().reduce((max, i) => Math.max(max, i.id ?? 0), 0)) + 1

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator')
  const [prefilledOrder, setPrefilledOrder] = useState(null)
  const [savedItems, setSavedItems] = useState(loadSavedItems)

  useEffect(() => {
    try {
      localStorage.setItem('comparison_items', JSON.stringify(savedItems))
    } catch {
      // localStorage full
    }
  }, [savedItems])

  const handleOrder = (orderInfo) => {
    setPrefilledOrder(orderInfo)
    setActiveTab('purchases')
  }

  const handleAddItem = (item) => {
    setSavedItems(prev => [{ ...item, id: nextItemId++ }, ...prev])
  }

  const handleRemoveItem = (id) => {
    setSavedItems(prev => prev.filter(i => i.id !== id))
  }

  const handleUpdateItem = (id, fields) => {
    setSavedItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i))
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center h-14 gap-8">
            <span className="text-base font-bold text-charcoal tracking-tight whitespace-nowrap">
              採購管理系統
            </span>
            <nav className="flex items-center h-full gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-colors duration-150 ${
                    activeTab === tab.id
                      ? 'text-brand'
                      : 'text-gray-500 hover:text-charcoal'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-cream/60"><div className="max-w-5xl mx-auto px-5 h-7 flex items-center"><span className="text-xs text-warm-gray">採購管理系統</span></div></div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6">
        {activeTab === 'calculator' && (
          <CostCalculator
            onOrder={handleOrder}
            savedItems={savedItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
          />
        )}
        {activeTab === 'purchases' && (
          <PurchaseManager
            prefilledOrder={prefilledOrder}
            onPrefilledConsumed={() => setPrefilledOrder(null)}
          />
        )}
        {activeTab === 'receipts' && <ReceiptManager />}
      </main>
    </div>
  )
}
