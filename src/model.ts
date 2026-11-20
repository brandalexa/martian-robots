/** Compass orientations, in clockwise order. */
export const ORIENTATIONS = ["N", "E", "S", "W"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/**
 * Every instruction letter robots understand. New command types start here,
 * and the compiler will then ask for a handler in `COMMANDS`.
 */
export const INSTRUCTIONS = ["L", "R", "F"] as const;
export type Instruction = (typeof INSTRUCTIONS)[number];

export interface Coordinate {
	readonly x: number;
	readonly y: number;
}

/** A grid coordinate plus the way the robot is facing. */
export interface Position extends Coordinate {
	readonly orientation: Orientation;
}

export interface RobotPlan {
	readonly start: Position;
	readonly instructions: readonly Instruction[];
}

/** The world's bounds and the robots to run on it, in order. */
export interface Mission {
	/** The lower-left corner is always (0, 0). */
	readonly upperRight: Coordinate;
	readonly robots: readonly RobotPlan[];
}

export interface RobotOutcome {
	/** Where the robot finished, or the last grid point it held if lost. */
	readonly position: Position;
	readonly lost: boolean;
}
