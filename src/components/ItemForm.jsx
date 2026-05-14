import { useState } from 'react'
import { supabase } from '../lib/supabase'

const COUNTRY_CURRENCY = { '台灣': 'TWD', '韓國': 'KRW', '日本': 'JPY' }

function formatNumber(num) {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString('zh-TW')
}

export default function ItemForm({ item, onChange, onRemove, index, country }) {
  const currency = COUNTRY_CURRENCY[country] || item.currency || 'TWD'
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!supabase) {
      setUploadError('Supabase 未設定，無法上傳圖片')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, file, { upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('product-photos')
        .getPublicUrl(data.path)

      onChange(index, 'photo_url', urlData.publicUrl)
    } catch (err) {
      setUploadError(`上傳失敗：${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const totalPrice = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">商品 {index + 1}</span>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            移除
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Item name */}
        <div className="sm:col-span-2">
          <label className="label">商品名稱 *</label>
          <input
            type="text"
            required
            placeholder="輸入商品名稱"
            value={item.item_name}
            onChange={e => onChange(index, 'item_name', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="label">數量 *</label>
          <input
            type="number"
            min="1"
            required
            placeholder="1"
            value={item.quantity}
            onChange={e => onChange(index, 'quantity', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Unit price + currency */}
        <div>
          <label className="label">單價 *</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0"
              value={item.unit_price}
              onChange={e => onChange(index, 'unit_price', e.target.value)}
              className="input-field"
            />
            <span className="input-field w-20 flex-shrink-0 bg-gray-50 text-gray-500 text-sm flex items-center justify-center font-medium">
              {currency}
            </span>
          </div>
        </div>

        {/* Total price display */}
        <div className="sm:col-span-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
          <span className="text-sm text-gray-500">小計</span>
          <span className="font-semibold text-gray-800">
            {formatNumber(totalPrice)} {currency}
          </span>
        </div>

        {/* Photo upload */}
        <div className="sm:col-span-2">
          <label className="label">商品照片（選填）</label>
          <div className="flex items-start gap-3">
            {item.photo_url ? (
              <div className="relative flex-shrink-0">
                <img
                  src={item.photo_url}
                  alt="商品照片"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  onError={e => { e.target.style.display = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => onChange(index, 'photo_url', '')}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <label className={`cursor-pointer inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors duration-150 ${uploading ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {uploading ? '上傳中...' : '選擇圖片'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handlePhotoUpload}
                />
              </label>
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              {!supabase && (
                <p className="text-xs text-amber-600 mt-1">需設定 Supabase 才能上傳圖片</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
