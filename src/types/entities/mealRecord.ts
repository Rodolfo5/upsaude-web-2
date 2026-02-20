export interface FoodItem {
  id: string
  name: string
  portion: number
  portionUnit: 'g' | 'ml'
  kcal: number
}

export interface MenuMealRecordEntry {
  mealType: string
  followedMenu: boolean
  kcal: number
  imageUrl: string
  description?: string
  foods: FoodItem[]
}

export interface MenuMealRecordEntity {
  id: string // formato dd-mm-aaaa
  menuId: string
  date: Date | string
  meals: MenuMealRecordEntry[]
  createdAt: Date | string
  updatedAt: Date | string
}
