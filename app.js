#!/usr/bin/node
var async = require('async-chainable');
var colors = require('chalk');
var fs = require('fs');
var program = require('commander');
var revman = require('revman');
var revmanReplicant = require('revman-replicant');
var util = require('util');

program
	.version(require('./package.json').version)
	.usage('<file> [--tree | --replicant | --json] [options]')
	.option('-j, --json', 'Output RevMan JSON structure')
	.option('-p, --pretty', 'When using --json, pretty print the structure')
	.option('-r, --replicant', 'Generate an abstract from the RevMan file via RevMan-Replicant')
	.option('--grammar [file]', 'Use the specified grammar file to generate --replicant output', __dirname + '/node_modules/revman-replicant/grammars/hal-en.html')
	.option('-t, --tree', 'Output a tree of all comparisons, outcomes, subgroups and studies')
	.option('--ss, --show-studies', 'Show the studies when in --tree mode')
	.option('--verify', 'Dont generate output, just verify that the file is valid')
	.option('-v, --verbose', 'Be verbose')
	.option('--no-color', 'Force disable color')
	.parse(process.argv);

async()
	// Sanity checks {{{
	.then(function(next) {
		if (program.args.length != 1) return next('RevMan-Replicant needs exactly one RevMan file to work with');
		if (!program.tree && !program.replicant && !program.json && !program.verify) return next('Specify at least --tree, --replicant or --json');
		next();
	})
	// }}}
	// Read file {{{
	.then('buffer', function(next) {
		fs.readFile(program.args[0], 'utf-8', next);
	})
	.then('revman', function(next) {
		revman.parse(this.buffer.toString(), next);
	})
	// }}}
	// If program.verify {{{
	.then(function(next) {
		// If we got to here then we know the file is valid
		if (program.verify && program.verbose) console.log('RevMan file is valid');
		next();
	})
	// }}}
	// If program.tree {{{
	.then(function(next) {
		if (!program.tree) return next();

		var task = this;

		task.revman.analysesAndData.comparison.forEach(function(comparison, comparisonIndex) {
			console.log(colors.bold.blue('*', comparison.name));
			comparison.outcome.forEach(function(outcome) {
				console.log('  -', outcome.name, colors.grey(outcome.study ? '(' + outcome.study.length + ' studies)' : ''));
				if (outcome.subgroup) {
					outcome.subgroup.forEach(function(subgroup) {
						console.log('    -', subgroup.name, colors.grey('(subgroup; ' + subgroup.study.length + ' studies)'));
						if (program.showStudies) {
							subgroup.study.forEach(function(study) {
								console.log('      -', study.name);
							});
						}
					});
				} else if (program.showStudies) {
					outcome.study.forEach(function(study) {
						console.log('    -', study.name);
					});
				}
			});
			if (comparisonIndex < task.revman.analysesAndData.comparison.length - 1) console.log(); // Insert empty line if not the last item
		});
		next();
	})
	// }}}
	// If program.replicant {{{
	.then(function(next) {
		if (!program.replicant) return next();
		revmanReplicant({
			revman: this.revman,
			grammar: program.grammar,
		}, function(err, text) {
			if (err) return next(err);
			console.log(text);
			next();
		});
	})
	// }}}
	// If program.json {{{
	.then(function(next) {
		if (!program.json) return next();
		if (program.pretty) {
			process.stdout.write(util.inspect(this.revman, {depth: null, colors: true}), next);
		} else {
			process.stdout.write(JSON.stringify(this.revman, null, '\t'), next);
		}
	})
	// }}}
	// End {{{
	.end(function(err) {
		if (err) {
			console.log(colors.red('Error'), err.toString());
			process.exit(1);
		} else {
			process.exit(0);
		}
	});
	// }}}
