import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const CLI = join(import.meta.dirname, "../src/cli.ts");
const SAMPLE_INPUT_FILE = join(
	import.meta.dirname,
	"../examples/sample-input.txt",
);
const SAMPLE_INPUT = readFileSync(SAMPLE_INPUT_FILE, "utf8");

// Until the robots are simulated, valid input is echoed back.
const SAMPLE_OUTPUT = SAMPLE_INPUT;

function runCli(args: string[], stdin = "") {
	return spawnSync(process.execPath, [CLI, ...args], {
		input: stdin,
		encoding: "utf8",
	});
}

describe("cli", () => {
	it("reads from stdin when no file is given", () => {
		const result = runCli([], SAMPLE_INPUT);

		assert.equal(result.stderr, "");
		assert.equal(result.stdout, SAMPLE_OUTPUT);
		assert.equal(result.status, 0);
	});

	it("reads from the given file", () => {
		const result = runCli([SAMPLE_INPUT_FILE]);

		assert.equal(result.stderr, "");
		assert.equal(result.stdout, SAMPLE_OUTPUT);
		assert.equal(result.status, 0);
	});

	it("fails when the file cannot be read", () => {
		const result = runCli(["does-not-exist.txt"]);

		assert.equal(result.stdout, "");
		assert.match(result.stderr, /cannot read "does-not-exist\.txt"/);
		assert.equal(result.status, 1);
	});

	it("rejects more than one file", () => {
		const result = runCli(["a.txt", "b.txt"]);

		assert.equal(result.stdout, "");
		assert.match(result.stderr, /expected at most one input file/);
		assert.equal(result.status, 1);
	});

	it("reports invalid input on stderr and exits 1", () => {
		const result = runCli([], "5 3\n1 1 X\nF\n");

		assert.equal(result.stdout, "");
		assert.equal(
			result.stderr,
			'martian-robots: invalid input: line 2: orientation must be one of N, E, S, W, got "X"\n',
		);
		assert.equal(result.status, 1);
	});
});
