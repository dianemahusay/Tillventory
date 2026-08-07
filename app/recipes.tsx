import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { ID, Models, Query } from "react-native-appwrite";
import { databases } from "../services/appwrite";
import { getProducts } from "../services/productsCache";

const DATABASE_ID = "6a694ca9001b95d71b14";
const RECIPE_COLLECTION_ID = "recipe";
const PRODUCTS_COLLECTION_ID = "products";
const MENU_COLLECTION_ID = "menu_items";

export interface ProductItem extends Models.Document {
  product_name: string;
  unit: string;
  restock_unit?: string;
  conversion_factor?: number;
  quantity?: number;
}

export interface MenuItemRef extends Models.Document {
  item_name: string;
  price: number;
  category: string;
}

export interface RecipeIngredient extends Models.Document {
  amount: string;
  menu_items_Id: MenuItemRef;
  products_id: ProductItem;
}

interface FormIngredientRow {
  productId?: string;
  name: string;
  amount: string;
  unit: string;
}

export default function RecipesScreen() {
  const [showBottomCard, setShowBottomCard] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [menuItems, setMenuItems] = useState<MenuItemRef[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);

  const [selectedMenuDocId, setSelectedMenuDocId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("Drinks");
  const [ingredientsList, setIngredientsList] = useState<FormIngredientRow[]>([]);

  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [showProductPicker, setShowProductPicker] = useState<boolean>(false);
  const [customProductName, setCustomProductName] = useState<string>("");

  const [showUnitSetupModal, setShowUnitSetupModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>("");
  const [newRecipeUnit, setNewRecipeUnit] = useState<string>("shot");
  const [newRestockUnit, setNewRestockUnit] = useState<string>("bottle");
  const [newConversionFactor, setNewConversionFactor] = useState<string>("30");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [menuRes, productsList] = await Promise.all([
        databases.listDocuments(DATABASE_ID, MENU_COLLECTION_ID),
        getProducts(databases),
      ]);

      setMenuItems(menuRes.documents as unknown as MenuItemRef[]);
      setAvailableProducts(productsList as unknown as ProductItem[]);
    } catch (error) {
      console.error("Error loading recipe screen data:", error);
      Alert.alert("Error", "Could not fetch data from Appwrite.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadInitialData();
  }, []);

  const handleItemSelect = async (menuDocId: string | null) => {
    if (!menuDocId) {
      // FIX #1 & #2: Reset form explicitly and add 1 default row ready to use
      setSelectedMenuDocId(null);
      setActiveTitle("");
      setPrice("");
      setCategory("Drinks");
      setIngredientsList([{ name: "", amount: "", unit: "g" }]);
      setShowBottomCard(true);
      return;
    }

    const selectedItem = menuItems.find((item) => item.$id === menuDocId);
    if (!selectedItem) return;

    setSelectedMenuDocId(selectedItem.$id);
    setActiveTitle(selectedItem.item_name);
    setPrice(String(selectedItem.price || ""));
    setCategory(selectedItem.category || "Drinks");

    try {
      // 1. Fetch recipe rows for this menu item
      // Try both casing styles (menu_items_Id or menu_items_id) if needed
      const recipeRes = await databases.listDocuments(
        DATABASE_ID,
        RECIPE_COLLECTION_ID,
        [Query.equal("menu_items_Id", selectedItem.$id)]
      );

      console.log("Fetched Recipe Rows:", JSON.stringify(recipeRes.documents, null, 2));

      if (recipeRes.documents.length === 0) {
        // No ingredients linked to this menu item yet
        setIngredientsList([{ name: "", amount: "", unit: "g" }]);
        setShowBottomCard(true);
        return;
      }

      // 2. Map and resolve ingredients (handles populated object OR direct product ID string)
      const formattedIngredients: FormIngredientRow[] = await Promise.all(
        recipeRes.documents.map(async (doc: any) => {
          let productObj: ProductItem | null = null;

          // If products_id is an expanded object from Appwrite
          if (typeof doc.products_id === "object" && doc.products_id !== null) {
            productObj = doc.products_id as ProductItem;
          } 
          // If products_id is just a string ID, fetch the product document directly
          else if (typeof doc.products_id === "string" && doc.products_id) {
            // Try to resolve from the cached availableProducts list first
            productObj = availableProducts.find((p) => p.$id === doc.products_id) || null;
            if (!productObj) {
              try {
                const pDoc = await databases.getDocument(
                  DATABASE_ID,
                  PRODUCTS_COLLECTION_ID,
                  doc.products_id
                );
                productObj = pDoc as unknown as ProductItem;
              } catch (e) {
                console.error("Could not fetch product for ID:", doc.products_id);
              }
            }
          }

          return {
            productId: productObj?.$id || (typeof doc.products_id === "string" ? doc.products_id : undefined),
            name: productObj?.product_name || "Unknown Product",
            amount: String(doc.amount || doc.quantity || "1"),
            unit: productObj?.unit || "g",
          };
        })
      );

      setIngredientsList(
        formattedIngredients.length > 0
          ? formattedIngredients
          : [{ name: "", amount: "", unit: "g" }]
      );
      setShowBottomCard(true);
    } catch (error) {
      console.error("Failed to load recipe ingredients:", error);
      Alert.alert("Error", "Could not load recipe details.");
    }
  };

  const handleTextChange = (index: number, field: keyof FormIngredientRow, value: string) => {
    setIngredientsList((prev) => {
      const cloned = [...prev];
      if (!cloned[index]) return prev;
      cloned[index] = { ...cloned[index], [field]: value };
      return cloned;
    });
  };

  const handleRemoveItem = (index: number) => {
    setIngredientsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewRow = () => {
    setIngredientsList((prev) => [...prev, { name: "", amount: "", unit: "g" }]);
  };

  const handleSelectProductFromPicker = (product: ProductItem) => {
    if (pickerIndex === null) return;

    setIngredientsList((prev) => {
      const cloned = [...prev];
      if (!cloned[pickerIndex]) return prev;

      cloned[pickerIndex] = {
        productId: product.$id,
        name: product.product_name,
        amount: cloned[pickerIndex].amount || "1",
        unit: product.unit || "g",
      };
      return cloned;
    });

    setShowProductPicker(false);
    setPickerIndex(null);
  };

  // Replaces handleCreateCustomProduct
  const handleAddNewProductQuick = () => {
    const trimmedName = customProductName.trim();
    if (!trimmedName || pickerIndex === null) {
      Alert.alert("Error", "Please enter a product name.");
      return;
    }

    // Check if product already exists to prevent duplicates
    const existing = availableProducts.find(
      (p) => p.product_name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      Alert.alert(
        "Product Exists",
        `"${existing.product_name}" is already in your inventory list! Selecting it now...`
      );
      handleSelectProductFromPicker(existing);
      setCustomProductName("");
      return;
    }

    // Open the Unit & Conversion Setup step
    setNewProdName(trimmedName);
    setShowProductPicker(false);
    setShowUnitSetupModal(true);
  };

  const handleSaveNewProductToDatabase = async () => {
    if (!newProdName.trim() || pickerIndex === null) return;

    const convRate = parseFloat(newConversionFactor) || 1;

    try {
      setIsSaving(true);

      // 1. Save new Product document in Appwrite
      const newProdDoc = await databases.createDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        ID.unique(),
        {
          product_name: newProdName.trim(),
          unit: newRecipeUnit.trim() || "g",
          restock_unit: newRestockUnit.trim() || "pcs",
          conversion_factor: convRate,
          quantity: 0, // Starts at 0 until restocked
        }
      );

      const createdProduct = newProdDoc as unknown as ProductItem;

      // 2. Refresh local available products list
      setAvailableProducts((prev) => [...prev, createdProduct]);

      // 3. Attach new product directly to the active recipe ingredient row
      setIngredientsList((prev) => {
        const cloned = [...prev];
        if (!cloned[pickerIndex]) return prev;

        cloned[pickerIndex] = {
          productId: createdProduct.$id,
          name: createdProduct.product_name,
          amount: cloned[pickerIndex].amount || "1",
          unit: createdProduct.unit || "g",
        };
        return cloned;
      });

      // 4. Close modals and clear input states
      setShowUnitSetupModal(false);
      setShowProductPicker(false);
      setCustomProductName("");
      setPickerIndex(null);

      Alert.alert("Product Added", `"${createdProduct.product_name}" added to inventory and recipe!`);
    } catch (error: any) {
      console.error("Error creating new product:", error);
      Alert.alert("Error", error?.message || "Could not save new product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRecipe = async () => {
    const trimmedTitle = activeTitle.trim();
    if (!trimmedTitle) {
      Alert.alert("Error", "Please enter a recipe title.");
      return;
    }

    if (!price || isNaN(Number(price))) {
      Alert.alert("Error", "Please enter a valid selling price.");
      return;
    }

    setIsSaving(true);

    try {
      let menuDocId = selectedMenuDocId;

      if (!menuDocId) {
        const newMenuDoc = await databases.createDocument(
          DATABASE_ID,
          MENU_COLLECTION_ID,
          ID.unique(),
          {
            item_name: trimmedTitle,
            price: parseFloat(price),
            category: category,
          }
        );
        menuDocId = newMenuDoc.$id;
      } else {
        await databases.updateDocument(
          DATABASE_ID,
          MENU_COLLECTION_ID,
          menuDocId,
          {
            item_name: trimmedTitle,
            price: parseFloat(price),
            category: category,
          }
        );

        const existingRecipes = await databases.listDocuments(
          DATABASE_ID,
          RECIPE_COLLECTION_ID,
          [Query.equal("menu_items_Id", menuDocId)]
        );

        for (const doc of existingRecipes.documents) {
          await databases.deleteDocument(DATABASE_ID, RECIPE_COLLECTION_ID, doc.$id);
        }
      }

      for (const ing of ingredientsList) {
        if (!ing.name.trim() || !ing.productId) continue;

        const parseAmount = (val: string): number => {
          if (val.includes("/")) {
            const [numerator, denominator] = val.split("/").map(Number);
            if (denominator && !isNaN(numerator) && !isNaN(denominator)) {
              return numerator / denominator;
            }
          }
          return parseFloat(val) || 0;
        };

        await databases.createDocument(
          DATABASE_ID,
          RECIPE_COLLECTION_ID,
          ID.unique(),
          {
            menu_items_Id: menuDocId,
            products_id: ing.productId,
            amount: ing.amount.trim() || "1",
          }
        );
      }
    
      Alert.alert("Success", `Recipe for "${trimmedTitle}" saved successfully!`);
      setShowBottomCard(false);
      loadInitialData();
    } catch (error) {
      console.error("Failed to save recipe:", error);
      Alert.alert("Error", "Failed to save recipe to Appwrite.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = (menuDocId: string, title: string) => {
    Alert.alert("Delete Recipe", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await databases.deleteDocument(DATABASE_ID, MENU_COLLECTION_ID, menuDocId);
            Alert.alert("Deleted", `"${title}" removed.`);
            setShowBottomCard(false);
            loadInitialData();
          } catch (error) {
            console.error("Failed to delete recipe:", error);
            Alert.alert("Error", "Could not delete recipe.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }} className="bg-background pt-20">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 360, paddingTop: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-4">
          <Text className="text-4xl font-heading pb-2 border-b border-neutral-400">Cafe Uno</Text>
        </View>

        {/* FIX #1: Pass `null` instead of "New Recipe" string */}
        <TouchableOpacity
          onPress={() => handleItemSelect(null)}
          className="w-full bg-accent py-3.5 rounded-xl items-center justify-center mb-6"
        >
          <Text className="text-white text-md font-bodyBold">+ Create New Recipe</Text>
        </TouchableOpacity>

        <Text className="text-sm text-neutral-400 font-body mb-4">
          Tap an item to see what it uses from stock.
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#171717" className="py-10" />
        ) : (
          <View className="w-full gap-y-1">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.$id}
                onPress={() => handleItemSelect(item.$id)}
                onLongPress={() => handleDeleteRecipe(item.$id, item.item_name)}
                className="w-full py-4 border-b border-neutral-800 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-lg text-neutral-900 font-bodyBold">{item.item_name}</Text>
                  <Text className="text-xs font-body text-neutral-400 mt-0.5">
                    Category: {item.category || "General"} • ₱{Number(item.price || 0).toFixed(2)}
                  </Text>
                </View>
                <Text className="text-xl text-neutral-800 font-bodyBold">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/owner-dash")}
          className="mt-8 self-center"
        >
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FIX #3: Added zIndex to guarantee overlay positioning */}
      {showBottomCard && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ zIndex: 50 }}
          className="absolute bottom-0 left-0 right-0"
        >
          <View className="bg-neutral-200/95 rounded-t-[38px] p-8 pb-10 border-t border-neutral-300 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bodyBold text-neutral-900">
                {selectedMenuDocId ? "Edit Recipe" : "New Recipe"}
              </Text>
              <TouchableOpacity onPress={() => setShowBottomCard(false)}>
                <Text className="text-2xl text-neutral-900 font-bodyBold px-2">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-y-3 mb-4">
              <TextInput
                value={activeTitle}
                onChangeText={setActiveTitle}
                placeholder="Recipe / Drink Name"
                placeholderTextColor="#bbb2b2"
                className="w-full h-11 bg-white border border-neutral-300 rounded-xl px-3 text-md font-bodyBold text-neutral-800"
              />

              <View className="flex-row gap-x-2">
                <TextInput
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Price (₱)"
                  placeholderTextColor="#bbb2b2"
                  className="w-[48%] h-11 bg-white border border-neutral-300 rounded-xl px-3 text-md font-body text-neutral-800"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-1 py-1">
                  {["Drinks", "Foods", "Pastries"].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-xl border border-neutral-800 justify-center ${
                        category === cat ? "bg-neutral-900" : "bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bodyBold ${
                          category === cat ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text className="text-xs font-bodyBold text-neutral-500 mb-2">INGREDIENTS REQUIRED</Text>

            <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ gap: 10 }} className="mb-4">
              {ingredientsList.map((ing, idx) => (
                <View key={idx} className="flex-row justify-between items-center w-full gap-x-2">
                  <TouchableOpacity
                    onPress={() => {
                      setPickerIndex(idx);
                      setShowProductPicker(true);
                    }}
                    className="w-[50%] h-11 bg-white border border-neutral-300 rounded-xl px-3 justify-center"
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-sm font-body ${ing.name ? "text-neutral-900" : "text-neutral-400"}`}
                    >
                      {ing.name || "Select Product"}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    keyboardType="numeric"
                    value={ing.amount}
                    onChangeText={(val) => handleTextChange(idx, "amount", val)}
                    placeholder="Qty"
                    placeholderTextColor="#bbb2b2"
                    className="w-[22%] h-11 bg-white border border-neutral-300 rounded-xl px-3 text-md font-bodyBold text-neutral-900"
                  />

                  <TextInput
                    value={ing.unit}
                    onChangeText={(val) => handleTextChange(idx, "unit", val)}
                    placeholder="unit"
                    placeholderTextColor="#bbb2b2"
                    className="w-[15%] h-11 bg-white border border-neutral-300 rounded-xl px-2 text-xs font-body text-neutral-800 text-center"
                  />

                  <TouchableOpacity
                    onPress={() => handleRemoveItem(idx)}
                    className="w-[8%] h-11 justify-center items-center active:opacity-50"
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
              <Text className="text-md text-neutral-800 font-bodyBold">+ Add Ingredient Row</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSaving}
              onPress={handleSaveRecipe}
              className={`w-full py-3.5 rounded-xl items-center justify-center ${
                isSaving ? "bg-neutral-400" : "bg-accent"
              }`}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-md font-bodyBold">Save Recipe</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* --- SELECT INGREDIENT / PRODUCT PICKER MODAL --- */}
      <Modal visible={showProductPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 h-[60%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bodyBold text-neutral-900">Select Ingredient Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Text className="text-xl font-bodyBold text-neutral-700">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 pb-4 border-b border-neutral-200 flex-row gap-x-2">
              <TextInput
                value={customProductName}
                onChangeText={setCustomProductName}
                placeholder="Or type new product name..."
                placeholderTextColor="#bbb2b2"
                className="flex-1 h-11 bg-neutral-100 border border-neutral-300 rounded-xl px-3 text-sm font-body"
              />
              <TouchableOpacity
                onPress={handleAddNewProductQuick}
                className="bg-neutral-900 px-4 justify-center rounded-xl"
              >
                <Text className="text-white text-xs font-bodyBold">Add New</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableProducts}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectProductFromPicker(item)}
                  className="py-3 px-2 border-b border-neutral-100 flex-row justify-between items-center"
                >
                  <Text className="text-base font-body text-neutral-800">{item.product_name}</Text>
                  <Text className="text-xs font-body text-neutral-400">Unit: {item.unit || "g"}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-center text-neutral-400 font-body py-6">
                  No registered products found. Type a name above to add one!
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
      {/* --- CONFIGURE NEW PRODUCT UNITS SUB-MODAL --- */}
      <Modal visible={showUnitSetupModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "position"}
          keyboardVerticalOffset={0}
          enabled
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.38)" }}>
              <View style={{ width: "100%", position: "absolute", bottom: 0, left: 0, right: 0 }} className="bg-white rounded-t-[32px] px-6 pt-6 pb-4">
                <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-200">
                  <View>
                    <Text className="text-lg font-bodyBold text-neutral-900">Configure Ingredient Units</Text>
                    <Text className="text-xs font-body text-neutral-500">Item: {newProdName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowUnitSetupModal(false)}>
                    <Text className="text-xl font-bodyBold text-neutral-700">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-y-3 mb-6">
                  <View>
                    <Text className="text-xs font-bodyBold text-neutral-800 mb-1">Recipe / Usage Unit</Text>
                    <TextInput
                      value={newRecipeUnit}
                      onChangeText={setNewRecipeUnit}
                      placeholder="e.g. shot, cup, tbsp, g"
                      placeholderTextColor="#bbb2b2"
                      className="w-full h-11 bg-neutral-100 border border-neutral-300 rounded-xl px-3 text-sm font-body text-neutral-900"
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-bodyBold text-neutral-800 mb-1">Restock / Packaging Unit</Text>
                    <TextInput
                      value={newRestockUnit}
                      onChangeText={setNewRestockUnit}
                      placeholder="e.g. bottle, carton, pack, bag"
                      placeholderTextColor="#bbb2b2"
                      className="w-full h-11 bg-neutral-100 border border-neutral-300 rounded-xl px-3 text-sm font-body text-neutral-900"
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-bodyBold text-neutral-800 mb-1">
                      Yield ({newRecipeUnit || "recipe units"} per 1 {newRestockUnit || "package"})
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={newConversionFactor}
                      onChangeText={setNewConversionFactor}
                      placeholder="30"
                      placeholderTextColor="#bbb2b2"
                      className="w-full h-11 bg-neutral-100 border border-neutral-300 rounded-xl px-3 text-sm font-bodyBold text-neutral-900"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isSaving}
                  onPress={handleSaveNewProductToDatabase}
                  className="w-full bg-accent py-3.5 rounded-xl items-center justify-center"
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-md font-bodyBold">Save Ingredient to Stock</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}