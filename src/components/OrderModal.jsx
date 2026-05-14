import { useState, useEffect } from 'react'
import ItemForm from './ItemForm'

const COUNTRIES = ['台灣', '韓國', '日本']
const STATUSES = ['待訂貨', '已訂購', '已出貨']

const STATUS_STYLES = {
  '待訂貨': 'bg-gray-500 text-white border-gray-500',
  '已訂購': 'bg-amber-500 text-white border-amber-500',
  '已出貨': 'bg-green-600 text-white border-green-600',
}

const emptyItem = () => ({
  item_name: '',
  photo_url: '',
  quantity: 1,
  unit_price: '',
  currency: 'TWD',
})

const emptyOrder = (initial) => ({
  country: initial?.country || '韓國',
  brand_name: initial?.brand_name || '',
  status: initial?.status || '待訂貨',
  order_date: new Date().toISOString().split('T')[0],
})

export default function OrderModal({ isOpen, onClose, onSave, editOrder, initialData }) {
  const [step, setStep] = useState(1)
  const [orderData, setOrderData] = useState(emptyOrder())
  const [items, setItems] = useState([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (editOrder) {
        setOrderData({
          country: editOrder.country,
          brand_name: editOrder.brand_name,
          status: editOrder.status,
          order_date: editOrder.order_date,
        })
        setItems(
          editOrder.purchase_items && editOrder.purchase_items.length > 0
            ? editOrder.purchase_items.map(it => ({
                id: it.id,
                item_name: it.item_name,
                photo_url: it.photo_url || '',
                quantity: it.quantity,
                unit_price: it.unit_price,
                currency: it.currency,
              }))
            : [emptyItem()]
        )
      } else {
        setOrderData(emptyOrder(initialData))
        setItems([emptyItem()])
      }
      setStep(1)
      setErrors({})
    }
  }, [isOpen, editOrder, initialData])

  const validateStep1 = () => {
    const errs = {}
    if (!orderData.brand_name.trim()) errs.brand_name = '請輸入品牌名稱'
    if (!orderData.order_date) errs.order_date = '請選擇訂購日期'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs = {}
    items.forEach((item, i) => {
      if (!item.item_name.trim()) errs[`item_name_${i}`] = '請輸入商品名稱'
      if (!item.unit_price && item.unit_price !== 0) errs[`unit_price_${i}`] = '請輸入單價'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const COUNTRY_CURRENCY = { '台灣': 'TWD', '韓國': 'KRW', '日本': 'JPY' }

  const handleCountryChange = (country) => {
    const currency = COUNTRY_CURRENCY[country] || 'TWD'
    setOrderData(prev => ({ ...prev, country }))
    setItems(prev => prev.map(it => ({ ...it, currency })))
  }

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
    const errKey = `${field}_${index}`
    if (errors[errKey]) setErrors(prev => { const n = { ...prev }; delete n[errKey]; return n })
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, emptyItem()])
  }

  const handleRemoveItem = (index) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!validateStep2()) return
    setSaving(true)
    try {
      await onSave(orderData, items)
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editOrder ? '編輯訂單' : '新增訂單'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              步驟 {step} / 2：{step === 1 ? '訂單資訊' : '商品明細'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {step === 1 && (
            <>
              {/* Country */}
              <div>
                <label className="label">來源國家 *</label>
                <div className="flex gap-2">
                  {COUNTRIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCountryChange(c)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                        orderData.country === c
                          ? c === '台灣' ? 'bg-blue-600 text-white border-blue-600'
                          : c === '韓國' ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand name */}
              <div>
                <label className="label">品牌名稱 *</label>
                <input
                  type="text"
                  placeholder="輸入品牌或店家名稱"
                  value={orderData.brand_name}
                  onChange={e => {
                    setOrderData(prev => ({ ...prev, brand_name: e.target.value }))
                    if (errors.brand_name) setErrors(prev => { const n = { ...prev }; delete n.brand_name; return n })
                  }}
                  className={`input-field ${errors.brand_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.brand_name && <p className="text-xs text-red-500 mt-1">{errors.brand_name}</p>}
              </div>

              {/* Order date */}
              <div>
                <label className="label">訂購日期 *</label>
                <input
                  type="date"
                  value={orderData.order_date}
                  onChange={e => {
                    setOrderData(prev => ({ ...prev, order_date: e.target.value }))
                    if (errors.order_date) setErrors(prev => { const n = { ...prev }; delete n.order_date; return n })
                  }}
                  className={`input-field ${errors.order_date ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors.order_date && <p className="text-xs text-red-500 mt-1">{errors.order_date}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="label">訂單狀態 *</label>
                <div className="flex gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderData(prev => ({ ...prev, status: s }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                        orderData.status === s
                          ? STATUS_STYLES[s]
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {items.map((item, i) => (
                <ItemForm
                  key={i}
                  item={item}
                  index={i}
                  country={orderData.country}
                  onChange={handleItemChange}
                  onRemove={items.length > 1 ? handleRemoveItem : null}
                />
              ))}

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors duration-150 font-medium"
              >
                + 新增商品
              </button>

              {errors.submit && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.submit}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose} className="btn-secondary">
                取消
              </button>
              <button type="button" onClick={handleNext} className="btn-primary">
                下一步
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                上一步
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? '儲存中...' : editOrder ? '更新訂單' : '建立訂單'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
