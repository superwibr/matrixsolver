import { Fraction } from "./fraction.min.js";
import { toFrac } from "./solver.js";

const parseDefinitionBlock = text => {
	const processes = [];

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;

		const m = line.match(/^(.+?):\s*(.*?)\s*->\s*(.*?)$/);
		if (!m) throw new Error(`Invalid definition: ${line}`);

		const [, name, lhs, rhs] = m;

		processes.push({
			name: name.trim(),
			inputs: parseIngredientList(lhs),
			outputs: parseIngredientList(rhs),
		});
	}

	return processes;
}

const parseIngredientList = text => {
	text = text.trim();
	if (!text) return [];

	return text.split(",").map(part => {
		const item = part.trim();

		const m = item.match(/^([0-9./]+)\s+(.+)$/);
		if (!m) throw new Error(`Invalid ingredient entry: "${item}"`);

		return {
			quantity: toFrac(m[1]),
			ingredient: m[2].trim(),
		};
	});
}

const formatFraction = fraction => `${fraction.toFraction()} ${fraction.d == 1n ? "" : `(${fraction.abs().valueOf() < 0.001 ? "<0.001" : fraction.valueOf().toFixed(3)})`}`;

export class ProcessSystem {
	constructor(processes) {
		this.processes = processes;

		this.processNames = processes.map(p => p.name);

		const ingredients = new Set();

		for (const p of processes) {
			for (const i of p.inputs) ingredients.add(i.ingredient);
			for (const o of p.outputs) ingredients.add(o.ingredient);
		}

		this.ingredientNames = [...ingredients];
	}

	static parse(text) {
		return new this(parseDefinitionBlock(text));
	}

	coefficientMatrix() {
		const ingredientIndex = new Map(
			this.ingredientNames.map((n, i) => [n, i])
		);

		const matrix = this.ingredientNames.map(() =>
			Array(this.processes.length).fill(new Fraction(0))
		);

		this.processes.forEach((process, col) => {
			for (const input of process.inputs) {
				matrix[ingredientIndex.get(input.ingredient)][col]
					= matrix[ingredientIndex.get(input.ingredient)][col].sub(input.quantity);
			}

			for (const output of process.outputs) {
				matrix[ingredientIndex.get(output.ingredient)][col]
					= matrix[ingredientIndex.get(output.ingredient)][col].add(output.quantity);
			}
		});

		return {
			rows: this.ingredientNames,
			cols: this.processNames,
			matrix,
		};
	}

	labelResults(values) {
		if (values.length !== this.processes.length - 1) {
			throw new Error(
				`Expected ${this.processes.length} values, got ${values.length}`
			);
		}

		return this.processes.slice(0, -1)
			.map((p, i) => `${p.name}: ${formatFraction(values[i])}`)
			.join("\n");
	}

	getIngredientValues(processValues) {
		const coefficients = this.coefficientMatrix();
		const outputs = new Array(this.ingredientNames.length).fill(new Fraction(0));

		coefficients.matrix.forEach((row, i) => row.slice(0, -1).forEach((cell, column) => {
			outputs[i] = outputs[i].add(cell.mul(processValues[column]))
		}));

		return outputs;
	}

	labelIngredientValues(ingredientValues) {
		return ingredientValues
			.map((value, i) => `${this.ingredientNames[i]}: ${formatFraction(value)}`)
			.join("\n");
	}
}

export const formatMatrix = matrix => {
	const pl = Array(matrix[0].length).fill(0);

	matrix.forEach(row => row.forEach((cell, col) => {
		const celll = cell.toFraction().length;
		if (pl[col] < celll) pl[col] = celll;
	}));

	let s = "";

	matrix.forEach((row) => {
		s += `\n[ ${row.map((cell, i) => cell.toFraction().padEnd(pl[i], " ")).join(" , ")} ]`
	});

	return s;
}