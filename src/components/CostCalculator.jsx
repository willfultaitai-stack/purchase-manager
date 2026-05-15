import { useState, useRef, useCallback } from 'react'

function formatNumber(num) {
  if (isNaN(num) || num === null || num === undefined) return '—'
  return Math.round(num).toLocaleString('zh-TW')
}

function KoreanCalculator({ onSave }) {
  const [krwAmount, setKrwAmount] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const krw = parseFloat(krwAmount) || 0
  const weight = parseFloat(weightKg) || 0
  const cost = krw / 40 + 165 * weight
  const hasInput = krwAmount !== '' || weightKg !== ''

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">韓幣金額 (KRW)</label>
          <input
            type="number" min="0" placeholder="例：50000"
            value={krwAmount} onChange={e => setKrwAmount(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">匯率固定：KRW ÷ 40</p>
        </div>
        <div>
          <label className="label">重量 (kg)</label>
          <input
            type="number" min="0" step="0.1" placeholder="例：0.5"
            value={weightKg} onChange={e => setWeightKg(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">運費 105 + 關稅 60 = 165 元/kg</p>
        </div>
      </div>

      <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 text-sm text-pink-700 space-y-1">
        <p className="font-semibold text-pink-800 mb-2">計算公式</p>
        <p>成本 (TWD) = KRW ÷ 40 + 165 × 重量(kg)</p>
        {hasInput && (
          <p className="text-pink-600 mt-1">
            = {krwAmount || 0} ÷ 40 + 165 × {weightKg || 0}
            <br />= {formatNumber(krw / 40)} + {formatNumber(165 * weight)}
          </p>
        )}
      </div>

      <div className="card p-5">
        <div>
          <p className="text-sm text-gray-500 mb-1">估算成本</p>
          <p className="text-3xl font-bold text-gray-900">
            {hasInput ? `NT$ ${formatNumber(cost)}` : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={() => hasInput && onSave({
          country: '韓國',
          cost,
          sellingPrice: 0,
          detail: `KRW ${Number(krwAmount || 0).toLocaleString()}／${weightKg || 0} kg`,
        })}
        disabled={!hasInput}
        className="w-full py-2 rounded-lg text-sm font-medium border-2 border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        + 儲存
      </button>
    </div>
  )
}

function JapaneseCalculator({ onSave }) {
  const [jpyAmount, setJpyAmount] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [hasProxyFee, setHasProxyFee] = useState(false)

  const jpy = parseFloat(jpyAmount) || 0
  const weight = parseFloat(weightKg) || 0
  const hasInput = jpyAmount !== '' || weightKg !== ''
  const cost = hasProxyFee
    ? jpy * 1.08 * 1.1 * 0.22 + 180 * weight
    : jpy * 1.1 * 0.22 + 180 * weight

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">日幣金額 (JPY)</label>
          <input
            type="number" min="0" placeholder="例：3000"
            value={jpyAmount} onChange={e => setJpyAmount(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">重量 (kg)</label>
          <input
            type="number" min="0" step="0.1" placeholder="例：0.3"
            value={weightKg} onChange={e => setWeightKg(e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">運費 180 元/kg</p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
        <div className="relative">
          <input type="checkbox" className="sr-only" checked={hasProxyFee} onChange={e => setHasProxyFee(e.target.checked)} />
          <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${hasProxyFee ? 'bg-indigo-600' : 'bg-gray-300'}`} />
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${hasProxyFee ? 'translate-x-4' : ''}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">含代購手續費（×1.08）</span>
      </label>

      <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700 space-y-1">
        <p className="font-semibold text-red-800 mb-2">計算公式</p>
        {hasProxyFee
          ? <p>成本 (TWD) = JPY × 1.08 × 1.1 × 0.22 + 180 × 重量(kg)</p>
          : <p>成本 (TWD) = JPY × 1.1 × 0.22 + 180 × 重量(kg)</p>
        }
        {hasInput && (
          <p className="text-red-600 mt-1">
            {hasProxyFee
              ? `= ${jpy} × 1.08 × 1.1 × 0.22 + 180 × ${weight}`
              : `= ${jpy} × 1.1 × 0.22 + 180 × ${weight}`}
            <br />
            = {formatNumber(hasProxyFee ? jpy * 1.08 * 1.1 * 0.22 : jpy * 1.1 * 0.22)} + {formatNumber(180 * weight)}
          </p>
        )}
      </div>

      <div className="card p-5">
        <div>
          <p className="text-sm text-gray-500 mb-1">估算成本</p>
          <p className="text-3xl font-bold text-gray-900">
            {hasInput ? `NT$ ${formatNumber(cost)}` : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={() => hasInput && onSave({
          country: '日本',
          cost,
          sellingPrice: 0,
          detail: `JPY ${Number(jpyAmount || 0).toLocaleString()}${hasProxyFee ? '（含代購費）' : ''}／${weightKg || 0} kg`,
        })}
        disabled={!hasInput}
        className="w-full py-2 rounded-lg text-sm font-medium border-2 border-dashed border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        + 儲存
      </button>
    </div>
  )
}

function ComparisonList({ items, onRemove, onUpdate, onOrder }) {
  const [confirmId, setConfirmId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingPrice, setEditingPrice] = useState('')

  const handlePriceEdit = (item) => {
    setEditingId(item.id)
    setEditingPrice(item.sellingPrice || '')
  }

  const handlePriceSave = (id) => {
    onUpdate(id, { sellingPrice: editingPrice })
    setEditingId(null)
    setEditingPrice('')
  }

  if (items.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">比對清單（{items.length} 筆）</h3>
      <div className="space-y-2">
        {items.map(item => {
          const selling = parseFloat(item.sellingPrice) || 0
          const tax = selling * 0.05
          const profit = selling - (item.cost + tax)
          const hasPrice = selling > 0
          const isEditing = editingId === item.id

          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Photo thumbnail */}
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.productName || '商品'}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.country === '韓國' ? 'bg-pink-100 text-pink-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.country}
                    </span>
                    {item.brandName && <span className="text-xs text-gray-500 font-medium">{item.brandName}</span>}
                    {item.productName && <span className="text-xs text-gray-700 font-semibold">{item.productName}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{item.detail}</p>

                  {/* Cost + selling price + profit */}
                  <div className="flex flex-wrap items-end gap-3 mt-1">
                    <div>
                      <p className="text-xs text-gray-400">估算成本</p>
                      <p className="text-sm font-bold text-gray-800">NT$ {formatNumber(item.cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">建議售價</p>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            placeholder="輸入售價"
                            value={editingPrice}
                            onChange={e => setEditingPrice(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePriceSave(item.id)}
                            className="w-24 text-sm border border-indigo-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            onClick={() => handlePriceSave(item.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                          >
                            儲存
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePriceEdit(item)}
                          className="text-sm font-bold text-indigo-600 hover:underline"
                        >
                          {hasPrice ? `NT$ ${formatNumber(selling)}` : '點擊輸入'}
                        </button>
                      )}
                    </div>
                    {hasPrice && !isEditing && (
                      <div>
                        <p className="text-xs text-gray-400">利潤（扣稅5%）</p>
                        <p className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}NT$ {formatNumber(profit)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => onOrder(item)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    訂購
                  </button>
                  <button
                    onClick={() => setConfirmId(item.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {confirmId === item.id && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                  <p className="text-sm text-red-700">確定要刪除這筆比對資料嗎？</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => { onRemove(item.id); setConfirmId(null) }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                    >
                      確認刪除
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CostCalculator({ onOrder, savedItems, onAddItem, onRemoveItem, onUpdateItem }) {
  const [activeTab, setActiveTab] = useState('korea')
  const [brandName, setBrandName] = useState('')
  const [productName, setProductName] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoName, setPhotoName] = useState('')
  const fileInputRef = useRef(null)

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoUrl(ev.target.result)
      setPhotoName(file.name)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemovePhoto = () => {
    setPhotoUrl(null)
    setPhotoName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = (calcData) => {
    onAddItem({
      brandName,
      productName,
      photoUrl,
      ...calcData,
    })
  }

  const handleOrder = (item) => {
    onOrder({
      country: item.country,
      brand_name: item.brandName || '',
      status: '待訂貨',
      productName: item.productName || '',
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card overflow-hidden">
        {/* Brand + Product + Photo */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">品牌名稱</label>
              <input
                type="text" placeholder="例：COSRX、無印良品"
                value={brandName} onChange={e => setBrandName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">產品名稱</label>
              <input
                type="text" placeholder="例：蝸牛精華、蘆薈凝膠"
                value={productName} onChange={e => setProductName(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="label">商品照片</label>
            {photoUrl ? (
              <div className="flex items-center gap-3">
                <img src={photoUrl} alt="商品" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{photoName}</p>
                  <button
                    onClick={handleRemovePhoto}
                    className="text-xs text-red-400 hover:text-red-600 mt-1"
                  >
                    移除照片
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                上傳商品照片
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Country tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('korea')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'korea'
                ? 'bg-pink-50 text-pink-700 border-b-2 border-pink-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🇰🇷 韓國商品
          </button>
          <button
            onClick={() => setActiveTab('japan')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'japan'
                ? 'bg-red-50 text-red-700 border-b-2 border-red-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🇯🇵 日本商品
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'korea'
            ? <KoreanCalculator onSave={handleSave} />
            : <JapaneseCalculator onSave={handleSave} />
          }
        </div>
      </div>

      <ComparisonList items={savedItems} onRemove={onRemoveItem} onUpdate={onUpdateItem} onOrder={handleOrder} />
    </div>
  )
}
