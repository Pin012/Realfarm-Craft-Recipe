import { Recipe } from '@/types';
import { Search, Filter, ChefHat, Menu, ChevronDown, ChevronUp, LayoutGrid, Image as ImageIcon, X, Pin, PinOff, Layers, Calculator } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { parseExcelData, SAMPLE_DATA_TEXT } from '@/lib/parser';
import { RecipeMatcher } from '@/components/RecipeMatcher';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('All');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'thumbnail'>('card');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [pinnedRecipes, setPinnedRecipes] = useState<string[]>([]);
  const [showPinnedView, setShowPinnedView] = useState(false);
  const [currentTab, setCurrentTab] = useState<'browse' | 'matcher'>('browse');
  const [isMainCategoryOpen, setIsMainCategoryOpen] = useState(true);

  // Load initial data
  useEffect(() => {
    const savedData = localStorage.getItem('realfarm_recipes');
    if (savedData) {
      try {
        setRecipes(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load saved data", e);
        loadSampleData();
      }
    } else {
      loadSampleData();
    }
  }, []);

  const loadSampleData = () => {
    const parsed = parseExcelData(SAMPLE_DATA_TEXT);
    setRecipes(parsed);
  };

  const mainCategories = useMemo(() => {
    const cats = new Set(recipes.map(r => r.mainCategory).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [recipes]);

  const getCategoryCount = (category: string) => {
    if (category === 'All') return recipes.length;
    return recipes.filter(r => r.mainCategory === category).length;
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedMainCategory === 'All' || recipe.mainCategory === selectedMainCategory;
      const matchesSubCategory = !activeSubCategory || recipe.subCategory === activeSubCategory;

      return matchesSearch && matchesCategory && matchesSubCategory;
    });
  }, [recipes, searchQuery, selectedMainCategory, activeSubCategory]);

  const subCategories = useMemo(() => {
    const targetRecipes = selectedMainCategory === 'All' ? recipes : recipes.filter(r => r.mainCategory === selectedMainCategory);
    const subs = new Set(
      targetRecipes
        .map(r => r.subCategory)
        .filter(Boolean)
    );
    return Array.from(subs).sort();
  }, [recipes, selectedMainCategory]);

  const getSubCategoryCount = (sub: string) => {
    const targetRecipes = selectedMainCategory === 'All' ? recipes : recipes.filter(r => r.mainCategory === selectedMainCategory);
    return targetRecipes.filter(r => r.subCategory === sub).length;
  };

  // Reset subcategory when main category changes
  useEffect(() => {
    setActiveSubCategory(null);
    setIsSubCategoryOpen(true);
  }, [selectedMainCategory]);

  const getItemBackgroundClass = (name: string) => {
    if (name.includes('美味')) return 'bg-[#e8f3d5] border-[#e8f3d5]';
    if (name.includes('優質')) return 'bg-[#d9e7f3] border-[#d9e7f3]';
    if (name.includes('特製')) return 'bg-[#e6dcf0] border-[#e6dcf0]';
    return 'bg-stone-100 border-stone-100';
  };

  const togglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPinnedRecipes(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const pinnedRecipesList = useMemo(() => {
    return recipes.filter(r => pinnedRecipes.includes(r.id));
  }, [recipes, pinnedRecipes]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans pb-20">
      {/* Header */}
      <header className="text-white shadow-md relative z-50 bg-[#788e82]/90 backdrop-blur-md transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-2 self-start md:justify-self-start">
              <ChefHat className="w-6 h-6 drop-shadow-md text-emerald-50" />
              <h1 className="text-xl font-bold tracking-tight drop-shadow-md text-white">Realfarm Craft</h1>
            </div>

            {/* App Mode Navigation */}
            <div className="flex bg-black/10 p-1 rounded-lg self-center md:justify-self-center">
              <button
                onClick={() => setCurrentTab('browse')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  currentTab === 'browse' ? "bg-white text-[#788e82] shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                瀏覽食譜
              </button>
              <button
                onClick={() => setCurrentTab('matcher')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                  currentTab === 'matcher' ? "bg-white text-[#788e82] shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                <Calculator className="w-3.5 h-3.5" />
                食材找食譜
              </button>
            </div>
            
            <div className="flex items-center justify-end gap-2 w-full md:w-auto md:justify-self-end">
              {currentTab === 'browse' ? (
                <div className="relative flex-1 md:flex-none md:w-28 animate-in fade-in zoom-in duration-300">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/90 drop-shadow-sm" />
                  <input
                    type="text"
                    placeholder="搜尋..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white/20 border border-white/30 rounded-full text-xs text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all backdrop-blur-sm shadow-sm"
                  />
                </div>
              ) : (
                <div className="hidden md:block w-28" />
              )}
            </div>
          </div>

          {/* Main Category Tabs */}
          {currentTab === 'browse' && (
            <>
              {/* Desktop View: Horizontal Scroll */}
              <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {mainCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedMainCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 backdrop-blur-md shadow-sm",
                      selectedMainCategory === cat
                        ? "bg-white text-[#788e82] shadow-md"
                        : "bg-black/10 text-white hover:bg-white/20 border border-white/20"
                    )}
                  >
                    <span className="drop-shadow-sm font-bold">{cat === 'All' ? '全部' : cat}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-bold",
                      selectedMainCategory === cat
                        ? "bg-[#788e82]/20 text-[#788e82]"
                        : "bg-white/30 text-white"
                    )}>
                      {getCategoryCount(cat)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mobile View: Collapsible List */}
              <div className="md:hidden mt-3 bg-black/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setIsMainCategoryOpen(!isMainCategoryOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Filter className="w-4 h-4 opacity-80" />
                    <span>{selectedMainCategory === 'All' ? '全部類別' : selectedMainCategory}</span>
                    <span className="bg-white/10 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {getCategoryCount(selectedMainCategory)}
                    </span>
                  </div>
                  {isMainCategoryOpen ? <ChevronUp className="w-4 h-4 opacity-80" /> : <ChevronDown className="w-4 h-4 opacity-80" />}
                </button>

                {isMainCategoryOpen && (
                  <div className="px-3 pb-3 flex flex-wrap gap-2 animate-in slide-in-from-top-1">
                    {mainCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedMainCategory(cat);
                          setIsMainCategoryOpen(false);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border",
                          selectedMainCategory === cat
                            ? "bg-white text-[#788e82] border-white shadow-sm"
                            : "bg-transparent text-white border-white/10 hover:bg-white/10"
                        )}
                      >
                        <span className="font-bold">{cat === 'All' ? '全部' : cat}</span>
                        <span className={cn(
                          "text-[10px] px-1 py-0.5 rounded-full font-bold",
                          selectedMainCategory === cat
                            ? "bg-[#788e82]/20 text-[#788e82]"
                            : "bg-white/10 text-white"
                        )}>
                          {getCategoryCount(cat)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative">
        {/* Floating Pinned Button */}
        {pinnedRecipes.length > 0 && (
          <div className="sticky top-4 z-40 flex justify-end pointer-events-none mb-[-40px]">
            <button
              onClick={() => setShowPinnedView(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 border border-orange-400 rounded-full text-sm text-white transition-all shadow-lg animate-in fade-in zoom-in duration-300"
            >
              <Layers className="w-5 h-5" />
              <span className="font-bold text-base">{pinnedRecipes.length}</span>
            </button>
          </div>
        )}

        {currentTab === 'matcher' ? (
          <RecipeMatcher recipes={recipes} />
        ) : (
          <>
            {/* Sub Categories Collapsible */}
            {subCategories.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <button 
              onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-stone-700 font-medium text-sm">
                <Filter className="w-4 h-4" />
                <span>子分類篩選</span>
                {activeSubCategory && (
                  <span className="ml-2 px-2 py-0.5 bg-[#788e82]/20 text-[#788e82] rounded text-xs">
                    {activeSubCategory}
                  </span>
                )}
              </div>
              {isSubCategoryOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>
            
            {isSubCategoryOpen && (
              <div className="p-3 flex flex-wrap gap-2 border-t border-stone-100">
                <button
                  onClick={() => setActiveSubCategory(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    activeSubCategory === null
                      ? "bg-[#788e82] text-white border-[#788e82]"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  )}
                >
                  全部
                </button>
                {subCategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubCategory(sub === activeSubCategory ? null : sub)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5",
                      activeSubCategory === sub
                        ? "bg-[#788e82] text-white border-[#788e82]"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    )}
                  >
                    <span>{sub}</span>
                    <span className={cn(
                      "text-[10px] px-1 py-0.5 rounded-full",
                      activeSubCategory === sub
                        ? "bg-[#657a6e] text-white"
                        : "bg-stone-100 text-stone-500"
                    )}>
                      {getSubCategoryCount(sub)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe Grid */}
        <div className={cn(
          viewMode === 'card' ? "grid gap-4" : "grid gap-1.5",
          viewMode === 'card' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(16,minmax(0,1fr))]"
        )}>
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={cn(
                "bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex hover:shadow-md transition-shadow relative group",
                viewMode === 'card' ? "flex-col" : "flex-col"
              )}
            >
              {viewMode === 'card' ? (
                // Card View
                <>
                  <button
                    onClick={(e) => togglePin(recipe.id, e)}
                    className={cn(
                      "absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 shadow-sm",
                      pinnedRecipes.includes(recipe.id)
                        ? "bg-[#788e82] text-white"
                        : "bg-white text-stone-400 hover:text-stone-600 border border-stone-100"
                    )}
                  >
                    {pinnedRecipes.includes(recipe.id) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <div className="p-3 flex items-center gap-3 border-b border-stone-100 pr-10">
                    <div className={cn(
                      "relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border",
                      getItemBackgroundClass(recipe.name)
                    )}>
                      <img 
                        src={recipe.image || `/images/${recipe.name}.png`}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                        }}
                      />
                      <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center text-stone-400">
                        <ChefHat className="w-6 h-6 opacity-50" />
                      </div>
                      {!recipe.image && (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 -z-10">
                          <ChefHat className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-stone-800 truncate mb-1">{recipe.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {recipe.mainCategory && (
                          <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{recipe.mainCategory}</span>
                        )}
                        {recipe.subCategory && (
                          <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{recipe.subCategory}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-stone-50/50 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ing, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 bg-white border border-stone-200 rounded px-2 py-1 shadow-sm"
                        >
                          <span className="text-xs text-stone-600 font-medium">{ing.name}</span>
                          <span className="text-xs font-bold text-[#5a7064]">{ing.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Thumbnail View
                <div 
                  className="p-1 flex flex-col items-center gap-1 h-full cursor-pointer group relative"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className={cn(
                    "relative w-full aspect-square rounded-md overflow-hidden border transition-transform group-hover:scale-105",
                    getItemBackgroundClass(recipe.name),
                    pinnedRecipes.includes(recipe.id) && "ring-2 ring-[#788e82] ring-offset-1"
                  )}>
                    <img 
                      src={recipe.image || `/images/${recipe.name}.png`}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                      }}
                    />
                    <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center text-stone-400">
                      <ChefHat className="w-5 h-5 opacity-50" />
                    </div>
                    {!recipe.image && (
                      <div className="absolute inset-0 flex items-center justify-center text-stone-400 -z-10">
                        <ChefHat className="w-5 h-5 opacity-50" />
                      </div>
                    )}
                    {pinnedRecipes.includes(recipe.id) && (
                      <div className="absolute top-1 right-1 bg-[#788e82] text-white p-0.5 rounded-full shadow-sm">
                        <Pin className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-[9px] leading-tight text-stone-800 text-center line-clamp-2 w-full px-0.5 tracking-tight">{recipe.name}</h3>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Thumbnail Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)}>
            <div 
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 flex items-center gap-4 border-b border-stone-100 relative">
                <div className={cn(
                  "relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border",
                  getItemBackgroundClass(selectedRecipe.name)
                )}>
                  <img 
                    src={selectedRecipe.image || `/images/${selectedRecipe.name}.png`}
                    alt={selectedRecipe.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                    }}
                  />
                  <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center text-stone-400">
                    <ChefHat className="w-8 h-8 opacity-50" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 flex items-end justify-between gap-2 pr-6">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-stone-800 mb-1">{selectedRecipe.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedRecipe.mainCategory && (
                        <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{selectedRecipe.mainCategory}</span>
                      )}
                      {selectedRecipe.subCategory && (
                        <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{selectedRecipe.subCategory}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => togglePin(selectedRecipe.id, e)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm border whitespace-nowrap",
                      pinnedRecipes.includes(selectedRecipe.id)
                        ? "bg-[#788e82] text-white border-[#788e82]"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    {pinnedRecipes.includes(selectedRecipe.id) ? (
                      <>
                        <PinOff className="w-3.5 h-3.5" />
                        <span>取消釘選</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>釘選</span>
                      </>
                    )}
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-2 right-2 p-1 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 bg-stone-50/50">
                <h4 className="text-sm font-bold text-stone-700 mb-3">所需材料</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-3 py-2 shadow-sm"
                    >
                      <span className="text-sm text-stone-600 font-medium">{ing.name}</span>
                      <span className="text-sm font-bold text-[#5a7064]">{ing.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pinned Items View Modal */}
        {showPinnedView && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-stone-100/95 backdrop-blur-md animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#788e82]" />
                <h2 className="text-lg font-bold text-stone-800">已釘選項目 ({pinnedRecipes.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPinnedRecipes([])}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  全部清除
                </button>
                <button
                  onClick={() => setShowPinnedView(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-stone-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {pinnedRecipesList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400">
                  <Pin className="w-12 h-12 mb-4 opacity-20" />
                  <p>尚未釘選任何項目</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedRecipesList.map(recipe => (
                    <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                      <div className="p-3 flex items-center gap-3 border-b border-stone-100">
                        <div className={cn(
                          "relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border",
                          getItemBackgroundClass(recipe.name)
                        )}>
                          <img 
                            src={recipe.image || `/images/${recipe.name}.png`}
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                            }}
                          />
                          <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center text-stone-400">
                            <ChefHat className="w-6 h-6 opacity-50" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-stone-800 truncate mb-1">{recipe.name}</h3>
                          <div className="flex flex-wrap gap-1">
                            {recipe.mainCategory && (
                              <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{recipe.mainCategory}</span>
                            )}
                            {recipe.subCategory && (
                              <span className="text-xs text-stone-500 border border-stone-300 rounded px-1.5 py-0.5 bg-white">{recipe.subCategory}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePin(recipe.id)}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 bg-stone-50/50 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {recipe.ingredients.map((ing, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1.5 bg-white border border-stone-200 rounded px-2 py-1 shadow-sm"
                            >
                              <span className="text-xs text-stone-600 font-medium">{ing.name}</span>
                              <span className="text-xs font-bold text-[#5a7064]">{ing.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {filteredRecipes.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">找不到符合條件的食譜</p>
          </div>
        )}
          </>
        )}
      </main>

      {/* Floating Action Button for View Toggle */}
      {currentTab === 'browse' && (
        <button
          onClick={() => setViewMode(viewMode === 'card' ? 'thumbnail' : 'card')}
          className="fixed bottom-6 right-6 p-4 bg-[#788e82] text-white rounded-full shadow-lg hover:bg-[#657a6e] transition-all hover:scale-105 active:scale-95 z-40"
          title={viewMode === 'card' ? "切換至縮圖檢視" : "切換至卡片檢視"}
        >
          {viewMode === 'card' ? (
            <ImageIcon className="w-6 h-6" />
          ) : (
            <LayoutGrid className="w-6 h-6" />
          )}
        </button>
      )}
    </div>
  );
}
