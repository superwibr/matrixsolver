import { formatMatrix, ProcessSystem } from "./parser.js";
import { printResult, solve } from "./solver.js";

const
	inputArea = document.getElementById("input"),
	outputArea = document.getElementById("output"),
	intToggle = document.getElementById("onlyints"),
	clampToggle = document.getElementById("clampone"),
	solveButton = document.getElementById("solve");


const showOutput = text => outputArea.value = text;

solveButton.addEventListener("click", () => {
	console.log("=== New solve started ===");

	const ceilMode = intToggle.checked;
	console.log("Integer solution mode: ", ceilMode);

	const clampMode = clampToggle.checked;
	console.log("One-required solution mode: ", clampMode);

	try {
		const processes = ProcessSystem.parse(inputArea.value);
		console.log("Parsed input system: ", processes);

		const coefficients = processes.coefficientMatrix();
		console.log("Created coefficient matrix: ", coefficients, formatMatrix(coefficients.matrix));

		const solution = solve(coefficients.matrix, ceilMode, clampMode);
		const noSolutionMessage = printResult(solution);
		console.log(solution);

		if (solution.solvedValues) {
			const ingredientValues = processes.getIngredientValues(solution.solution);
			console.log(processes.labelIngredientValues(ingredientValues))

			showOutput(`${processes.labelResults(solution.solution)}\n\n    System over/underflow:\n${processes.labelIngredientValues(ingredientValues)}`);
		} else {
			showOutput(noSolutionMessage);
		}


	} catch (e) {
		showOutput(e);
	}
});

window.solve = solve;