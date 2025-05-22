const fs = require('fs');
const path = require('path');

function generatePrologFacts() {
  const recipeFile = path.join(__dirname, 'data/recipe.csv');
  const replacementFile = path.join(__dirname, 'data/replacement.csv');
  const outputFile = path.join(__dirname, 'recipe.pl');

  // Read and convert recipes
  const recipeLines = fs.readFileSync(recipeFile, 'utf-8').trim().split('\n');
  const recipeFacts = recipeLines.map(line => {
    const [name, ingredientsStr] = line.split(',');
    const ingredients = ingredientsStr
      .split(';')
      .map(i => `'${i.trim()}'`)
      .join(', ');
    return `recipe('${name.trim()}', [${ingredients}]).`;
  });

  // Read and convert replacements
  const replacementLines = fs.readFileSync(replacementFile, 'utf-8').trim().split('\n');
  const replacementFacts = replacementLines.map(line => {
    const [a, b] = line.split(',').map(x => `'${x.trim()}'`);
    return `replacement(${a}, ${b}).`;
  });

  // Combine and write to Prolog file
  const allFacts = [...recipeFacts, '', ...replacementFacts].join('\n');
  fs.writeFileSync(outputFile, allFacts);

  console.log('recipe.pl has been generated from CSV files.');
}

module.exports = { generatePrologFacts };
