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
 * Blank lines are only allowed at the end of the input, so every robot has a
 * non-empty instruction line.
 *
 * @throws {ParseError} if the input is malformed or exceeds the brief's limits.
 */
export function parse(input: string): Mission {
	const [gridLine, ...robotLines] = withoutTrailingBlankLines(
		splitLines(input),
	);
	if (gridLine === undefined) {
		throw new ParseError("input is empty", 1);
	}

	const upperRight = parseGrid(gridLine);
	return { upperRight, robots: parseRobots(robotLines, upperRight) };
}

function splitLines(input: string): Line[] {
	return input
		.split(/\r?\n/)
		.map((text, index) => ({ text: text.trim(), number: index + 1 }));
}

function withoutTrailingBlankLines(lines: readonly Line[]): Line[] {
	const lastContentIndex = lines.findLastIndex((line) => !isBlank(line));
	return lines.slice(0, lastContentIndex + 1);
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
	// Each robot spans two lines, so the loop body takes the instruction line
	// from the same iterator.
	const remaining = lines.values();
	for (const positionLine of remaining) {
		const start = parsePosition(positionLine, upperRight);
		const instructionLine = remaining.next().value;
		if (instructionLine === undefined) {
			throw new ParseError(
				"robot has no instruction line",
				positionLine.number,
			);
		}
		robots.push({ start, instructions: parseInstructions(instructionLine) });
	}
	return robots;
}

function parsePosition(line: Line, upperRight: Coordinate): Position {
	if (isBlank(line)) {
		throw new ParseError(
			"blank line where a robot position was expected",
			line.number,
		);
	}

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
		x: parseStartCoordinate(x, "x", upperRight.x, line),
		y: parseStartCoordinate(y, "y", upperRight.y, line),
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
	if (isBlank(line)) {
		throw new ParseError(
			"blank line where robot instructions were expected",
			line.number,
		);
	}
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

/** A robot's starting coordinate must be within the brief's limit and on the grid. */
function parseStartCoordinate(
	token: string,
	axis: "x" | "y",
	gridMax: number,
	line: Line,
): number {
	const value = parseCoordinate(token, axis, MAX_COORDINATE, line);
	if (value > gridMax) {
		throw new ParseError(
			`start ${axis} ${value} is outside the grid (0 to ${gridMax})`,
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
