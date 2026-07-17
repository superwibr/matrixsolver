import { Fraction } from "./fraction.min.js";

export const toFrac = v => v instanceof Fraction ? v : new Fraction(v);

/**
 * Solve a linear system where each row is an equation = 0.
 * Row [a, b, c, d] => a*x + b*y + c*z + d = 0
 *
 * @param {Array} matrix 2D array (numbers, strings like "1/3", or Fractions)
 * @returns {{ type: 'unique'|'none'|'infinite', solution?: Fraction[] }}
 */
export const solve = (matrix, ceil = false, clamp1 = false) => {
	const m = matrix.length;
	if (m === 0) return { type: "infinite", solution: [] , solvedValues: false };
	const n = matrix[0].length - 1; // number of variables

	const A = matrix.map(row => row.map(toFrac));

	const pivotCols = [];
	let r = 0;

	// ---- Forward elimination (Gaussian, partial pivoting) ----
	for (let c = 0; c < n && r < m; c++) {
		let maxR = r, maxAbs = A[r][c].abs();
		for (let i = r + 1; i < m; i++) {
			const a = A[i][c].abs();
			if (a.compare(maxAbs) > 0) { maxAbs = a; maxR = i; }
		}
		if (maxAbs.equals(0)) continue; // free column

		[A[r], A[maxR]] = [A[maxR], A[r]];
		pivotCols.push(c);

		for (let i = r + 1; i < m; i++) {
			if (A[i][c].equals(0)) continue;
			const factor = A[i][c].div(A[r][c]);
			for (let j = c; j <= n; j++) {
				A[i][j] = A[i][j].sub(factor.mul(A[r][j]));
			}
		}
		r++;
	}

	const rank = r;

	// ---- Consistency check ----
	for (let i = rank; i < m; i++) {
		if (!A[i][n].equals(0)) return { type: "none", solvedValues: false };
	}
	if (rank < n) return { type: "infinite", solvedValues: false  };

	// ---- Back substitution ----
	let solution = new Array(n);
	for (let i = rank - 1; i >= 0; i--) {
		const pc = pivotCols[i];
		let s = A[i][n];
		for (let c = pc + 1; c < n; c++) s = s.sub(A[i][c].mul(solution[c]));
		solution[pc] = s.div(A[i][pc]);
	}

	// flip solution if solution vector negative
	const allNegative = solution.every(x => x.compare(0) <= 0);
	if (allNegative) solution = solution.map(x => x.neg());

	if(ceil) solution = solution.map(x => x.ceil());
	if(clamp1) solution = solution.map(x => x.gt(1) ? x : new Fraction(1));

	return { type: "unique", solution, solvedValues: true };
}

// ---- Pretty print helper ----
const passlog = txt => (console.log(txt), txt);
export const printResult = (res, varNames = null) => {
	if (res.type === "none") return passlog("No solution (inconsistent system).");
	if (res.type === "infinite") return passlog("Infinite solutions (underdetermined).");
	res.solution.forEach((f, i) => {
		const name = varNames ? varNames[i] : `x${i + 1}`;
		console.log(`${name} = ${f.toFraction(true)}`);   // e.g. "4/3"
	});
}