import { parse } from "./parser.ts";

/**
 * Runs the Martian robots simulation described by `input` and returns the
 * report to print, one line per robot.
 *
 * Placeholder: the input is parsed, so invalid input is rejected, but valid
 * input is echoed back unchanged until the robots are simulated.
 *
 * @throws {ParseError} if the input is malformed.
 */
export function simulate(input: string): string {
	parse(input);
	return input;
}
