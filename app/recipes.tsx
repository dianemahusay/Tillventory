import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  title: string;
  ingredients: Ingredient[];
}

const initialRecipes: Recipe[] = [
  {
    title: "Caramel Machiatto",
    ingredients: [
      { name: "Full Milk", amount: "0.9" },
      { name: "Caramel Syrup", amount: "0.02" },
      { name: "Espresso", amount: "0.9" },
    ],
  },
  {
    title: "Sea Salt Latte",
    ingredients: [
      { name: "Full Milk", amount: "0.8" },
      { name: "Sea Salt Cream", amount: "0.1" },
      { name: "Espresso", amount: "0.9" },
    ],
  },
  {
    title: "Parmesan Fried Chicken",
    ingredients: [
      { name: "Chicken Breast", amount: "1.0" },
      { name: "Parmesan Powder", amount: "0.05" },
      { name: "Frying Oil", amount: "0.2" },
    ],
  },
  {
    title: "Ham and Cheese Sandwich",
    ingredients: [
      { name: "Sliced Bread", amount: "2.0" },
      { name: "Sanded Ham", amount: "1.0" },
      { name: "Cheddar Cheese", amount: "1.0" },
    ],
  },
];

export default function RecipesScreen() {
  const [showBottomCard, setShowBottomCard] = useState(false);
  const [activeTitle, setActiveTitle] = useState("Caramel Machiatto");
  const [editingRecipeTitle, setEditingRecipeTitle] = useState<string | null>("Caramel Machiatto");
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>(initialRecipes[0].ingredients);

  const handleItemSelect = (title: string) => {
    if (title === "New Recipe") {
      setEditingRecipeTitle(null);
      setActiveTitle("");
      setIngredientsList([]);
    } else {
      const selectedRecipe = recipes.find((recipe) => recipe.title === title);
      if (selectedRecipe) {
        setEditingRecipeTitle(selectedRecipe.title);
        setActiveTitle(selectedRecipe.title);
        setIngredientsList(selectedRecipe.ingredients);
      }
    }

    setShowBottomCard(true);
  };

  const handleTextChange = (index: number, field: keyof Ingredient, value: string) => {
    setIngredientsList((prev) => {
      const cloned = [...prev];
      cloned[index] = { ...cloned[index], [field]: value };
      return cloned;
    });
  };

  const handleRemoveItem = (index: number) => {
    setIngredientsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewRow = () => {
    setIngredientsList((prev) => [...prev, { name: "", amount: "" }]);
  };

  const handleDeleteRecipe = (title: string) => {
    Alert.alert("Delete recipe", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setRecipes((prev) => prev.filter((recipe) => recipe.title !== title));
          if (editingRecipeTitle === title) {
            setShowBottomCard(false);
            setEditingRecipeTitle(null);
            setActiveTitle("");
            setIngredientsList([]);
          }
        },
      },
    ]);
  };

  const handleSaveRecipe = () => {
    const trimmedTitle = activeTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    const normalizedIngredients = ingredientsList.filter(
      (ingredient) => ingredient.name.trim() || ingredient.amount.trim()
    );

    const recipeToSave: Recipe = {
      title: trimmedTitle,
      ingredients: normalizedIngredients,
    };

    setRecipes((prev) => {
      if (editingRecipeTitle) {
        const existingIndex = prev.findIndex((recipe) => recipe.title === editingRecipeTitle);
        if (existingIndex >= 0) {
          const nextRecipes = [...prev];
          nextRecipes[existingIndex] = recipeToSave;
          return nextRecipes;
        }
      }

      const existingIndex = prev.findIndex((recipe) => recipe.title === trimmedTitle);
      if (existingIndex >= 0) {
        const nextRecipes = [...prev];
        nextRecipes[existingIndex] = recipeToSave;
        return nextRecipes;
      }

      return [recipeToSave, ...prev];
    });

    setEditingRecipeTitle(trimmedTitle);
    setShowBottomCard(false);
  };

  return (
    <View style={{ flex: 1 }} className="bg-background pt-20">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 360, paddingTop: 20 }}>
        <View className="mb-4">
          <Text className="text-4xl font-heading pb-2 border-b border-neutral-400">Cafe Uno</Text>
        </View>

        <TouchableOpacity 
          onPress={() => handleItemSelect("New Recipe")}
          className="w-full bg-accent py-3.5 rounded-xl items-center justify-center mb-6"
        >
          <Text className="text-white text-md font-bodyBold">+ Create New Recipe</Text>
        </TouchableOpacity>

        <Text className="text-sm text-neutral-400 font-body mb-4">
          Tap an item to see what it uses from stock.
        </Text>

        <View className="w-full gap-y-1">
          {recipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.title}
              onPress={() => handleItemSelect(recipe.title)}
              onLongPress={() => handleDeleteRecipe(recipe.title)}
              className="w-full py-4 border-b border-neutral-800 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-lg text-neutral-900 font-bodyBold">{recipe.title}</Text>
                <Text className="text-xs font-body text-neutral-400 mt-0.5">
                  {recipe.ingredients.length} Ingredients
                </Text>
              </View>
              <Text className="text-xl text-neutral-800 font-bodyBold">→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/owner-dash")}
          className="mt-8 self-center"
        >
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showBottomCard && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute bottom-0 left-0 right-0"
        >
          <View className="bg-neutral-200/95 rounded-t-[38px] p-8 pb-10 border-t border-neutral-300 shadow-lg">
            <View className="flex-row justify-between items-center mb-5">
              <TextInput
                value={activeTitle}
                onChangeText={setActiveTitle}
                placeholder="Recipe Title"
                placeholderTextColor="#bbb2b2"
                className="w-[80%] h-11 bg-onAccent border border-neutral-300 rounded-xl px-3 text-md font-bodyBold text-neutral-800"
              />
              <TouchableOpacity onPress={() => setShowBottomCard(false)}>
                <Text className="text-2xl text-neutral-900 font-bodyBold px-2">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ gap: 10 }} className="mb-4">
              {ingredientsList.map((ing, idx) => (
                <View key={idx} className="flex-row justify-between items-center w-full">
                  <TextInput
                    value={ing.name}
                    onChangeText={(val) => handleTextChange(idx, "name", val)}
                    placeholder="Ingredient"
                    className="w-[50%] h-11 bg-onAccent border border-neutral-300 rounded-xl px-3 text-md font-body text-neutral-800"
                  />
                  <TextInput
                    keyboardType="numeric"
                    value={ing.amount}
                    onChangeText={(val) => handleTextChange(idx, "amount", val)}
                    placeholder="0.0"
                    className="w-[34%] h-11 bg-onAccent border border-neutral-300 rounded-xl px-3 text-md font-bodyBold text-neutral-900"
                  />
                  <TouchableOpacity 
                    onPress={() => handleRemoveItem(idx)}
                    className="w-[10%] h-11 justify-center items-center active:opacity-50"
                  >
                    <Text className="text-red-600 text-lg font-bodyBold">🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              onPress={handleAddNewRow}
              className="w-full bg-neutral-300/80 py-3 rounded-xl items-center active:bg-neutral-300 mb-3"
            >
              <Text className="text-md text-neutral-800 font-bodyBold">+ Add Ingredients</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSaveRecipe}
              className="w-full bg-accent py-3.5 rounded-xl items-center justify-center"
            >
              <Text className="text-white text-md font-bodyBold">Save Recipe</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
