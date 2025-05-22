const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { generatePrologFacts } = require('./data-pl');
const { addIngredient, addRecipe, addReplacement } = require('./data-writer');

const app = express();
const PORT = 3000;

generatePrologFacts();

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/add-ingredient', (req, res) => {
  const { ingredient } = req.body;
  if (!ingredient || typeof ingredient !== 'string') {
    return res.status(400).json({ error: 'Vui lòng thêm tên nguyên liệu' });
  }

  try {
    addIngredient(ingredient.trim());
    res.json({ message: `Đã thêm nguyên liệu: '${ingredient}'.` });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: `Nguyên liệu '${ingredient}' đã tồn tại.` });
    }
    console.error(err);
    res.status(500).json({ error: 'Không thể thêm nguyên liệu' });
  }
});

app.post('/add-recipe', (req, res) => {
  const { name, ingredients } = req.body;
  if (!name || typeof name !== 'string' || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Định dạng công thức sai.' });
  }

  try {
    addRecipe(name.trim(), ingredients.map(i => i.trim()));
    generatePrologFacts();
    res.json({ message: `Đã thêm công thức '${name}' với nguyên liệu [${ingredients.join(', ')}].` });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: `Công thức đã tồn tại.` });
    }
    console.error(err);
    res.status(500).json({ error: 'Không thể thêm công thức' });
  }
});

app.post('/add-replacement', (req, res) => {
  const { ingredientA, ingredientB } = req.body;
  if (!ingredientA || !ingredientB || typeof ingredientA !== 'string' || typeof ingredientB !== 'string') {
    return res.status(400).json({ error: 'Định dạng nguyên liệu sai.' });
  }

  try {
    addReplacement(ingredientA.trim(), ingredientB.trim());
    generatePrologFacts();
    res.json({ message: `Đã thêm cặp thay thế: '${ingredientA}' <-> '${ingredientB}'.` });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: `Cặp thay thế '${ingredientA}' <-> '${ingredientB}' đã tồn tại.` });
    }
    console.error(err);
    res.status(500).json({ error: 'Không thể thêm cặp thay thế' });
  }
});

app.get('/ingredients', (req, res) => {
  const ingredientFile = path.join(__dirname, 'data/ingredient.csv');
  const data = fs.readFileSync(ingredientFile, 'utf-8');
  const ingredients = data.trim().split('\n').map(i => i.trim());
  res.json(ingredients);
});


app.post('/suggest', (req, res) => {
  const ingredients = req.body.ingredients;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Không có nguyên liệu nào.' });
  }

  const quotedIngredients = ingredients.map(i => `'${i}'`).join(', ');
  const prologList = `[${quotedIngredients}]`;

  const goal = `consult('recipe.pl'), consult('recipe_logic.pl'), all_suggested_recipes(${prologList}, L), write(L), nl, halt.`;
  const command = `swipl -q -g "${goal}"`;

  exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error('Prolog error:', stderr);
    return res.status(500).send('Prolog execution failed.');
  }

  const output = stdout.toString().trim();

  const regex = /recipe_with_ingredients\(([^,]+),\[(.*?)\]\)/g;
  const results = [];
  let match;

  while ((match = regex.exec(output)) !== null) {
    const recipe = match[1].trim();
    const ingredientsStr = match[2].trim();

    const ingredients = ingredientsStr.length > 0
      ? ingredientsStr.split(',').map(i => i.trim())
      : [];

    results.push({ recipe, ingredients });
  }
  console.log(output)
  res.json(results);
  });

});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
