import { useState } from 'react'

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Number(num).toLocaleString('zh-TW')
}

function CountryBadge({ country }) {
  const styles = {
    '台灣': 'bg-yellow-50 text-yellow-600',
    '韓國': 'bg-secondary-light text-secondary-dark',
    '日本': 'bg-brand-light text-brand-dark',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[country] || 'bg-gray-100 text-gray-600'}`}>
      {country}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    '待訂貨': 'bg-secondary-light text-secondary-dark',
    '已訂購': 'bg-yellow-50 text-yellow-600',
    '已出貨': 'bg-brand-light text-brand',
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
      <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
        <img
          src={url}
          alt={name}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      </div>
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

export default function OrderCard({ order, onEdit, onDelete, onStatusToggle, onItemShipToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [togglingItem, setTogglingItem] = useState(null)

  const handleItemShip = async (e, itemId, currentVal) => {
    e.stopPropagation()
    setTogglingItem(itemId)
    try {
      await onItemShipToggle(itemId, !currentVal)
    } finally {
      setTogglingItem(null)
    }
  }

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
            <h3 className="font-semibold text-charcoal text-base truncate">{order.brand_name}</h3>
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
                    ? 'border-secondary-light text-secondary-dark hover:bg-secondary-light'
                    : 'border-brand-light text-brand hover:bg-brand-light'
                } disabled:opacity-50`}
              >
                {toggling ? '...' : nextLabel[order.status]}
              </button>
            )}

            {/* Edit */}
            <button
              onClick={e => { e.stopPropagation(); onEdit(order) }}
              className="text-gray-400 hover:text-brand transition-colors"
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left px-4 py-2 font-medium w-10"></th>
                    <th className="text-left px-3 py-2 font-medium">商品名稱</th>
                    <th className="text-left px-3 py-2 font-medium">顏色</th>
                    <th className="text-right px-3 py-2 font-medium">數量</th>
                    <th className="text-right px-3 py-2 font-medium">單價</th>
                    <th className="text-right px-3 py-2 font-medium">總計</th>
                    <th className="text-center px-4 py-2 font-medium w-16">出貨</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.purchase_items.map((item) => {
                    const total = item.total_price ?? (item.quantity * item.unit_price)
                    const shipped = item.is_shipped || false
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${shipped ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-2">
                          <PhotoThumbnail url={item.photo_url} name={item.item_name} />
                        </td>
                        <td className="px-3 py-2 font-medium text-charcoal">{item.item_name}</td>
                        <td className="px-3 py-2 text-gray-500">{item.color || '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {formatNumber(item.unit_price)} {item.currency}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-charcoal">
                          {formatNumber(total)} {item.currency}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={e => handleItemShip(e, item.id, shipped)}
                            disabled={togglingItem === item.id}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
                              shipped
                                ? 'bg-brand border-brand text-white'
                                : 'border-gray-300 hover:border-brand text-transparent'
                            } disabled:opacity-50`}
                            title={shipped ? '標記為未出貨' : '標記為已出貨'}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    const currency = order.purchase_items[0]?.currency || 'TWD'
                    const itemsTotal = order.purchase_items.reduce((sum, it) =>
                      sum + (it.total_price ?? it.quantity * it.unit_price), 0)
                    const taxAmount = order.has_tax ? itemsTotal * 0.10 : 0
                    const proxyAmount = order.has_proxy_fee ? itemsTotal * 0.08 : 0
                    const shippingFee = order.shipping_fee || 0
                    const grandTotal = itemsTotal + taxAmount + proxyAmount + shippingFee
                    return (
                      <>
                        {order.has_tax && (
                          <tr className="border-t border-gray-100 bg-gray-50">
                            <td colSpan={6} className="px-4 py-1.5 text-right text-xs text-gray-500">消費稅（10%）</td>
                            <td className="px-4 py-1.5 text-right text-sm text-gray-600 whitespace-nowrap">{formatNumber(taxAmount)} {currency}</td>
                          </tr>
                        )}
                        {order.has_proxy_fee && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-1.5 text-right text-xs text-gray-500">代購手續費（8%）</td>
                            <td className="px-4 py-1.5 text-right text-sm text-gray-600 whitespace-nowrap">{formatNumber(proxyAmount)} {currency}</td>
                          </tr>
                        )}
                        {shippingFee > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-1.5 text-right text-xs text-gray-500">運費</td>
                            <td className="px-4 py-1.5 text-right text-sm text-gray-600">{formatNumber(shippingFee)} TWD</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td colSpan={6} className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600">合計</td>
                          <td className="px-4 py-2.5 text-right text-base font-bold text-brand whitespace-nowrap">
                            {formatNumber(grandTotal)} {currency}
                          </td>
                        </tr>
                      </>
                    )
                  })()}
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
