import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

function formatDate(d) {
  return d ? d.replace(/-/g, '/') : ''
}

function ProgressBar({ received, ordered }) {
  const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0
  const complete = received >= ordered
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${complete ? 'bg-green-500' : 'bg-indigo-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold whitespace-nowrap ${complete ? 'text-green-600' : 'text-indigo-600'}`}>
        {received} / {ordered}
      </span>
    </div>
  )
}

const COUNTRY_BADGE = {
  '台灣': 'bg-blue-100 text-blue-700',
  '韓國': 'bg-pink-100 text-pink-700',
  '日本': 'bg-red-100 text-red-700',
}

const STATUS_FILTERS = ['全部', '待訂貨', '已訂購', '已出貨']

export default function ReceiptManager() {
  const [items, setItems] = useState([])
  const [receipts, setReceipts] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('已訂購')
  const [filterBrand, setFilterBrand] = useState('全部')
  const [addingFor, setAddingFor] = useState(null)
  const [form, setForm] = useState({ quantity: '', date: today(), note: '' })
  const [saving, setSaving] = useState(false)

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    setError('')
    try {
      const [{ data: itemsData, error: itemsErr }, { data: receiptsData, error: receiptsErr }] = await Promise.all([
        supabase
          .from('purchase_items')
          .select('*, purchase_orders(id, brand_name, country, status, order_date)')
          .order('created_at', { ascending: false }),
        supabase
          .from('item_receipts')
          .select('*')
          .order('received_date', { ascending: true }),
      ])
      if (itemsErr) throw itemsErr
      if (receiptsErr) throw receiptsErr

      const map = {}
      receiptsData.forEach(r => {
        if (!map[r.item_id]) map[r.item_id] = []
        map[r.item_id].push(r)
      })
      setItems(itemsData || [])
      setReceipts(map)
    } catch (err) {
      setError(`載入失敗：${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleOpenForm = (itemId, remaining) => {
    setAddingFor(itemId)
    setForm({ quantity: remaining > 0 ? String(remaining) : '', date: today(), note: '' })
  }

  const handleAddReceipt = async (itemId) => {
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0) return
    setSaving(true)
    try {
      const { error: err } = await supabase.from('item_receipts').insert({
        item_id: itemId,
        received_quantity: qty,
        received_date: form.date,
        note: form.note || null,
      })
      if (err) throw err
      setAddingFor(null)
      await fetchData()
    } catch (err) {
      setError(`儲存失敗：${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReceipt = async (receiptId, itemId) => {
    try {
      const { error: err } = await supabase.from('item_receipts').delete().eq('id', receiptId)
      if (err) throw err
      setReceipts(prev => ({ ...prev, [itemId]: prev[itemId].filter(r => r.id !== receiptId) }))
    } catch (err) {
      setError(`刪除失敗：${err.message}`)
    }
  }

  const brands = ['全部', ...new Set(items.map(i => i.purchase_orders?.brand_name).filter(Boolean))]

  const filteredItems = items.filter(item => {
    const order = item.purchase_orders
    if (filterStatus !== '全部' && order?.status !== filterStatus) return false
    if (filterBrand !== '全部' && order?.brand_name !== filterBrand) return false
    return true
  })

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-sm text-amber-700">請先設定 Supabase 才能使用點貨管理功能。</p>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                filterStatus === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {brands.length > 2 && (
          <select
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white shadow-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {brands.map(b => <option key={b} value={b}>{b === '全部' ? '全部品牌' : b}</option>)}
          </select>
        )}

        <button
          onClick={fetchData}
          className="ml-auto text-xs text-gray-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors"
        >
          重新整理
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          載入中...
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          {filterStatus !== '全部' ? `沒有「${filterStatus}」狀態的商品` : '尚無商品資料'}
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map(item => {
          const order = item.purchase_orders
          const itemReceipts = receipts[item.id] || []
          const totalReceived = itemReceipts.reduce((sum, r) => sum + r.received_quantity, 0)
          const remaining = Math.max(0, item.quantity - totalReceived)
          const complete = totalReceived >= item.quantity
          const isAdding = addingFor === item.id

          return (
            <div
              key={item.id}
              className={`card overflow-hidden border-l-4 ${complete ? 'border-l-green-400' : remaining === item.quantity ? 'border-l-gray-300' : 'border-l-indigo-400'}`}
            >
              <div className="p-4">
                {/* Main row */}
                <div className="flex items-start gap-3">
                  {/* Photo */}
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.item_name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${COUNTRY_BADGE[order?.country] || 'bg-gray-100 text-gray-600'}`}>
                        {order?.country}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{order?.brand_name}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{formatDate(order?.order_date)}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{item.item_name}</p>
                    {item.color && <p className="text-xs text-gray-400 mt-0.5">{item.color}</p>}
                  </div>

                  {/* Stats + action */}
                  <div className="flex-shrink-0 text-right space-y-1.5">
                    <div className="flex items-center justify-end gap-3 text-sm">
                      <span className="text-gray-400 text-xs">訂 <span className="font-semibold text-gray-600">{item.quantity}</span></span>
                      <span className="text-indigo-600 text-xs font-semibold">收 {totalReceived}</span>
                      {remaining > 0 && (
                        <span className="text-red-400 text-xs font-semibold">未到 {remaining}</span>
                      )}
                      {complete && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">全到貨</span>
                      )}
                    </div>
                    {!complete && (
                      <button
                        onClick={() => isAdding ? setAddingFor(null) : handleOpenForm(item.id, remaining)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          isAdding
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {isAdding ? '取消' : '記錄到貨'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar received={totalReceived} ordered={item.quantity} />

                {/* Add receipt form */}
                {isAdding && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">本次到貨數量</label>
                      <input
                        type="number"
                        min="1"
                        max={remaining}
                        value={form.quantity}
                        onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                        placeholder="數量"
                        className="input-field text-sm py-1.5 w-24"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">到貨日期</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        className="input-field text-sm py-1.5"
                      />
                    </div>
                    <div className="flex-1" style={{ minWidth: '8rem' }}>
                      <label className="text-xs text-gray-500 block mb-1">備註（選填）</label>
                      <input
                        type="text"
                        value={form.note}
                        onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                        placeholder="例如：第一批"
                        className="input-field text-sm py-1.5 w-full"
                        onKeyDown={e => e.key === 'Enter' && handleAddReceipt(item.id)}
                      />
                    </div>
                    <button
                      onClick={() => handleAddReceipt(item.id)}
                      disabled={saving || !form.quantity || parseInt(form.quantity) <= 0}
                      className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
                    >
                      {saving ? '儲存中...' : '確認'}
                    </button>
                  </div>
                )}

                {/* Receipt history */}
                {itemReceipts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-medium mb-1.5">到貨記錄</p>
                    <div className="space-y-1">
                      {itemReceipts.map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 w-20 flex-shrink-0">{formatDate(r.received_date)}</span>
                          <span className="font-semibold text-indigo-700 w-12 flex-shrink-0">+{r.received_quantity} 件</span>
                          <span className="text-gray-400 flex-1 truncate">{r.note || ''}</span>
                          <button
                            onClick={() => handleDeleteReceipt(r.id, item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
