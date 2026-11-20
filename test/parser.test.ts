import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse } from "../src/parser.ts";

const SAMPLE_INPUT = `5 3
1 1 E
RFRFRFRF
3 2 N
FRRFLLFFRRFLL
0 3 W
LLFFFLFLFL
`;

function assertParseError(input: string, line: number, message: RegExp) {
	assert.throws(() => parse(input), { name: "ParseError", line, message });
}

describe("parse", () => {
	it("parses the sample input from the brief", () => {
		assert.deepEqual(parse(SAMPLE_INPUT), {
			upperRight: { x: 5, y: 3 },
			robots: [
				{
					start: { x: 1, y: 1, orientation: "E" },
					instructions: [..."RFRFRFRF"],
				},
				{
					start: { x: 3, y: 2, orientation: "N" },
					instructions: [..."FRRFLLFFRRFLL"],
				},
				{
					start: { x: 0, y: 3, orientation: "W" },
					instructions: [..."LLFFFLFLFL"],
				},
			],
		});
	});

	it("tolerates no final newline, CRLF, trailing blank lines and extra whitespace", () => {
		const expected = parse(SAMPLE_INPUT);

		assert.deepEqual(parse(SAMPLE_INPUT.trimEnd()), expected);
		assert.deepEqual(parse(SAMPLE_INPUT.replaceAll("\n", "\r\n")), expected);
		assert.deepEqual(parse(`${SAMPLE_INPUT}\n \n\n`), expected);
		assert.deepEqual(parse(" 5\t 3 \n 1   1  E \n RF \n"), {
			upperRight: { x: 5, y: 3 },
			robots: [
				{ start: { x: 1, y: 1, orientation: "E" }, instructions: ["R", "F"] },
			],
		});
	});

	it("accepts the brief's limits, a single-point world and no robots", () => {
		const largest = parse(`50 50\n50 50 N\n${"F".repeat(99)}\n`);
		assert.deepEqual(largest.upperRight, { x: 50, y: 50 });
		assert.deepEqual(largest.robots[0]?.start, {
			x: 50,
			y: 50,
			orientation: "N",
		});
		assert.equal(largest.robots[0]?.instructions.length, 99);

		assert.deepEqual(parse("0 0\n0 0 N\nF\n"), {
			upperRight: { x: 0, y: 0 },
			robots: [
				{ start: { x: 0, y: 0, orientation: "N" }, instructions: ["F"] },
			],
		});
		assert.deepEqual(parse("5 3\n"), {
			upperRight: { x: 5, y: 3 },
			robots: [],
		});
	});

	it("rejects empty input and malformed grid sizes", () => {
		assertParseError("", 1, /input is empty/);
		assertParseError("5\n", 1, /expected grid size "<x> <y>", got "5"/);
		assertParseError(
			"-1 3\n",
			1,
			/x must be a whole number from 0 to 50, got "-1"/,
		);
		assertParseError(
			"5 51\n",
			1,
			/y must be a whole number from 0 to 50, got "51"/,
		);
	});

	it("rejects malformed robot positions", () => {
		assertParseError(
			"5 3\n1 1\nF\n",
			2,
			/expected robot position "<x> <y> <orientation>", got "1 1"/,
		);
		// A later robot, to check the reported line number.
		assertParseError(
			`${SAMPLE_INPUT}1 1 X\nF\n`,
			8,
			/orientation must be one of N, E, S, W, got "X"/,
		);
	});

	it("rejects robots starting outside the grid", () => {
		assertParseError(
			"5 3\n6 1 E\nF\n",
			2,
			/start x 6 is outside the grid \(0 to 5\)/,
		);
		assertParseError(
			"5 3\n1 4 N\nF\n",
			2,
			/start y 4 is outside the grid \(0 to 3\)/,
		);
	});

	it("rejects unknown instructions and instruction lines of 100 characters", () => {
		assertParseError(
			"5 3\n1 1 E\nRFX\n",
			3,
			/unknown instruction "X", expected one of L, R, F/,
		);
		assertParseError(
			`5 3\n1 1 E\n${"F".repeat(100)}\n`,
			3,
			/instructions must be at most 99 characters, got 100/,
		);
	});

	it("rejects missing instruction lines and blank lines between robot lines", () => {
		assertParseError("5 3\n1 1 E\n", 2, /robot has no instruction line/);
		assertParseError("5 3\n1 1 E\n\n \n", 2, /robot has no instruction line/);
		assertParseError(
			"5 3\n1 1 E\n\nRF\n",
			3,
			/blank line where robot instructions were expected/,
		);
		assertParseError(
			"5 3\n1 1 E\nF\n\n2 2 N\nF\n",
			4,
			/blank line where a robot position was expected/,
		);
	});
});
