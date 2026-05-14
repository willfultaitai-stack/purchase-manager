import { useState } from 'react'

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Number(num).toLocaleString('zh-TW')
}

function CountryBadge({ country }) {
  const styles = {
    '台灣': 'bg-blue-100 text-blue-700',
    '韓國': 'bg-pink-100 text-pink-700',
    '日本': 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[country] || 'bg-gray-100 text-gray-600'}`}>
      {country}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    '待訂貨': 'bg-gray-100 text-gray-600',
    '已訂購': 'bg-amber-100 text-amber-700',
    '已出貨': 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function PhotoThumbnail({ url, name }) {
  const [error, setError] = useState(false)
  if (url && !error) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setError(true)}
        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

export default function OrderCard({ order, onEdit, onDelete, onStatusToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)

  const itemCount = order.purchase_items ? order.purchase_items.length : 0

  const nextStatus = { '待訂貨': '已訂購', '已訂購': '已出貨', '已出貨': null }
  const nextLabel = { '待訂貨': '→ 已訂購', '已訂購': '→ 已出貨', '已出貨': null }

  const handleStatusToggle = async (e) => {
    e.stopPropagation()
    const next = nextStatus[order.status]
    if (!next) return
    setToggling(true)
    try {
      await onStatusToggle(order.id, next)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Card header — clickable to expand */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <CountryBadge country={order.country} />
              <StatusBadge status={order.status} />
            </div>
            <h3 className="font-semibold text-gray-900 text-base truncate">{order.brand_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              訂購日期：{order.order_date} &nbsp;·&nbsp; {itemCount} 件商品
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status toggle button */}
            {nextStatus[order.status] && (
              <button
                onClick={handleStatusToggle}
                disabled={toggling}
                className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors duration-150 ${
                  order.status === '待訂貨'
                    ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                } disabled:opacity-50`}
              >
                {toggling ? '...' : nextLabel[order.status]}
              </button>
            )}

            {/* Edit */}
            <button
              onClick={e => { e.stopPropagation(); onEdit(order) }}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="編輯訂單"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={e => { e.stopPropagation(); onDelete(order.id) }}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="刪除訂單"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Expand chevron */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-100">
          {itemCount === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">尚無商品明細</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {order.purchase_items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <PhotoThumbnail url={item.photo_url} name={item.item_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      單價：{formatNumber(item.unit_price)} {item.currency} &nbsp;×&nbsp; {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatNumber(item.total_price ?? (item.quantity * item.unit_price))} {item.currency}
                    </p>
                    <p className="text-xs text-gray-400">小計</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
