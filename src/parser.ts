import { ParseError } from "./errors.ts";
import {
	type Coordinate,
	INSTRUCTIONS,
	type Instruction,
	type Mission,
	ORIENTATIONS,
	type Position,
	type RobotPlan,
} from "./model.ts";

export const MAX_COORDINATE = 50;
export const MAX_INSTRUCTION_LENGTH = 99;

const WHITESPACE = /\s+/;
const WHOLE_NUMBER = /^\d+$/;

interface Line {
	/** The line's content, without surrounding whitespace. */
	readonly text: string;
	/** 1-based line number in the original input. */
	readonly number: number;
}

/**
 * Parses the world size and robot plans from the brief's input format.
 *
 * Blank lines are only allowed as an empty instruction line (a robot that
 * doesn't move) or at the end of the input.
 *
 * @throws {ParseError} if the input is malformed or exceeds the brief's limits.
 */
export function parse(input: string): Mission {
	const lines = splitLines(input);
	const [gridLine, ...robotLines] = lines;
	if (gridLine === undefined || lines.every(isBlank)) {
		throw new ParseError("input is empty", 1);
	}

	const upperRight = parseGrid(gridLine);
	return { upperRight, robots: parseRobots(robotLines, upperRight) };
}

function splitLines(input: string): Line[] {
	const texts = input.split(/\r?\n/);
	// A final newline ends the last line rather than starting an empty one.
	if (texts.at(-1) === "") {
		texts.pop();
	}
	return texts.map((text, index) => ({ text: text.trim(), number: index + 1 }));
}

function isBlank(line: Line): boolean {
	return line.text === "";
}

function parseGrid(line: Line): Coordinate {
	const [x, y, ...extra] = line.text.split(WHITESPACE);
	if (x === undefined || y === undefined || extra.length > 0) {
		throw new ParseError(
			`expected grid size "<x> <y>", got "${line.text}"`,
			line.number,
		);
	}
	return {
		x: parseCoordinate(x, "x", MAX_COORDINATE, line),
		y: parseCoordinate(y, "y", MAX_COORDINATE, line),
	};
}

function parseRobots(
	lines: readonly Line[],
	upperRight: Coordinate,
): RobotPlan[] {
	const robots: RobotPlan[] = [];
	let pending: { start: Position; line: Line } | undefined;
	let firstBlank: Line | undefined;

	for (const line of lines) {
		if (pending !== undefined) {
			robots.push({
				start: pending.start,
				instructions: parseInstructions(line),
			});
			pending = undefined;
		} else if (isBlank(line)) {
			firstBlank ??= line;
		} else if (firstBlank !== undefined) {
			throw new ParseError(
				"blank line where a robot position was expected",
				firstBlank.number,
			);
		} else {
			pending = { start: parsePosition(line, upperRight), line };
		}
	}

	if (pending !== undefined) {
		throw new ParseError("robot has no instruction line", pending.line.number);
	}
	return robots;
}

function parsePosition(line: Line, upperRight: Coordinate): Position {
	const [x, y, orientation, ...extra] = line.text.split(WHITESPACE);
	if (
		x === undefined ||
		y === undefined ||
		orientation === undefined ||
		extra.length > 0
	) {
		throw new ParseError(
			`expected robot position "<x> <y> <orientation>", got "${line.text}"`,
			line.number,
		);
	}

	const start = {
		x: parseCoordinate(x, "x", upperRight.x, line),
		y: parseCoordinate(y, "y", upperRight.y, line),
	};
	if (!isOneOf(ORIENTATIONS, orientation)) {
		throw new ParseError(
			`orientation must be one of ${ORIENTATIONS.join(", ")}, got "${orientation}"`,
			line.number,
		);
	}
	return { ...start, orientation };
}

function parseInstructions(line: Line): Instruction[] {
	if (line.text.length > MAX_INSTRUCTION_LENGTH) {
		throw new ParseError(
			`instructions must be at most ${MAX_INSTRUCTION_LENGTH} characters, got ${line.text.length}`,
			line.number,
		);
	}
	return Array.from(line.text, (letter) => {
		if (!isOneOf(INSTRUCTIONS, letter)) {
			throw new ParseError(
				`unknown instruction "${letter}", expected one of ${INSTRUCTIONS.join(", ")}`,
				line.number,
			);
		}
		return letter;
	});
}

function parseCoordinate(
	token: string,
	axis: "x" | "y",
	max: number,
	line: Line,
): number {
	const value = Number(token);
	if (!WHOLE_NUMBER.test(token) || value > max) {
		throw new ParseError(
			`${axis} must be a whole number from 0 to ${max}, got "${token}"`,
			line.number,
		);
	}
	return value;
}

function isOneOf<T extends string>(
	values: readonly T[],
	value: string,
): value is T {
	return (values as readonly string[]).includes(value);
}
