import { COMMANDS } from "./commands.ts";
import type { Coordinate, Mission, RobotOutcome, RobotPlan } from "./model.ts";

/** Grid points robots have been lost from */
type Scents = Set<string>;

/**
 * Runs each robot's instructions sequentailly
 */
export function runMission(mission: Mission): RobotOutcome[] {
	const scents: Scents = new Set();
	return mission.robots.map((robot) =>
		runRobot(robot, mission.upperRight, scents),
	);
}

function runRobot(
	robot: RobotPlan,
	upperRight: Coordinate,
	scents: Scents,
): RobotOutcome {
	let position = robot.start;

	for (const instruction of robot.instructions) {
		const next = COMMANDS[instruction](position);
		if (isOnGrid(next, upperRight)) {
			position = next;
		} else if (!scents.has(scentKey(position))) {
			scents.add(scentKey(position));
			return { position, lost: true };
		}
		// A robot was already lost from here, so the move is ignored
	}

	return { position, lost: false };
}

function isOnGrid({ x, y }: Coordinate, upperRight: Coordinate): boolean {
	return x >= 0 && y >= 0 && x <= upperRight.x && y <= upperRight.y;
}

function scentKey({ x, y }: Coordinate): string {
	return `${x},${y}`;
}
