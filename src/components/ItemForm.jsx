import { useState } from 'react'
import { supabase } from '../lib/supabase'

const COUNTRY_CURRENCY = { '台灣': 'TWD', '韓國': 'KRW', '日本': 'JPY' }

function formatNumber(num) {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString('zh-TW')
}

function VariantRow({ variant, index, currency, multiplier, onChange, onRemove, canRemove }) {
  const baseTotal = (parseFloat(variant.quantity) || 0) * (parseFloat(variant.unit_price) || 0)
  const total = baseTotal * multiplier

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100 last:border-0">
      {/* Color / Spec */}
      <div className="col-span-4">
        <input
          type="text"
          placeholder="顏色 / 規格"
          value={variant.color || ''}
          onChange={e => onChange(index, 'color', e.target.value)}
          className="input-field text-sm py-1.5"
        />
      </div>
      {/* Quantity */}
      <div className="col-span-2">
        <input
          type="number"
          min="1"
          placeholder="數量"
          value={variant.quantity}
          onChange={e => onChange(index, 'quantity', e.target.value)}
          className="input-field text-sm py-1.5 text-center"
        />
      </div>
      {/* Unit price */}
      <div className="col-span-3">
        <input
          type="number"
          min="0"
          placeholder="單價"
          value={variant.unit_price}
          onChange={e => onChange(index, 'unit_price', e.target.value)}
          className="input-field text-sm py-1.5"
        />
      </div>
      {/* Subtotal */}
      <div className="col-span-2 text-right text-sm font-semibold text-gray-700 pr-1">
        {total > 0 ? formatNumber(total) : '—'}
        <span className="text-xs text-gray-400 ml-0.5">{currency}</span>
      </div>
      {/* Remove */}
      <div className="col-span-1 flex justify-center">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function ItemForm({ product, productIndex, country, hasProxyFee, hasTax, onChange, onRemove, canRemove }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const currency = COUNTRY_CURRENCY[country] || 'TWD'
  const multiplier = (hasTax ? 1.10 : 1) * (hasProxyFee ? 1.08 : 1)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!supabase) { setUploadError('Supabase 未設定，無法上傳圖片'); return }
    setUploading(true)
    setUploadError('')
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('product-photos').upload(fileName, file, { upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(data.path)
      onChange(productIndex, 'photo_url', urlData.publicUrl)
    } catch (err) {
      setUploadError(`上傳失敗：${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleVariantChange = (variantIndex, field, value) => {
    const newVariants = product.variants.map((v, i) =>
      i === variantIndex ? { ...v, [field]: value } : v
    )
    onChange(productIndex, 'variants', newVariants)
  }

  const handleAddVariant = () => {
    onChange(productIndex, 'variants', [
      ...product.variants,
      { color: '', quantity: 1, unit_price: '' }
    ])
  }

  const handleRemoveVariant = (variantIndex) => {
    onChange(productIndex, 'variants', product.variants.filter((_, i) => i !== variantIndex))
  }

  const productTotal = product.variants.reduce((sum, v) =>
    sum + (parseFloat(v.quantity) || 0) * (parseFloat(v.unit_price) || 0), 0
  ) * multiplier

  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
      {/* Product header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-sm font-semibold text-gray-600">商品 {productIndex + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(productIndex)} className="text-red-400 hover:text-red-600 text-xs font-medium">
            移除此商品
          </button>
        )}
      </div>

      <div className="px-4 pb-3 space-y-3">
        {/* Product name + photo */}
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <label className="label">商品名稱 *</label>
            <input
              type="text"
              required
              placeholder="輸入商品名稱"
              value={product.item_name}
              onChange={e => onChange(productIndex, 'item_name', e.target.value)}
              className="input-field"
            />
          </div>
          {/* Photo */}
          <div className="flex-shrink-0">
            <label className="label">照片</label>
            {product.photo_url ? (
              <div className="relative">
                <img src={product.photo_url} alt="商品" className="w-12 h-12 object-cover rounded-lg border border-gray-200" onError={e => { e.target.style.display = 'none' }} />
                <button type="button" onClick={() => onChange(productIndex, 'photo_url', '')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600">×</button>
              </div>
            ) : (
              <label className={`w-12 h-12 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handlePhotoUpload} />
              </label>
            )}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 pt-2 pb-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium pb-1 border-b border-gray-100">
            <div className="col-span-4">顏色 / 規格</div>
            <div className="col-span-2 text-center">數量</div>
            <div className="col-span-3">單價（{currency}）</div>
            <div className="col-span-2 text-right">總計</div>
            <div className="col-span-1"></div>
          </div>

          {product.variants.map((variant, i) => (
            <VariantRow
              key={i}
              variant={variant}
              index={i}
              currency={currency}
              multiplier={multiplier}
              onChange={handleVariantChange}
              onRemove={handleRemoveVariant}
              canRemove={product.variants.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={handleAddVariant}
            className="w-full py-1.5 mt-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded transition-colors"
          >
            + 新增規格
          </button>
        </div>

        {/* Product subtotal */}
        {productTotal > 0 && (
          <div className="flex justify-end text-sm">
            <span className="text-gray-500 mr-2">商品小計</span>
            <span className="font-bold text-gray-800">{formatNumber(productTotal)} {currency}</span>
          </div>
        )}
      </div>
    </div>
  )
}
