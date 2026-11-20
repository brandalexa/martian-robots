import type {
	Coordinate,
	Instruction,
	Orientation,
	Position,
} from "./model.ts";

/**
 * Works out where an instruction would leave a robot.
 */
export type Command = (position: Position) => Position;

const LEFT_OF: Readonly<Record<Orientation, Orientation>> = {
	N: "W",
	W: "S",
	S: "E",
	E: "N",
};

const RIGHT_OF: Readonly<Record<Orientation, Orientation>> = {
	N: "E",
	E: "S",
	S: "W",
	W: "N",
};

const ONE_STEP: Readonly<Record<Orientation, Coordinate>> = {
	N: { x: 0, y: 1 },
	E: { x: 1, y: 0 },
	S: { x: 0, y: -1 },
	W: { x: -1, y: 0 },
};

/** The handler for each instruction letter. */
export const COMMANDS: Readonly<Record<Instruction, Command>> = {
	L: (position) => ({
		...position,
		orientation: LEFT_OF[position.orientation],
	}),
	R: (position) => ({
		...position,
		orientation: RIGHT_OF[position.orientation],
	}),
	F: (position) => {
		const step = ONE_STEP[position.orientation];
		return { ...position, x: position.x + step.x, y: position.y + step.y };
	},
};
