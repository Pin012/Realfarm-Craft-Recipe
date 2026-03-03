export interface Ingredient {
  name: string;
  amount: number;
}

export interface Recipe {
  id: string;
  mainCategory: string;
  subCategory: string;
  name: string;
  ingredients: Ingredient[];
  image?: string;
}

export interface CategoryStructure {
  [mainCategory: string]: {
    [subCategory: string]: Recipe[];
  };
}
