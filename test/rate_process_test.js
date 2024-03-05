import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.ts';
import { Process } from '../src/process.ts';
import { RateProcess } from '../src/rate_process.ts';

import { Item } from '../src/item.ts';
import { Stack } from '../src/stack.ts';

let item_a = new Item('a', 'A');
let item_b = new Item('b', 'B');
let item_c = new Item('c', 'C');
let basic_group = new FactoryGroup('basic_group');
let basic_factory = new Factory('basic', 'basic', basic_group, 1);

let process_for_c = new Process(
    'for_c',
    [new Stack(item_a, 3), new Stack(item_b, 2)],
    [new Stack(item_c, 5)],
    1,
    basic_group,
);

describe('Rate Process Tests', function () {
    describe('process count for input', function () {
        it('can calculate how many copies of a process is needed', function () {
            let proc = new RateProcess(process_for_c, basic_factory);
            let result = proc.process_count_for_rate(new Stack(item_c, 10));
            assert.strictEqual(2, result);
        });
    });
});
