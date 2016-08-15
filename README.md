RevMan-CLI
==========
CLI program to query RevMan files.

**Features**:

* Can output the raw JSON structure (via `--json`, to pretty print also add `--pretty`)
* Generate [RevMan-Replicant](https://github.com/CREBP/revman-replicant) output (via `--replicant`)
* Can output the raw `comparison / [subgroups] / outcomes` tree (via `-tree`, to output optional studies add `--show-studies`)


Installation
------------
Install with NPM as a global script:

	npm install -g revman-cli


See `revman --help` for further details.
