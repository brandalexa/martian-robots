# Martian Robots

## Running it

Needs Node 26 or later, which runs the TypeScript directly, so there's nothing to build or install.

- `nvm use`
- `node src/cli.ts examples/sample-input.txt`
- `node src/cli.ts < examples/sample-input.txt` to read from stdin

## Testing

- `npm test`
- `npm run typecheck` (run `npm install` first)
- `npm run format` to format and lint with Biome

## Decisions and assumptions

- A scent blocks every move off the grid from its point, whichever way the robot is facing. My reasoning for this is it would give different results at corners if orientation was tracked here. Potentially a future extension case, though.
- A lost robot reports the last grid point it was on, which is also where it leaves its scent. Its remaining instructions are ignored.
- Robots never collide, and can occupy the same space.
- A robot that starts off the grid is rejected.
- Input is case-sensitive: orientations and instructions must be uppercase, coordinates whole numbers up to 50, and instruction lines under 100 characters. A blank instruction line means "don't move", and blank lines are otherwise only allowed at the end.
- Invalid input is reported on stderr with its line number and exit status 1. Anything else is a bug, so it still crashes with a stack trace.
- A new instruction type needs a letter in `src/model.ts` and a function in `COMMANDS` in `src/commands.ts`.
- Turning and moving are lookup tables keyed by orientation rather than performing calculations, so each rule can be checked by reading it, and a new command such as moving backwards could reuse them.

## Future extensions

Commands can only see the robot's position. A command that needs to know about the world, such as one that checks scents or other robots, or one that moves several points at once, would need a wider `Command` signature. 

It would be useful to also store the orientation of a robot on the grid point at which it was lost, as this could help build up a picture of the environment. For instance, a cliff edge in one direction could still be safe to traverse in other directions.

Collision detection, and allowing robots to move in parallel
