const fs = require('fs');

// ExploreClient.tsx
let exCode = fs.readFileSync('apps/web/app/explore/ExploreClient.tsx', 'utf-8');
exCode = exCode.replace(/className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"/g, 'className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"');
exCode = exCode.replace(/className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"/g, 'className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"');
fs.writeFileSync('apps/web/app/explore/ExploreClient.tsx', exCode);

// ProductDetailClient.tsx
let pdCode = fs.readFileSync('apps/web/app/products/[slug]/ProductDetailClient.tsx', 'utf-8');
pdCode = pdCode.replace(/className="grid grid-cols-1 sm:grid-cols-3 gap-2"/g, 'className="grid grid-cols-3 gap-1 sm:gap-2"');

let ctaBlockOld = `            {/* Quantity Selector & CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              {/* Qty stepper */}
              <div className="flex items-center justify-between sm:justify-start h-12 border-2 border-gray-200 rounded-xl px-2 bg-white flex-shrink-0">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center text-base font-bold text-[#1a2e12]">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"><Plus className="w-4 h-4" /></button>
              </div>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1 h-12 border-2 border-[#425733] text-[#425733] hover:bg-[#f8faf6] rounded-xl font-bold text-sm" 
                onClick={handleAddToCart} 
                disabled={product.inventory <= 0}
              >
                Thêm Vào Giỏ
              </Button>
              <Button 
                size="lg" 
                className="flex-1 h-12 bg-[#425733] hover:bg-[#364a29] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all" 
                onClick={handleBuyNow} 
                disabled={product.inventory <= 0}
              >
                Mua Ngay
              </Button>
            </div>`;

let ctaBlockNew = `            {/* Quantity Selector & CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              {/* Qty stepper */}
              <div className="flex items-center justify-between sm:justify-start h-12 border-2 border-gray-200 rounded-xl px-2 bg-white flex-shrink-0">
                <span className="text-sm font-semibold text-gray-500 ml-2 sm:hidden">Số lượng</span>
                <div className="flex items-center">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center text-base font-bold text-[#1a2e12]">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#425733] transition-colors rounded-lg hover:bg-[#f8faf6]"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1 h-12 border-2 border-[#425733] text-[#425733] hover:bg-[#f8faf6] rounded-xl font-bold text-xs sm:text-sm px-2" 
                  onClick={handleAddToCart} 
                  disabled={product.inventory <= 0}
                >
                  Thêm Vào Giỏ
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 h-12 bg-[#425733] hover:bg-[#364a29] text-white rounded-xl font-bold text-xs sm:text-sm px-2 shadow-md hover:shadow-lg transition-all" 
                  onClick={handleBuyNow} 
                  disabled={product.inventory <= 0}
                >
                  Mua Ngay
                </Button>
              </div>
            </div>`;

pdCode = pdCode.replace(ctaBlockOld, ctaBlockNew);
fs.writeFileSync('apps/web/app/products/[slug]/ProductDetailClient.tsx', pdCode);
