import { useState, useEffect } from 'react'
import CostCalculator from './components/CostCalculator'
import PurchaseManager from './components/PurchaseManager'

const TABS = [
  { id: 'calculator', label: '成本計算機', icon: '🧮' },
  { id: 'purchases', label: '採購管理', icon: '📦' },
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
      // localStorage full — silently ignore
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            <h1 className="text-base font-bold text-gray-900 whitespace-nowrap">採購管理系統</h1>
            <nav className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
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
      </main>
    </div>
  )
}
