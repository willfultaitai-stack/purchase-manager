import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import OrderCard from './OrderCard'
import OrderModal from './OrderModal'

const COUNTRY_FILTERS = ['全部', '台灣', '韓國', '日本']
const STATUS_FILTERS = ['全部', '待訂貨', '已訂購', '已出貨']

function SetupBanner() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">尚未設定 Supabase</h3>
          <p className="text-sm text-yellow-700 mb-3">
            採購管理功能需要連接 Supabase 資料庫才能使用。請依照以下步驟設定：
          </p>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>在 <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-medium">supabase.com</a> 建立免費專案</li>
            <li>執行 <code className="bg-yellow-100 px-1 rounded font-mono text-xs">supabase/schema.sql</code> 以建立資料表</li>
            <li>在 Storage 建立名為 <code className="bg-yellow-100 px-1 rounded font-mono text-xs">product-photos</code> 的公開 Bucket</li>
            <li>複製 <code className="bg-yellow-100 px-1 rounded font-mono text-xs">.env.example</code> 為 <code className="bg-yellow-100 px-1 rounded font-mono text-xs">.env</code> 並填入您的 URL 與 anon key</li>
            <li>重新啟動開發伺服器 (<code className="bg-yellow-100 px-1 rounded font-mono text-xs">npm run dev</code>)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseManager({ prefilledOrder, onPrefilledConsumed }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [filterCountry, setFilterCountry] = useState('全部')
  const [filterStatus, setFilterStatus] = useState('全部')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [pendingPrefill, setPendingPrefill] = useState(null)
  const [filterMonth, setFilterMonth] = useState('全部')

  useEffect(() => {
    if (prefilledOrder) {
      setPendingPrefill(prefilledOrder)
      setEditOrder(null)
      setModalOpen(true)
      onPrefilledConsumed()
    }
  }, [prefilledOrder, onPrefilledConsumed])

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('purchase_orders')
        .select('*, purchase_items(*)')
        .order('order_date', { ascending: false })
      if (err) throw err
      setOrders(data || [])
    } catch (err) {
      setError(`載入失敗：${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSave = async (orderData, items) => {
    if (!supabase) throw new Error('Supabase 未設定')

    if (editOrder) {
      // Update order
      const { error: orderErr } = await supabase
        .from('purchase_orders')
        .update({ ...orderData, shipping_fee: parseFloat(orderData.shipping_fee) || 0 })
        .eq('id', editOrder.id)
      if (orderErr) throw orderErr

      // Delete existing items and re-insert
      const { error: delErr } = await supabase
        .from('purchase_items')
        .delete()
        .eq('order_id', editOrder.id)
      if (delErr) throw delErr

      const itemsToInsert = items.map(it => ({
        order_id: editOrder.id,
        item_name: it.item_name,
        color: it.color || null,
        photo_url: it.photo_url || null,
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0,
        currency: it.currency,
      }))
      const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsToInsert)
      if (itemsErr) throw itemsErr
    } else {
      // Insert new order
      const { data: newOrder, error: orderErr } = await supabase
        .from('purchase_orders')
        .insert({ ...orderData, shipping_fee: parseFloat(orderData.shipping_fee) || 0 })
        .select()
        .single()
      if (orderErr) throw orderErr

      const itemsToInsert = items.map(it => ({
        order_id: newOrder.id,
        item_name: it.item_name,
        color: it.color || null,
        photo_url: it.photo_url || null,
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0,
        currency: it.currency,
      }))
      const { error: itemsErr } = await supabase.from('purchase_items').insert(itemsToInsert)
      if (itemsErr) throw itemsErr
    }

    await fetchOrders()
  }

  const handleDelete = async (orderId) => {
    if (!supabase) return
    try {
      const { error: err } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', orderId)
      if (err) throw err
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      setError(`刪除失敗：${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleStatusToggle = async (orderId, newStatus) => {
    if (!supabase) return
    const { error: err } = await supabase
      .from('purchase_orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    if (err) throw err
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const handleItemShipToggle = async (itemId, isShipped) => {
    if (!supabase) return
    const { error: err } = await supabase
      .from('purchase_items')
      .update({ is_shipped: isShipped })
      .eq('id', itemId)
    if (err) throw err
    setOrders(prev => prev.map(o => ({
      ...o,
      purchase_items: o.purchase_items?.map(it =>
        it.id === itemId ? { ...it, is_shipped: isShipped } : it
      ),
    })))
  }

  const availableMonths = [...new Set(
    orders.map(o => o.order_date?.slice(0, 7)).filter(Boolean)
  )].sort().reverse()

  const filteredOrders = orders.filter(o => {
    if (filterCountry !== '全部' && o.country !== filterCountry) return false
    if (filterStatus !== '全部' && o.status !== filterStatus) return false
    if (filterMonth !== '全部' && o.order_date?.slice(0, 7) !== filterMonth) return false
    return true
  })

  return (
    <div>
      {!isSupabaseConfigured && <SetupBanner />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          {/* Country filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
            {COUNTRY_FILTERS.map(c => (
              <button
                key={c}
                onClick={() => setFilterCountry(c)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  filterCountry === c ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Status filter */}
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

          {/* Month filter */}
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white shadow-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="全部">全部月份</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m.replace('-', ' 年 ')} 月</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setEditOrder(null); setModalOpen(true) }}
          disabled={!isSupabaseConfigured}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
          title={!isSupabaseConfigured ? '請先設定 Supabase' : ''}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增訂單
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          載入中...
        </div>
      )}

      {/* Empty state */}
      {!loading && isSupabaseConfigured && filteredOrders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">
            {filterCountry !== '全部' || filterStatus !== '全部' ? '沒有符合篩選條件的訂單' : '尚無任何訂單，點擊「新增訂單」開始吧！'}
          </p>
        </div>
      )}

      {/* Order list */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onEdit={o => { setEditOrder(o); setModalOpen(true) }}
            onDelete={id => setDeleteConfirm(id)}
            onStatusToggle={handleStatusToggle}
            onItemShipToggle={handleItemShipToggle}
          />
        ))}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">確認刪除</h3>
            <p className="text-sm text-gray-600 mb-5">刪除後無法復原，此訂單及其所有商品明細將被永久刪除。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm py-1.5 px-3">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger text-sm py-1.5 px-3">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* Order modal */}
      <OrderModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditOrder(null); setPendingPrefill(null) }}
        onSave={handleSave}
        editOrder={editOrder}
        initialData={pendingPrefill}
      />
    </div>
  )
}
