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

	it("accepts a world with no robots", () => {
		assert.deepEqual(parse("5 3\n"), {
			upperRight: { x: 5, y: 3 },
			robots: [],
		});
	});

	it("accepts input without a final newline", () => {
		assert.deepEqual(parse(SAMPLE_INPUT.trimEnd()), parse(SAMPLE_INPUT));
	});

	it("accepts Windows line endings", () => {
		assert.deepEqual(
			parse(SAMPLE_INPUT.replaceAll("\n", "\r\n")),
			parse(SAMPLE_INPUT),
		);
	});

	it("ignores blank lines at the end", () => {
		assert.deepEqual(parse(`${SAMPLE_INPUT}\n \n\n`), parse(SAMPLE_INPUT));
	});

	it("ignores extra whitespace around and between values", () => {
		assert.deepEqual(parse(" 5\t 3 \n 1   1  E \n RF \n"), {
			upperRight: { x: 5, y: 3 },
			robots: [
				{ start: { x: 1, y: 1, orientation: "E" }, instructions: ["R", "F"] },
			],
		});
	});

	it("treats a blank instruction line as no instructions", () => {
		const { robots } = parse("5 3\n1 1 E\n\n2 2 N\nF\n3 3 S\n\n");

		assert.deepEqual(
			robots.map((robot) => robot.instructions),
			[[], ["F"], []],
		);
	});

	it("accepts values at the brief's limits", () => {
		const { upperRight, robots } = parse(
			`50 50\n50 50 N\n${"F".repeat(99)}\n0 0 S\nL\n`,
		);

		assert.deepEqual(upperRight, { x: 50, y: 50 });
		assert.deepEqual(robots[0]?.start, { x: 50, y: 50, orientation: "N" });
		assert.equal(robots[0]?.instructions.length, 99);
	});

	it("accepts a single-point world", () => {
		const { upperRight, robots } = parse("0 0\n0 0 N\nF\n");

		assert.deepEqual(upperRight, { x: 0, y: 0 });
		assert.deepEqual(robots[0]?.start, { x: 0, y: 0, orientation: "N" });
	});

	describe("rejects", () => {
		const cases: {
			name: string;
			input: string;
			line: number;
			message: RegExp;
		}[] = [
			{ name: "empty input", input: "", line: 1, message: /input is empty/ },
			{
				name: "input with only blank lines",
				input: "\n  \n",
				line: 1,
				message: /input is empty/,
			},
			{
				name: "a blank first line",
				input: "\n5 3\n",
				line: 1,
				message: /expected grid size "<x> <y>", got ""/,
			},
			{
				name: "a grid with one value",
				input: "5\n",
				line: 1,
				message: /expected grid size "<x> <y>", got "5"/,
			},
			{
				name: "a grid with three values",
				input: "5 3 1\n",
				line: 1,
				message: /expected grid size/,
			},
			{
				name: "a non-numeric grid size",
				input: "5 y\n",
				line: 1,
				message: /y must be a whole number from 0 to 50, got "y"/,
			},
			{
				name: "a negative grid size",
				input: "-1 3\n",
				line: 1,
				message: /x must be a whole number from 0 to 50, got "-1"/,
			},
			{
				name: "a fractional grid size",
				input: "5.5 3\n",
				line: 1,
				message: /x must be a whole number/,
			},
			{
				name: "a grid size above 50",
				input: "51 3\n",
				line: 1,
				message: /x must be a whole number from 0 to 50, got "51"/,
			},
			{
				name: "a position without an orientation",
				input: "5 3\n1 1\nF\n",
				line: 2,
				message: /expected robot position "<x> <y> <orientation>", got "1 1"/,
			},
			{
				name: "a position with extra values",
				input: "5 3\n1 1 E E\nF\n",
				line: 2,
				message: /expected robot position/,
			},
			{
				name: "an unknown orientation",
				input: "5 3\n1 1 X\nF\n",
				line: 2,
				message: /orientation must be one of N, E, S, W, got "X"/,
			},
			{
				name: "a lowercase orientation",
				input: "5 3\n1 1 e\nF\n",
				line: 2,
				message: /orientation must be one of N, E, S, W, got "e"/,
			},
			{
				name: "a robot starting east of the grid",
				input: "5 3\n6 1 E\nF\n",
				line: 2,
				message: /x must be a whole number from 0 to 5, got "6"/,
			},
			{
				name: "a robot starting north of the grid",
				input: "5 3\n1 4 N\nF\n",
				line: 2,
				message: /y must be a whole number from 0 to 3, got "4"/,
			},
			{
				name: "a robot without an instruction line",
				input: "5 3\n1 1 E\n",
				line: 2,
				message: /robot has no instruction line/,
			},
			{
				name: "an unknown instruction",
				input: "5 3\n1 1 E\nRFX\n",
				line: 3,
				message: /unknown instruction "X", expected one of L, R, F/,
			},
			{
				name: "a lowercase instruction",
				input: "5 3\n1 1 E\nrf\n",
				line: 3,
				message: /unknown instruction "r"/,
			},
			{
				name: "instructions of 100 characters",
				input: `5 3\n1 1 E\n${"F".repeat(100)}\n`,
				line: 3,
				message: /instructions must be at most 99 characters, got 100/,
			},
			{
				name: "a blank line between robots",
				input: "5 3\n1 1 E\nF\n\n2 2 N\nF\n",
				line: 4,
				message: /blank line where a robot position was expected/,
			},
			{
				name: "an error in a later robot, reporting its line",
				input: `${SAMPLE_INPUT}1 1 Q\nF\n`,
				line: 8,
				message: /orientation must be one of N, E, S, W, got "Q"/,
			},
		];

		for (const { name, input, line, message } of cases) {
			it(name, () => {
				assert.throws(() => parse(input), {
					name: "ParseError",
					line,
					message,
				});
			});
		}
	});
});
