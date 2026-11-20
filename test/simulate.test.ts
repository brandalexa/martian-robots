import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { simulate } from "../src/simulate.ts";

const EXAMPLES = join(import.meta.dirname, "../examples");

/** Runs the given input lines and returns the report lines. */
function run(...lines: string[]): string[] {
	const output = simulate(`${lines.join("\n")}\n`);
	return output === "" ? [] : output.split("\n");
}

describe("simulate", () => {
	it("produces the sample output from the brief", () => {
		const input = readFileSync(join(EXAMPLES, "sample-input.txt"), "utf8");
		const output = readFileSync(join(EXAMPLES, "sample-output.txt"), "utf8");

		assert.equal(simulate(input), output.trimEnd());
	});

	it("reports nothing for a world with no robots", () => {
		assert.deepEqual(run("5 3"), []);
	});

	describe("on the grid", () => {
		it("leaves a robot with no instructions where it started", () => {
			assert.deepEqual(run("5 3", "2 1 S", ""), ["2 1 S"]);
		});

		it("turns a robot full circle in either direction", () => {
			assert.deepEqual(run("5 3", "1 1 N", "LLLL", "1 1 N", "RRRR"), [
				"1 1 N",
				"1 1 N",
			]);
		});

		it("moves a robot to every edge without losing it", () => {
			assert.deepEqual(run("5 3", "0 0 N", "FFFRFFFFFRFFFRFFFFF"), ["0 0 W"]);
		});

		it("lets robots pass through where earlier robots stopped", () => {
			assert.deepEqual(run("5 3", "1 1 N", "", "0 1 E", "FF"), [
				"1 1 N",
				"2 1 E",
			]);
		});
	});

	describe("lost robots", () => {
		const edges = [
			{ edge: "north", start: "2 3 N", report: "2 3 N LOST" },
			{ edge: "east", start: "5 1 E", report: "5 1 E LOST" },
			{ edge: "south", start: "2 0 S", report: "2 0 S LOST" },
			{ edge: "west", start: "0 1 W", report: "0 1 W LOST" },
		];
		for (const { edge, start, report } of edges) {
			it(`are lost off the ${edge} edge at their last grid point`, () => {
				assert.deepEqual(run("5 3", start, "F"), [report]);
			});
		}

		it("ignore the instructions after they are lost", () => {
			assert.deepEqual(run("5 3", "2 3 N", "FRFFRF"), ["2 3 N LOST"]);
		});

		it("are lost from a single-point world", () => {
			assert.deepEqual(run("0 0", "0 0 E", "F"), ["0 0 E LOST"]);
		});
	});

	describe("scents", () => {
		it("stop a later robot falling off from the same grid point", () => {
			assert.deepEqual(run("5 3", "2 3 N", "F", "2 3 N", "F"), [
				"2 3 N LOST",
				"2 3 N",
			]);
		});

		it("let the robot carry on after the ignored instruction", () => {
			assert.deepEqual(run("5 3", "2 3 N", "F", "2 2 N", "FFFRF"), [
				"2 3 N LOST",
				"3 3 E",
			]);
		});

		it("block falling off in any direction, not just the one taken", () => {
			assert.deepEqual(run("5 3", "5 3 N", "F", "5 3 E", "FLF"), [
				"5 3 N LOST",
				"5 3 N",
			]);
		});

		it("still allow moves that stay on the grid", () => {
			assert.deepEqual(run("5 3", "2 3 N", "F", "2 3 S", "F"), [
				"2 3 N LOST",
				"2 2 S",
			]);
		});

		it("only protect the grid point they were left at", () => {
			assert.deepEqual(run("5 3", "2 3 N", "F", "3 3 N", "F"), [
				"2 3 N LOST",
				"3 3 N LOST",
			]);
		});

		it("build up across robots", () => {
			assert.deepEqual(
				run("5 3", "2 3 N", "F", "0 1 W", "F", "0 3 E", "FFLFLFFLFFRFLF"),
				["2 3 N LOST", "0 1 W LOST", "0 0 S"],
			);
		});
	});
});
