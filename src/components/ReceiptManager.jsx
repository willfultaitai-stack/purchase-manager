import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const STATUS_FILTERS = ['全部', '待訂貨', '已訂購', '已出貨']

const COUNTRY_COLOR = {
  '台灣': 'text-yellow-600',
  '韓國': 'text-blue-400',
  '日本': 'text-green-600',
}

const STATUS_STYLE = {
  '待訂貨': 'bg-blue-50 text-blue-400',
  '已訂購': 'bg-yellow-50 text-yellow-600',
  '已出貨': 'bg-green-50 text-green-500',
}

const BATCH_LABEL = ['第1批', '第2批', '第3批', '第4批', '第5批']

export default function ReceiptManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('已訂購')
  const [collapsed, setCollapsed] = useState({})
  const [newBatch, setNewBatch] = useState({})
  const [saving, setSaving] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    setError('')
    try {
      let q = supabase
        .from('purchase_orders')
        .select('*, purchase_items(*, item_receipts(*))')
        .order('order_date', { ascending: false })
      if (filterStatus !== '全部') q = q.eq('status', filterStatus)
      const { data, error: err } = await q
      if (err) throw err
      setOrders(data || [])
    } catch (err) {
      setError(`載入失敗：${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddBatch = async (item) => {
    const qty = parseInt(newBatch[item.id])
    if (!qty || qty <= 0) return
    setSaving(item.id)
    try {
      const { error: err } = await supabase.from('item_receipts').insert({
        item_id: item.id,
        received_quantity: qty,
        received_date: new Date().toISOString().split('T')[0],
      })
      if (err) throw err
      setNewBatch(p => ({ ...p, [item.id]: '' }))
      await fetchData()
    } catch (err) {
      setError(`儲存失敗：${err.message}`)
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteReceipt = async (receiptId) => {
    try {
      const { error: err } = await supabase.from('item_receipts').delete().eq('id', receiptId)
      if (err) throw err
      await fetchData()
    } catch (err) {
      setError(`刪除失敗：${err.message}`)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <p className="text-sm text-yellow-700">請先設定 Supabase 才能使用點貨管理功能。</p>
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
                filterStatus === s ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          className="ml-auto text-xs text-gray-500 hover:text-green-500 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors"
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

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          {filterStatus !== '全部' ? `沒有「${filterStatus}」狀態的訂單` : '尚無訂單資料'}
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const items = order.purchase_items || []
          const totalOrdered = items.reduce((s, i) => s + i.quantity, 0)
          const totalReceived = items.reduce((s, i) =>
            s + (i.item_receipts || []).reduce((r, rec) => r + rec.received_quantity, 0), 0)
          const isCollapsed = collapsed[order.id] ?? false

          return (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Order header */}
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                onClick={() => setCollapsed(p => ({ ...p, [order.id]: !p[order.id] }))}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-bold ${COUNTRY_COLOR[order.country] || 'text-gray-600'}`}>
                    {order.country}
                  </span>
                  <span className="font-semibold text-gray-900">{order.brand_name}</span>
                  <span className="text-xs text-gray-400">{order.order_date}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-500'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    共收 <span className="font-bold text-gray-800">{totalReceived}</span>
                    <span className="text-gray-400"> / {totalOrdered} 件</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Items table */}
              {!isCollapsed && (
                <div className="border-t border-gray-100">
                  {items.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">此訂單沒有商品明細</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                            <th className="w-10 px-4 py-2"></th>
                            <th className="text-left px-3 py-2 font-medium">品名</th>
                            <th className="text-left px-3 py-2 font-medium">顏色規格</th>
                            <th className="text-center px-3 py-2 font-medium">訂購</th>
                            <th className="text-center px-3 py-2 font-medium">已收</th>
                            <th className="text-center px-3 py-2 font-medium">未到</th>
                            <th className="text-left px-4 py-2 font-medium">到貨批次</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => {
                            const receipts = [...(item.item_receipts || [])].sort(
                              (a, b) => new Date(a.created_at) - new Date(b.created_at)
                            )
                            const totalRecv = receipts.reduce((s, r) => s + r.received_quantity, 0)
                            const remaining = Math.max(0, item.quantity - totalRecv)
                            const complete = totalRecv >= item.quantity

                            return (
                              <tr
                                key={item.id}
                                className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${complete ? 'opacity-50' : ''}`}
                              >
                                {/* Photo */}
                                <td className="px-4 py-2.5">
                                  {item.photo_url ? (
                                    <img
                                      src={item.photo_url}
                                      alt=""
                                      className="w-9 h-9 object-cover rounded-lg border border-gray-200"
                                      onError={e => { e.target.style.display = 'none' }}
                                    />
                                  ) : (
                                    <div className="w-9 h-9 bg-gray-100 rounded-lg border border-gray-200" />
                                  )}
                                </td>

                                {/* Name */}
                                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                                  {item.item_name}
                                </td>

                                {/* Color */}
                                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                                  {item.color || '—'}
                                </td>

                                {/* Ordered */}
                                <td className="px-3 py-2.5 text-center text-gray-600">
                                  {item.quantity}
                                </td>

                                {/* Received */}
                                <td className="px-3 py-2.5 text-center font-semibold text-gray-800">
                                  {totalRecv}
                                </td>

                                {/* Remaining */}
                                <td className="px-3 py-2.5 text-center font-semibold">
                                  {complete
                                    ? <span className="text-green-500 text-xs">✓ 全到</span>
                                    : <span className="text-red-400">{remaining}</span>
                                  }
                                </td>

                                {/* Batches */}
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {receipts.map((r, idx) => (
                                      <div key={r.id} className="flex items-center gap-1 group">
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                          {BATCH_LABEL[idx] ?? `第${idx + 1}批`}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 rounded px-2 py-0.5">
                                          {r.received_quantity}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteReceipt(r.id)}
                                          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                          title="刪除此批次"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}

                                    {/* New batch input */}
                                    {!complete && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                          {BATCH_LABEL[receipts.length] ?? `第${receipts.length + 1}批`}
                                        </span>
                                        <input
                                          type="number"
                                          min="1"
                                          max={remaining}
                                          value={newBatch[item.id] || ''}
                                          onChange={e => setNewBatch(p => ({ ...p, [item.id]: e.target.value }))}
                                          onKeyDown={e => e.key === 'Enter' && handleAddBatch(item)}
                                          placeholder="數量"
                                          className="w-16 text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-400 text-center"
                                        />
                                        {newBatch[item.id] && (
                                          <button
                                            onClick={() => handleAddBatch(item)}
                                            disabled={saving === item.id}
                                            className="text-xs text-white bg-green-500 hover:bg-green-500 px-2 py-0.5 rounded font-medium disabled:opacity-50 transition-colors"
                                          >
                                            {saving === item.id ? '…' : '儲存'}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
