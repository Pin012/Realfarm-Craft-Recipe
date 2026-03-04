import { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '@/types';
import { Plus, Trash2, Search, ChefHat, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeMatcherProps {
  recipes: Recipe[];
}

interface OwnedIngredient {
  id: string;
  name: string;
  amount: number;
}

export function RecipeMatcher({ recipes }: RecipeMatcherProps) {
  const [ownedIngredients, setOwnedIngredients] = useState<OwnedIngredient[]>([
    { id: '1', name: '', amount: 1 }
  ]);
  const [matchResults, setMatchResults] = useState<{
    recipe: Recipe;
    missingIngredients: { name: string; amount: number }[];
    matchPercentage: number;
  }[] | null>(null);

  // Get all unique ingredient names for autocomplete
  const allIngredientNames = useMemo(() => {
    const names = new Set<string>();
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        names.add(ing.name);
      });
    });
    return Array.from(names).sort();
  }, [recipes]);

  const handleAddIngredient = () => {
    setOwnedIngredients([
      ...ownedIngredients,
      { id: Date.now().toString(), name: '', amount: 1 }
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ownedIngredients.length > 1) {
      setOwnedIngredients(ownedIngredients.filter(ing => ing.id !== id));
    } else {
      // If it's the last item, just clear the values
      setOwnedIngredients([{ id: id, name: '', amount: 1 }]);
    }
  };

  const handleUpdateIngredient = (id: string, field: 'name' | 'amount', value: string | number) => {
    setOwnedIngredients(ownedIngredients.map(ing => {
      if (ing.id === id) {
        return { ...ing, [field]: value };
      }
      return ing;
    }));
  };

  const handleSearch = () => {
    const results = recipes.map(recipe => {
      let matchCount = 0;
      const missingIngredients: { name: string; amount: number }[] = [];

      recipe.ingredients.forEach(reqIng => {
        const owned = ownedIngredients.find(
          oi => oi.name.trim().toLowerCase() === reqIng.name.trim().toLowerCase()
        );

        if (owned) {
          matchCount++; // Count as a match if the ingredient exists, regardless of amount
          
          if (owned.amount < reqIng.amount) {
            missingIngredients.push({
              name: reqIng.name,
              amount: reqIng.amount - owned.amount
            });
          }
        } else {
          missingIngredients.push({
            name: reqIng.name,
            amount: reqIng.amount
          });
        }
      });

      return {
        recipe,
        missingIngredients,
        matchPercentage: (matchCount / recipe.ingredients.length) * 100
      };
    })
    .filter(result => result.matchPercentage > 0) // Only show recipes with at least one match
    .sort((a, b) => {
      // Sort by missing ingredients count (ascending)
      if (a.missingIngredients.length !== b.missingIngredients.length) {
        return a.missingIngredients.length - b.missingIngredients.length;
      }
      // Then by match percentage (descending)
      return b.matchPercentage - a.matchPercentage;
    });

    setMatchResults(results);
  };

  const getItemBackgroundClass = (name: string) => {
    if (name.includes('美味')) return 'bg-[#e7f1ec] border-[#e7f1ec]';
    if (name.includes('優質')) return 'bg-sky-100 border-sky-100';
    if (name.includes('特製')) return 'bg-purple-100 border-purple-100';
    return 'bg-stone-100 border-stone-100';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-1">
            <ChefHat className="w-6 h-6 text-[#788e82]" />
            食材找食譜
          </h2>
          <p className="text-sm text-stone-500 ml-8">
            不知道今天要煮什麼嗎？輸入手邊現有的食材，讓我們幫您找出可以製作的料理，並自動計算還缺少哪些材料！
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 text-sm font-medium text-stone-500">
            <div className="flex-1 pl-4">材料名稱</div>
            <div className="w-[80px] text-center">數量</div>
            <div className="w-[40px]"></div>
          </div>

          {ownedIngredients.map((ing) => (
            <div key={ing.id} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  list="ingredient-suggestions"
                  value={ing.name}
                  onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                  placeholder="輸入材料名稱..."
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#788e82]/50 transition-all"
                />
              </div>
              
              <div className="w-[80px] relative">
                <select
                  value={ing.amount}
                  onChange={(e) => handleUpdateIngredient(ing.id, 'amount', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#788e82]/50 transition-all text-center appearance-none cursor-pointer"
                >
                  {[...Array(20)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-stone-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => handleRemoveIngredient(ing.id)}
                className="w-[40px] h-[40px] flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={ownedIngredients.length === 1 ? "清空欄位" : "移除此欄位"}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddIngredient}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors font-medium border border-stone-200 border-dashed mt-2"
          >
            <Plus className="w-4 h-4" />
            新增材料
          </button>

          <datalist id="ingredient-suggestions">
            {allIngredientNames.map(name => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="pt-4 border-t border-stone-100 mt-6">
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#788e82] hover:bg-[#657a6e] text-white rounded-lg shadow-md hover:shadow-lg transition-all font-bold active:scale-95"
            >
              <Search className="w-4 h-4" />
              確認查詢
            </button>
          </div>
        </div>
      </div>

      {matchResults && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            比對結果
            <span className="text-sm font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              共 {matchResults.length} 筆
            </span>
          </h3>

          {matchResults.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200 border-dashed">
              <p className="text-stone-500">沒有找到符合的食譜，試試加入更多材料？</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchResults.map(({ recipe, missingIngredients }) => (
                <div 
                  key={recipe.id}
                  className={cn(
                    "bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all hover:shadow-md",
                    missingIngredients.length === 0 ? "border-green-200 ring-1 ring-green-100" : "border-stone-200"
                  )}
                >
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
                      <h3 className="font-bold text-base text-stone-800 truncate flex items-center gap-2 mb-1">
                        {recipe.name}
                        {missingIngredients.length === 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            可製作
                          </span>
                        )}
                      </h3>
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
                      {recipe.ingredients.map((ing, idx) => {
                        const isMissing = missingIngredients.some(m => m.name === ing.name);
                        const missingAmount = missingIngredients.find(m => m.name === ing.name)?.amount;

                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "flex items-center gap-1.5 border rounded px-2 py-1 shadow-sm transition-colors",
                              isMissing 
                                ? "bg-red-50 border-red-200" 
                                : "bg-white border-stone-200"
                            )}
                          >
                            <span className={cn(
                              "text-xs font-medium",
                              isMissing ? "text-red-700" : "text-stone-600"
                            )}>
                              {ing.name}
                            </span>
                            <span className={cn(
                              "text-xs font-bold",
                              isMissing ? "text-red-600" : "text-[#5a7064]"
                            )}>
                              {isMissing ? `缺 ${missingAmount}` : ing.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
