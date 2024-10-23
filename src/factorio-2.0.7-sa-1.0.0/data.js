import { default as create_data } from '../factorio-recipe-lister/data_base.js';

const _import_file = function (name) {
    return import('./recipe-lister/' + name, { assert: { type: 'json' } })
        .catch((e) => {
            console.log('failed to read recipe.json:', e);
        })
        .then((m) => m.default);
};

export default await create_data('factorio-2.0.7-sa-1.0.0', '1.0.0', _import_file);
