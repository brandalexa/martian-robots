import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COMMANDS } from "../src/commands.ts";
import type { Orientation, Position } from "../src/model.ts";

function at(orientation: Orientation): Position {
	return { x: 2, y: 2, orientation };
}

describe("commands", () => {
	describe("L turns left without moving", () => {
		const turns: [Orientation, Orientation][] = [
			["N", "W"],
			["W", "S"],
			["S", "E"],
			["E", "N"],
		];
		for (const [from, to] of turns) {
			it(`${from} -> ${to}`, () => {
				assert.deepEqual(COMMANDS.L(at(from)), at(to));
			});
		}
	});

	describe("R turns right without moving", () => {
		const turns: [Orientation, Orientation][] = [
			["N", "E"],
			["E", "S"],
			["S", "W"],
			["W", "N"],
		];
		for (const [from, to] of turns) {
			it(`${from} -> ${to}`, () => {
				assert.deepEqual(COMMANDS.R(at(from)), at(to));
			});
		}
	});

	describe("F moves one grid point in the direction faced", () => {
		const moves: [Orientation, Position][] = [
			["N", { x: 2, y: 3, orientation: "N" }],
			["E", { x: 3, y: 2, orientation: "E" }],
			["S", { x: 2, y: 1, orientation: "S" }],
			["W", { x: 1, y: 2, orientation: "W" }],
		];
		for (const [facing, expected] of moves) {
			it(facing, () => {
				assert.deepEqual(COMMANDS.F(at(facing)), expected);
			});
		}
	});
});
