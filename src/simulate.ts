import { runMission } from "./mission.ts";
import type { RobotOutcome } from "./model.ts";
import { parse } from "./parser.ts";

/**
 * Runs the Martian robots simulation described by `input` and returns the
 * report to print, one line per robot: `x y orientation`, followed by `LOST`
 * if the robot fell off the grid.
 *
 * @throws {ParseError} if the input is malformed.
 */
export function simulate(input: string): string {
	return runMission(parse(input)).map(formatOutcome).join("\n");
}

function formatOutcome({ position, lost }: RobotOutcome): string {
	const { x, y, orientation } = position;
	return lost ? `${x} ${y} ${orientation} LOST` : `${x} ${y} ${orientation}`;
}
