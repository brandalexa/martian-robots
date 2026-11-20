/** Input that doesn't match the expected format. `line` is 1-based. */
export class ParseError extends Error {
	readonly line: number;

	constructor(message: string, line: number) {
		super(`line ${line}: ${message}`);
		this.name = "ParseError";
		this.line = line;
	}
}
