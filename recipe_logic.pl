% Bidirectional replacement check: X and Y can replace each other
are_replacements(X, Y) :-
    replacement(X, Y).
are_replacements(X, Y) :-
    replacement(Y, X).

% Find all possible used ingredients for a required ingredient (Req)
% If Req is directly in Ingredients, use Req
possible_used_ingredients(Req, Ingredients, Used) :-
    member(Req, Ingredients),
    Used = Req.

% If a replacement of Req (Alt) is in Ingredients, use Alt
possible_used_ingredients(Req, Ingredients, Used) :-
    are_replacements(Req, Alt),
    member(Alt, Ingredients),
    Used = Alt.

% For a list of required ingredients, find a list of possible used ingredients options
% Each element in UsedOptionsList is a list of possible ingredients (contain replacement) for a required ingredient
possible_used_list([], _, []).
possible_used_list([Req|Reqs], Ingredients, [UsedOptions|RestUsed]) :-
    % Find all possible ingredients that can be used for Req
    findall(U, possible_used_ingredients(Req, Ingredients, U), UsedOptions),
    UsedOptions \= [],  % A least one option exists
    % Recursively go with the rest of required ingredients
    possible_used_list(Reqs, Ingredients, RestUsed).

combination([], []).
combination([L|Ls], [X|Xs]) :-
    member(X, L), % Choose X from the list L
    combination(Ls, Xs). % Recursively combine the rest

% Remove duplicated ingredients
remove_duplicates([], []).
remove_duplicates([H|T], Result) :-
    member(H, T),
    remove_duplicates(T, Result).
remove_duplicates([H|T], [H|Result]) :-
    \+ member(H, T),
    remove_duplicates(T, Result).

% Check if all ingredients in Used are contained in Ingredients
all_in_ingredients([], _).
all_in_ingredients([H|T], Ingredients) :-
    member(H, Ingredients),
    all_in_ingredients(T, Ingredients).

% Main suggest predicate: for given Ingredients input, return recipe and each possible used ingredient combination
suggest_recipe(Ingredients, recipe_with_ingredients(Recipe, Used)) :-
    recipe(Recipe, Required), % Get required ingredients
    possible_used_list(Required, Ingredients, UsedOptionsList),
    combination(UsedOptionsList, DirtyUsed),
    remove_duplicates(DirtyUsed, Used), 
    all_in_ingredients(Used, Ingredients). % Used ingredients are from the given Ingredients
