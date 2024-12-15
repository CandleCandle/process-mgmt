import { Factory, FactoryGroup } from '../factory.js';
import { Stack } from '../stack.js';
import { Item } from '../item.js';
import { Data } from '../data.js';
import { Process } from '../process.js';

const check_add = function (item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log('error processing item:', item);
        throw error;
    }
};

const add_item = function (data, name, i18n) {
    if (!data.items[name]) {
        if (i18n) {
            data.add_item(new Item(name, i18n));
        } else {
            data.add_item(new Item(name, name));
        }
    }
    return data.items[name];
};

const get_ingredient_amount = function (ingredient) {
    let amount = ingredient.amount;
    if (typeof amount === 'undefined') {
        amount = (ingredient.amount_min + ingredient.amount_max) / 2;
    }
    const probability = ingredient.probability;
    if (probability) {
        amount = amount * probability;
    }
    return amount;
};

const convert_ingredient = function (data, ingredient) {
    const amount = get_ingredient_amount(ingredient);
    if (ingredient.temperature) {
        return new Stack(
            data.items[_item_id_name_from_data(ingredient.name, ingredient.temperature).id],
            amount,
        );
    }
    return new Stack(data.items[ingredient.name], amount);
};

const _recipe_has_fluid_temperature = function (recipe, temperature_based_items) {
    // [base name][temperature] => Item
    const i = recipe.ingredients.some(
        (ingredient) =>
            false ||
            ingredient.minimum_temperature ||
            ingredient.maximum_temperature ||
            ingredient.temperature ||
            temperature_based_items[ingredient.name]
            ,
    );
    const p = recipe.products.some(
        (ingredient) =>
            false ||
            ingredient.minimum_temperature ||
            ingredient.maximum_temperature ||
            ingredient.temperature ||
            temperature_based_items[ingredient.name]
            ,
    );
    return i || p;
};

const _add_basic_recipe = function (data, recipe) {
    for (const ingredient of recipe.ingredients) {
        check_add([recipe, ingredient], () => add_item(data, ingredient.name));
    }
    for (const product of recipe.products) {
        check_add([recipe, product], () => add_item(data, product.name));
    }
    check_add([recipe, recipe.category], () => {
        if (!data.factory_groups[recipe.category]) {
            data.add_factory_group(new FactoryGroup(recipe.category));
        }
    });
    check_add(recipe, () => {
        data.add_process(
            new Process(
                recipe.name,
                recipe.ingredients.map((i) => convert_ingredient(data, i)),
                recipe.products.map((i) => convert_ingredient(data, i)),
                recipe.energy,
                data.factory_groups[recipe.category],
            ),
        );
    });
};

const _add_temperature_recipe = function (
    data,
    recipe,
    temperature_based_items,
) {
    check_add([recipe, recipe.category], () => {
        if (!data.factory_groups[recipe.category]) {
            data.add_factory_group(new FactoryGroup(recipe.category));
        }
    });
    for (const ingredient of recipe.ingredients) {
        if (ingredient.minimum_temperature || ingredient.maximum_temperature) {
            // pass; should already be added?
        } else {
            check_add([recipe, ingredient], () =>
                add_item(data, ingredient.name),
            );
        }
    }
    for (const product of recipe.products) {
        check_add([recipe, product], () => add_item(data, product.name));
    }

    console.log('recipe', recipe.name);
    const ingredient_variations = cross_product_ingredients(
        data,
        recipe.ingredients,
        temperature_based_items,
    );
    check_add(recipe, () => {
        for (const [idx, variation] of ingredient_variations.entries()) {
            data.add_process(
                new Process(
                    recipe.name + '--' + idx,
                    variation,
                    recipe.products.map((i) => convert_ingredient(data, i)),
                    recipe.energy,
                    data.factory_groups[recipe.category],
                ),
            );
        }
    });
};

const compute_permutations = function (input, out) {
    if (input.length == 0) return out;
    const entry = input.shift();
    if (out) {
        const r = [];
        for (const o of out) {
            for (const e of entry) {
                r.push(o.concat(e));
            }
        }
        return compute_permutations(input, r);
    } else {
        return compute_permutations(
            input,
            entry.map((e) => [e]),
        );
    }
};

const cross_product_ingredients = function (
    data,
    ingredients,
    temperature_based_items,
) {
    const ingredients_with_temperature_lists = ingredients.map((i) => {
        console.log('ingredient', i.name, i.minimum_temperature, i.maximum_temperature, i.temperature, temperature_based_items[i.name]);
        if (i.minimum_temperature || i.maximum_temperature || temperature_based_items[i.name]) {
            const stack_in_range = Object.keys(temperature_based_items[i.name])
                .filter(
                    (t) =>
                        // temperature of this item is within the range of the ingredient restrictions
                        (i.minimum_temperature <= t && t <= i.maximum_temperature)
                        // no temperature restrictions specified for the ingredient
                        || (!i.minimum_temperature && !i.maximum_temperature && !i.temperature)
                    ,
                )
                .map((t) => temperature_based_items[i.name][t])
                .map((item) => new Stack(item, get_ingredient_amount(i)));
            console.log('  ', stack_in_range);
            return stack_in_range;
        } else {
            return [convert_ingredient(data, i)];
        }
    });
    const permutations = compute_permutations(
        ingredients_with_temperature_lists.map((ingredient_list) => {
            const r = [];
            for (let i = 0; i < ingredient_list.length; ++i) r.push(i);
            return r;
        }),
    ).map((permutation) => {
        return permutation.map(
            (val, idx) => ingredients_with_temperature_lists[idx][val],
        );
    });
    return permutations;
};

const add_factory_groups = function (data, group) {
    for (const factory of Object.values(group)) {
        check_add([factory, factory.crafting_categories], () => {
            for (const category_name of Object.keys(
                factory.crafting_categories,
            )) {
                if (!data.factory_groups[category_name]) {
                    data.add_factory_group(new FactoryGroup(category_name));
                }
            }
        });
        check_add(factory, () => {
            data.add_factory(
                new Factory(
                    factory.name,
                    factory.name,
                    Object.keys(factory.crafting_categories).map(
                        (c) => data.factory_groups[c],
                    ),
                    1 / factory.crafting_speed,
                ),
            );
        });
    }
};

const _add_temperature_based_item = function (
    temperature_based_items,
    product,
    item,
) {
    if (!temperature_based_items[product.name]) {
        temperature_based_items[product.name] = {};
    }
    temperature_based_items[product.name][product.temperature] = item;
};

function _item_id_name_from_data(name, temp) {
    let t;
    if (temp < 0) {
        t = '_' + Math.abs(temp);
    } else {
        t = temp;
    }
    return {
        id: name + '_' + t,
        name: name + ' (' + temp + ')',
    }
}

function _add_temperature_items(data, recipe_raw) {
    const temperature_based_items = {}; // [base name][temperature] => Item
    for (const recipe of Object.values(recipe_raw)) {
        if (!Array.isArray(recipe.ingredients)) recipe.ingredients = [];
        if (!Array.isArray(recipe.products)) recipe.products = [];
        for (const product of recipe.products) {
            if (product.temperature) {
                const item = check_add([recipe, product], () =>
                    add_item(
                        data,
                        _item_id_name_from_data(product.name, product.temperature).id,
                        _item_id_name_from_data(product.name, product.temperature).name,
                    ),
                );
                _add_temperature_based_item(
                    temperature_based_items,
                    product,
                    item,
                );
            } else {
                check_add([recipe, product], () =>
                    add_item(data, product.name),
                );
            }
        }
        for (const i of recipe.ingredients) {
            if (i.temperature) {
                i.minimum_temperature = i.temperature;
                i.maximum_temperature = i.temperature;
            }
            if (i.minimum_temperature > -1e207) {
                const temp = i.minimum_temperature;
                const item = check_add([recipe, i], () =>
                    add_item(
                        data,
                        _item_id_name_from_data(i.name, temp).id,
                        _item_id_name_from_data(i.name, temp).name,
                    ),
                );
                _add_temperature_based_item(
                    temperature_based_items,
                    i,
                    item,
                );
            }
            if (i.maximum_temperature < 1e207) {
                const temp = i.maximum_temperature;
                const item = check_add([recipe, i], () =>
                    add_item(
                        data,
                        _item_id_name_from_data(i.name, temp).id,
                        _item_id_name_from_data(i.name, temp).name,
                    ),
                );
                _add_temperature_based_item(
                    temperature_based_items,
                    i,
                    item,
                );
            }
        }
    }
    return temperature_based_items;
}

async function create_data(game, version, json_promise_cb) {
    const data_p = json_promise_cb('recipe.json').then((recipe_raw) => {
        const data = new Data(game, version);


        // enumerate all possible temperatures for fluids.
        // create temperature based items for each.

        // [base name][temperature] => Item
        const temperature_based_items = _add_temperature_items(data, recipe_raw); 

        // if a process has one of the temperature fluids as an input then create multiple variants
        for (const recipe of Object.values(recipe_raw)) {
            check_add(recipe, () => {
                if (_recipe_has_fluid_temperature(recipe, temperature_based_items)) {
                    _add_temperature_recipe(
                        data,
                        recipe,
                        temperature_based_items,
                    );
                } else {
                    _add_basic_recipe(data, recipe);
                }
            });
        }
        return data;
    });

    const groups_p = [
        'assembling-machine.json',
        'furnace.json',
        'rocket-silo.json',
    ].map(json_promise_cb);
    return Promise.all([data_p, ...groups_p]).then((arr) => {
        const data = arr.shift();
        for (const g of arr) {
            add_factory_groups(data, g);
        }
        return data;
    });
}

export default create_data;
