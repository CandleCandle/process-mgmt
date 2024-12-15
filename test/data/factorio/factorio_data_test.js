import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../../../src/factory.js';
import { Process } from '../../../src/process.js';

import { Item } from '../../../src/item.js';
import { Stack } from '../../../src/stack.js';

import { default as create_data } from '../../../src/factorio-recipe-lister/data_base.js';

const RECIPES = 'recipe.json';
const ASSEMBLERS = 'assembling-machine.json';
const FURNACES = 'furnace.json';
const SILO = 'rocket-silo.json';

import {
    mixed_temperature_restrictions,
    multiple_temperature_recipe,
    single_temperature_recipe,
    single_solids_recipe,
} from './fixtures.js';

describe('Data Parsing', function () {
    describe('standard solid processes', function () {
        const result = create_data('f', '1', (path) => {
            switch (path) {
                case RECIPES:
                    return new Promise((rs, _) => rs(single_solids_recipe));
                default:
                    return new Promise((rs, _) => rs({}));
            }
        });
        it('finds a single process', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(Object.keys(data.processes), [
                    'copper-plate',
                ]);
            });
        });
        it('the process has a single input', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(data.processes['copper-plate'].inputs, [
                    new Stack(new Item('copper-ore', 'copper-ore'), 8),
                ]);
            });
        });
        it('the process has a single output', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(data.processes['copper-plate'].outputs, [
                    new Stack(new Item('copper-plate', 'copper-plate'), 1),
                ]);
            });
        });
    });
    describe('temperature restricted processes', function () {
        const result = create_data('f', '1', (path) => {
            switch (path) {
                case RECIPES:
                    return new Promise((rs, _) =>
                        rs(single_temperature_recipe),
                    );
                default:
                    return new Promise((rs, _) => rs({}));
            }
        });
        it('finds processes', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(Object.keys(data.processes).sort(), [
                    'hot-residual-mixture-to-coke--0',
                    'warmer-stone-brick-1--0',
                ]);
            });
        });
        it('data has three fluid variants', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    Object.values(data.items)
                        .filter((item) => item.name.startsWith('coke-oven-gas'))
                        .sort((a, b) => {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                        }),
                    [
                        new Item('coke-oven-gas', 'coke-oven-gas'),
                        new Item('coke-oven-gas_250', 'coke-oven-gas (250)'),
                        new Item('coke-oven-gas_500', 'coke-oven-gas (500)'),
                    ],
                );
            });
        });
        it('the process has a two inputs', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    data.processes['warmer-stone-brick-1--0'].inputs,
                    [
                        new Stack( new Item('warm-stone-brick', 'warm-stone-brick'), 5,),
                        new Stack( new Item( 'coke-oven-gas_500', 'coke-oven-gas (500)',), 100,),
                    ],
                );
            });
        });
        it('the process has a two outputs', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    data.processes['warmer-stone-brick-1--0'].outputs,
                    [
                        new Stack( new Item( 'warmer-stone-brick', 'warmer-stone-brick',), 5,),
                        new Stack( new Item( 'coke-oven-gas_250', 'coke-oven-gas (250)',), 100,),
                    ],
                );
            });
        });
    });
    describe('temperature based processes; unrestricted input', function() {
        const result = create_data('f', '1', (path) => {
            switch (path) {
                case RECIPES:
                    return new Promise((rs, _) =>
                        rs(mixed_temperature_restrictions),
                    );
                default:
                    return new Promise((rs, _) => rs({}));
            }
        });
        it('finds processes', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(Object.keys(data.processes).sort(), [
                    'fluoroketone--0',
                    'fluoroketone-cooling--0',
                ]);
            });
        });
        it('data has three fluid variants', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    Object.values(data.items)
                        .filter((item) => item.name.startsWith('fluoroketone'))
                        .sort((a, b) => {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                        }),
                    [
                        new Item('fluoroketone-cold', 'fluoroketone-cold'),
                        new Item('fluoroketone-cold__150', 'fluoroketone-cold (-150)'),
                        new Item('fluoroketone-hot', 'fluoroketone-hot'),
                        new Item('fluoroketone-hot_180', 'fluoroketone-hot (180)'),
                    ],
                );
            });
        });
        it('the process has inputs', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    data.processes['fluoroketone-cooling--0'].inputs,
                    [
                        new Stack(
                            new Item('fluoroketone-hot_180', 'fluoroketone-hot (180)'),
                            10,
                        ),
                    ],
                );
            });
        });
        it('the process has outputs', async function () {
            return result.then((data) => {
                assert.deepStrictEqual(
                    data.processes['fluoroketone-cooling--0'].outputs,
                    [
                        new Stack(
                            new Item(
                                'fluoroketone-cold__150',
                                'fluoroketone-cold (-150)',
                            ),
                            10,
                        ),
                    ],
                );
            });
        });
    });
    describe('temperature restricted processes; 2 input options', function () {
        const result = create_data('f', '1', (path) => {
            switch (path) {
                case RECIPES:
                    return new Promise((rs, _) =>
                        rs(multiple_temperature_recipe),
                    );
                default:
                    return new Promise((rs, _) => rs({}));
            }
        });
        it('finds processes', function () {
            result.then((data) => {
                assert.deepStrictEqual(Object.keys(result.processes).sort(), [
                    'coke-oven-gas-300--0',
                    'coke-oven-gas-500--0',
                    'warmer-stone-brick-1--0',
                    'warmer-stone-brick-1--1',
                ]);
            });
        });
        it('data has four fluid variants', function () {
            result.then((data) => {
                assert.deepStrictEqual(
                    Object.values(result.items)
                        .filter((item) => item.name.startsWith('coke-oven-gas'))
                        .sort((a, b) => {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                        }),
                    [
                        new Item('coke-oven-gas', 'coke-oven-gas'),
                        new Item('coke-oven-gas_250', 'coke-oven-gas (250)'),
                        new Item('coke-oven-gas_300', 'coke-oven-gas (300)'),
                        new Item('coke-oven-gas_500', 'coke-oven-gas (500)'),
                    ],
                );
            });
        });
        it('the process has a two inputs (300)', function () {
            result.then((data) => {
                assert.deepStrictEqual(
                    result.processes['warmer-stone-brick-1--0'].inputs,
                    [
                        new Stack(
                            new Item('warm-stone-brick', 'warm-stone-brick'),
                            5,
                        ),
                        new Stack(
                            new Item(
                                'coke-oven-gas_300',
                                'coke-oven-gas (300)',
                            ),
                            100,
                        ),
                    ],
                );
            });
        });
        it('the process has a two outputs (300)', function () {
            result.then((data) => {
                assert.deepStrictEqual(
                    result.processes['warmer-stone-brick-1--0'].outputs,
                    [
                        new Stack(
                            new Item(
                                'warmer-stone-brick',
                                'warmer-stone-brick',
                            ),
                            5,
                        ),
                        new Stack(
                            new Item(
                                'coke-oven-gas_250',
                                'coke-oven-gas (250)',
                            ),
                            100,
                        ),
                    ],
                );
            });
        });
        it('the process has a two inputs (500)', function () {
            result.then((data) => {
                assert.deepStrictEqual(
                    result.processes['warmer-stone-brick-1--1'].inputs,
                    [
                        new Stack(
                            new Item('warm-stone-brick', 'warm-stone-brick'),
                            5,
                        ),
                        new Stack(
                            new Item(
                                'coke-oven-gas_500',
                                'coke-oven-gas (500)',
                            ),
                            100,
                        ),
                    ],
                );
            });
        });
        it('the process has a two outputs (500)', function () {
            result.then((data) => {
                assert.deepStrictEqual(
                    result.processes['warmer-stone-brick-1--1'].outputs,
                    [
                        new Stack(
                            new Item(
                                'warmer-stone-brick',
                                'warmer-stone-brick',
                            ),
                            5,
                        ),
                        new Stack(
                            new Item(
                                'coke-oven-gas_250',
                                'coke-oven-gas (250)',
                            ),
                            100,
                        ),
                    ],
                );
            });
        });
    });
});

const ff = function (input, out) {
    if (input.length == 0) return out;
    const entry = input.shift();
    if (out) {
        const r = [];
        for (const o of out) {
            for (const e of entry) {
                r.push(o.concat(e));
            }
        }
        return ff(input, r);
    } else {
        return ff(
            input,
            entry.map((e) => [e]),
        );
    }
};

describe('combinatorics', () => {
    it('expands 1x1', () => {
        const result = ff([['x']]);
        assert.deepStrictEqual(result, [['x']]);
    });
    it('expands 1x2', () => {
        const result = ff([['x', 'y']]);
        assert.deepStrictEqual(result, [['x'], ['y']]);
    });
    it('expands 2x1', () => {
        const result = ff([['x'], ['y']]);
        assert.deepStrictEqual(result, [['x', 'y']]);
    });
    it('expands 2.1', () => {
        const result = ff([['x', 'y'], ['a']]);
        assert.deepStrictEqual(result, [
            ['x', 'a'],
            ['y', 'a'],
        ]);
    });
    it('expands 2.2', () => {
        const result = ff([
            ['x', 'y'],
            ['a', 'b'],
        ]);
        assert.deepStrictEqual(result, [
            ['x', 'a'],
            ['x', 'b'],
            ['y', 'a'],
            ['y', 'b'],
        ]);
    });
    it('expands 2.2.2', () => {
        const result = ff([
            ['x', 'y'],
            ['a', 'b'],
            ['p', 'q'],
        ]);
        assert.deepStrictEqual(result, [
            ['x', 'a', 'p'],
            ['x', 'a', 'q'],
            ['x', 'b', 'p'],
            ['x', 'b', 'q'],
            ['y', 'a', 'p'],
            ['y', 'a', 'q'],
            ['y', 'b', 'p'],
            ['y', 'b', 'q'],
        ]);
    });
});
