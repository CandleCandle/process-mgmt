# process-mgmt

Generates graphviz compatible graphs of processes and the interactions between them.

General usage tends to be a shell pipeline along the lines of:
```
f=path/with/config/base; node src/index.js factory-graph --config $f.json | tee $f.gv; dot -Tpng -O $f.gv
```
This uses the configuration at `path/with/config/base.json` to generate `path/with/config/base.gv` and `path/with/config/base.gv.png`

# Usage

```
$ node src/index.js -h
index.js <command>

Commands:
  index.js all            generate a graph of all the processes
  index.js factory-graph  generate a graph filtered to producing a paricular item
  index.js factory-rate   generate a graph filtered to producing a paricular item; with factory counts.

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```



## All

```
$ node src/index.js all -h
index.js all

generate a graph of all the processes

Options:
      --version  Show version number                                   [boolean]
  -d, --data                                                 [string] [required]
  -h, --help     Show help                                             [boolean]
```

Generates a graph for every process included in the specified data.

### Examples
```
$ node src/index.js all --data vt
```
Generates the entire production graph for the `vt` dataset.

```
$ node src/index.js all --data dsp
```
Generates the entire production graph for the `dsp` dataset.



## Factory Graph

```
$ node src/index.js factory-graph -h
index.js factory-graph

generate a graph filtered to producing a paricular item

Options:
      --version  Show version number                                   [boolean]
  -c, --config                                               [string] [required]
  -h, --help     Show help                                             [boolean]
```

### Examples

Config
```json
{
    "data": "vt",
    "requirement": { "id": "tv", "rate": 1.25 },
    "imported": [ "copper_wire" ],
    "exported": [ ],
    "process_choices": { },
    "enable": [ ]
}
```
Command
```
$ node src/index.js factory-graph --config vt-tv.json
```

json key | Desciption
---------|-----------
`data` | data set to use, in this case `vt`.
`requirement.id` | target to produce. Filters the data set to include this item as the final output
`requirement.rate` | unused for `factory-graph`
`imported` | list of item types that are imported to the sub factory. Supply of these items are functionally infinite.
`exported` | list of item types that are exported from the sub factory. Demand for these items are functionally infinite.
`process_choices` | mapping of `item_id` to `process_id` defining which process to use when there is a choice
`enable` | list of extra processes to include in the graph, e.g. to include dealing with side-effects



## Factory Rate

```
$ node src/index.js factory-rate -h
index.js factory-rate

generate a graph filtered to producing a paricular item; with factory counts.

Options:
      --version  Show version number                                   [boolean]
  -c, --config                                               [string] [required]
  -h, --help     Show help                                             [boolean]
```

### Examples

Config
```json
{
    "data": "factorio-ab-01",
    "requirement": { "id": "brass_alloy", "rate": 60 },
    "imported": [
        "ingot_zinc",
        "ingot_tin",
        "ingot_copper"
    ],
    "exported": [ ],
    "process_choices": {
        "liquid_molten_brass": "angels_brass_smelting_2",
        "brass_alloy": "angels_plate_brass"
    },
    "enable": [],
    "modifiers": {
        "angels_plate_brass": {"speed": 1, "output": 1.3},
        "angels_brass_smelting_2": {"speed": 0.4, "output": 1}
    }
}
```
Command
```
$ node src/index.js factory-rate --config brass_alloy.json
```

json key | Desciption
---------|-----------
`data` | data set to use, in this case `factorio-ab-01`.
`requirement.id` | target to produce. Filters the data set to include this item as the final output
`requirement.rate` | Sets the desired output rate for the requirement.
`imported` | list of item types that are imported to the sub factory. Supply of these items are functionally infinite.
`exported` | list of item types that are exported from the sub factory. Demand for these items are functionally infinite.
`process_choices` | mapping of `item_id` to `process_id` defining which process to use when there is a choice
`enable` | unused for `factory-graph`
`modifiers` | mapping of process to modifiers. Some games allow processes to be modified, e.g. Factorio allows for speed, productivity, and efficiency modules.
`modifiers.speed` | multiplier for adjusting the speed of a process. `1` indicates no change. `(0-1)` indicates a faster process. `(1-n]` indicates a slower process.
`modifiers.output` | multiplier for adjusting the quantity of outputs for the same input quantities. `1` indicates no change. `(0-1)` indicates less output for the process. `(1-n]` indicates more output for the process.
