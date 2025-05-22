# LAB 2 - SE334: PROGRAMMING PARADIGMS - UIT, VNUHCM

### Project Information
* **Name**: RECIPE SUGGESTION SYSTEM
* **Author**: Huynh Le Dan Linh - 22520759
* **Instructor**: PhD. Nguyen Duy Khanh

### Submission
* **GitHub Repository**: [reciperecommendation](https://github.com/DanLinhHuynh-Niwashi/reciperecommendation)
* **Demo**: [Demo video](https://youtu.be/fbyNX44NJ6A)
* **Acknowledgement**: The project utilized ChatGPT to support UI arrangement and CSS, code refactoring, recipe generation, as well as documentation.

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Usage Guidelines](#usage-guidelines)
4. [System, Data Design and Logic Highlights](#system-data-design-and-logic-highlights)
   * [Architecture](#architecture)
   * [Data Design](#data-design)
   * [Logic Flow](#logic-flow)
5. [Application Screen Captures](#application-screen-captures)

## OVERVIEW
The Recipe Suggestion System is a web application that allows users to find suitable recipes based on their home ingredients. The system uses **Prolog** for logic-based inference and **Node.js** to bridge the frontend and backend.

* The application has been enhanced to support:

  * More complex recipes: Added diverse dishes.
  * Ingredient substitution rules: Users can substitute ingredients in recipes (e.g., replace chicken with beef), and the system will automatically adjust the recipe.
  * User-driven customization: Users can add new ingredients, new recipes, and define custom substitution rules.

* **Technologies**:

  * Prolog (Swipl)
  * Node.js
  * HTML, CSS, JavaScript
 
## FEATURES

| **Feature**                 | **Description**                                                             |
| --------------------------- | --------------------------------------------------------------------------- |
| Ingredient-based Suggestion | Suggests recipes based on the list of ingredients input by the user.        |
| Ingredient substitution     | Supports intelligent substitution (e.g., beef ↔ chicken, tofu ↔ mushrooms). |
| Add New Recipe              | Users can input custom recipes with ingredients.           |
| Add New Ingredient          | Expand the internal knowledge base with user-defined ingredients.           |
| Define Substitutions        | Users can define equivalence between ingredients for flexible suggestions.  |

## USAGE GUIDELINES
> **&#9432;** **NOTES**
>* The data used by the system is strictly structured in .csv files.
>* Do not manually modify these files unless necessary.
>* Prefer using the in-app UI tools to manage ingredients, recipes, and substitution rules. If you must edit the files manually, ensure that the structure and format remain consistent with the application's expected schema to avoid errors.

1. Download all the required packages by typing:
   ```bash
   npm install
   ```
2. On your terminal, start the server with:
   ```bash
   node app.js
   ```
3. Open your browser and go to:
   `http://localhost:3000`
4. Enjoy the application!

---
## SYSTEM, DATA DESIGN AND LOGIC HIGHLIGHTS
### Architecture
<p align="center">
  <img src="https://github.com/user-attachments/assets/2e4cf661-ae64-44dc-bdd4-0e06dc103501" alt="Recipe Page"/>
</p>

* Frontend: Displays UI for users to interact with.
* Backend (Node.js):
  * Receives requests from the frontend.
  * Spawns a child process to run the Prolog engine.
  * Sends queries to Prolog via stdin.
  * Reads results from stdout and returns them to the frontend.
* Logic Engine (Prolog):
  * Contains the core logic for recipe matching, substitutions, etc.

### Data Design
The application reads data from structured `.csv` files at startup. These files are used to dynamically:

* Generate **Prolog facts** for reasoning.
* Render the **UI** for ingredient selection and recipe display.

All data is loaded via UI tools to minimize input errors. Manual modification of these files is discouraged unless format integrity is preserved.

#### **1. ingredient.csv**

```bash
muc
toi
ot
muoi
tieu
dau an
tom
nuoc mam
```

* **Purpose**: Contains the list of available ingredients.
* **Usage**: Ingredients are displayed as interactive cards in the UI to guide user selection and avoid input mistakes.
* Each line represents a single ingredient.

#### **2. recipe.csv**
* **Format**: `RecipeName, ingredient1;ingredient2;...;ingredientN`
```bash
Muc xao, muc;toi;ot;muoi;tieu;dau an
Tom rim, tom;nuoc mam;duong;toi;ot
Ga nuong, thit ga;hanh;toi;ot;muoi;tieu;dau an
Banh mi kep, banh mi;thit bo;hanh;rau thom;tuong;ot
Com chien trung, com;trung;hanh tay;toi;muoi;tieu;dau an
```

* **Purpose**: Defines recipes and their required ingredients.
* **Usage**:

  * Automatically converted into **Prolog facts** (e.g. `recipe('Muc xao', ['muc', 'toi', 'ot', 'muoi', 'tieu', 'dau an']).`)
  * Users can add their own recipe rules via the UI.

#### **3. replacement.csv**

```bash
muc,tom
toi,hanh tay
ot,sa te
muoi,nuoc mam
tieu,ot
dau an,dau me
thit ga,thit bo
```

* **Purpose**: Defines pairs of **substitutable ingredients**.
* **Usage**:
  * Automatically converted into **Prolog facts** (e.g. `replacement('muc', 'tom').`)
  * Users can add their own substitution rules via the UI.

### Logic Flow

**Step 1.** User provides a list of available ingredients.
**Step 2.** Retrieve the list of required ingredients.
**Step 3.** For each required ingredient, create a list of possible usable ingredients (original + replacements).
* Extended replacement up to 2 steps (e.g. `thit ga ↔ thit bo, thit bo ↔ thit heo => thit ga ↔ thit heo`)
* Get a list of required + replacable ingredients

```prolog
% Direct bidirectional replacement
are_replacements(X, Y) :-
    (replacement(X, Y); replacement(Y, X)),
    X \= Y.

% The replacement can be extended up to 2 steps
are_replacements(X, Y) :-
    (replacement(X, Z); replacement(Z, X)),
    (replacement(Z, Y); replacement(Y, Z)),
    X \= Y,
    X \= Z,
    Y \= Z.
```
```prolog
UsedOptionsList = [
  [thit ga, thit bo],  % options for required ingredient 1
  [com],               % options for required ingredient 2
  [hanh, toi]          % options for required ingredient 3
]
```

**Step 4.** Find all possible combinations where one ingredient option is selected per required ingredient.
```
 `[thit ga, com, hanh]`
 `[thit ga, com, toi]`
 `[thit bo, com, hanh]`
 `[thit bo, com, toi]`
```

```prolog
combination([], []).  % Base case: empty list corresponds to empty combination.

combination([L|Ls], [X|Xs]) :-
  member(X, L),           % Pick one element X from the first list L
  combination(Ls, Xs).    % Recursively do the same for the rest of lists Ls
```

* Picks an ingredient `X` from the first list `L`.
* Recursively generates combinations from the remaining lists `Ls`.
* Combines `X` with the recursive result `Xs` to build the full combination.

**Step 5.** Filter out invalid combinations: Keep only combinations where **all ingredients exist** in the provided ingredient list.
```prolog
all_in_ingredients([], _).
all_in_ingredients([H|T], Ingredients) :-
  member(H, Ingredients),
  all_in_ingredients(T, Ingredients).
```

**Step 6.** Repeat for all recipes to collect all matching recipes and their possible valid ingredient sets.

## APPLICATION SCREEN CAPTURES
#### *Recipe suggestion page*: Ingredients loaded as cards, user can choose the card and the app will suggest all the possible recipes
<p align="center">
  <img src="https://github.com/user-attachments/assets/d521b062-0a31-4ae8-b09c-b6184b8d3286" alt="Recipe Page" width="800"/>
</p>

#### *Recipe management page*: The user can add new ingredients, substitution pairs, and new recipes
<p align="center">
  <img src="https://github.com/user-attachments/assets/7e65e004-0226-4efb-b4d9-1de260ad9657" alt="Manage Page 1" width="800"/>
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/f0489ce3-cfcf-4325-8245-4755a0589b7b" alt="Manage Page 2" width="800"/>
</p>
