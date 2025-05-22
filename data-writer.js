const fs = require('fs');
const path = require('path');

const ingredientFile = path.join(__dirname, 'data/ingredient.csv');
const recipeFile = path.join(__dirname, 'data/recipe.csv');
const replacementFile = path.join(__dirname, 'data/replacement.csv');

// Read ingredients
function readIngredients() {
  if (!fs.existsSync(ingredientFile)) return [];
  return fs.readFileSync(ingredientFile, 'utf-8')
    .split('\n')
    .map(i => i.trim())
    .filter(Boolean);
}

// Read recipes as [{name, ingredients: []}]
function readRecipes() {
  if (!fs.existsSync(recipeFile)) return [];
  return fs.readFileSync(recipeFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, ingStr] = line.split(',');
      const ingredients = ingStr ? ingStr.split(';').map(i => i.trim()).filter(Boolean) : [];
      return { name, ingredients };
    });
}

// Read replacement as [{a, b}]
function readReplacements() {
  if (!fs.existsSync(replacementFile)) return [];
  return fs.readFileSync(replacementFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [a, b] = line.split(',');
      return { a: a.trim(), b: b.trim() };
    });
}

function equalsIgnoreCase(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function arraysEqualIgnoreCase(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].map(i => i.toLowerCase()).sort();
  const sorted2 = [...arr2].map(i => i.toLowerCase()).sort();
  return sorted1.every((v, i) => v === sorted2[i]);
}

// Add new ingredient if not exists (ignore case)
function addIngredient(ingredient) {
  const current = readIngredients();
  const exists = current.some(i => equalsIgnoreCase(i, ingredient));
  if (exists) {
    throw new Error(`Ingredient '${ingredient}' already exists.`);
  }
  fs.appendFileSync(ingredientFile, `${ingredient}\n`, 'utf-8');
  console.log(`Added ingredient: ${ingredient}`);
}

// Add new recipe (check duplicate by name and ingredients ignoring order & case)
function addRecipe(name, ingredients) {
  const recipes = readRecipes();

  const duplicate = recipes.find(r =>
    equalsIgnoreCase(r.name, name) &&
    arraysEqualIgnoreCase(r.ingredients, ingredients)
  );

  if (duplicate) {
    throw new Error(`Recipe '${name}' already exists.`);
  }

  const line = `${name},${ingredients.join(';')}\n`;
  fs.appendFileSync(recipeFile, line, 'utf-8');
  console.log(`Added recipe: ${name} with ingredients [${ingredients.join(', ')}]`);
}

// Add replacement pair (check reversible duplicates ignoring case), throw error if exists
function addReplacement(ingredientA, ingredientB) {
  const replacements = readReplacements();

  const exists = replacements.some(r =>
    (equalsIgnoreCase(r.a, ingredientA) && equalsIgnoreCase(r.b, ingredientB)) ||
    (equalsIgnoreCase(r.a, ingredientB) && equalsIgnoreCase(r.b, ingredientA)) ||
    equalsIgnoreCase(ingredientA, ingredientB)
  );

  if (exists) {
    throw new Error(`Replacement pair '${ingredientA} <-> ${ingredientB}' already exists.`);
  }

  const line = `${ingredientA},${ingredientB}\n`;
  fs.appendFileSync(replacementFile, line, 'utf-8');
  console.log(`Added replacement: ${ingredientA} <-> ${ingredientB}`);
}

module.exports = { addIngredient, addRecipe, addReplacement };
