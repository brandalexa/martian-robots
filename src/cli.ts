import { readFile } from "node:fs/promises";
import { text } from "node:stream/consumers";
import { ParseError } from "./errors.ts";
import { simulate } from "./simulate.ts";

const PROGRAM = "martian-robots";
const USAGE = `Usage: ${PROGRAM} [file]  (reads stdin when no file is given)`;

async function main(args: string[]): Promise<number> {
	if (args.length > 1) {
		return fail(`expected at most one input file\n${USAGE}`);
	}
	const [path] = args;

	// Avoid silently hanging when run interactively with nothing piped in.
	if (path === undefined && process.stdin.isTTY) {
		return fail(`no input: pass a file or pipe input via stdin\n${USAGE}`);
	}

	let input: string;
	try {
		input =
			path === undefined
				? await text(process.stdin)
				: await readFile(path, "utf8");
	} catch (error) {
		const source = path === undefined ? "stdin" : `"${path}"`;
		return fail(`cannot read ${source}: ${errorMessage(error)}`);
	}

	let output: string;
	try {
		output = simulate(input);
	} catch (error) {
		// Bad input is the user's problem; anything else is a bug and should surface.
		if (error instanceof ParseError) {
			return fail(`invalid input: ${error.message}`);
		}
		throw error;
	}

	if (output !== "") {
		process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
	}
	return 0;
}

function fail(message: string): number {
	process.stderr.write(`${PROGRAM}: ${message}\n`);
	return 1;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

process.exitCode = await main(process.argv.slice(2));
