const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsH = 8;
const cellsY = 6;

const width = window.innerWidth;

const height = window.innerHeight;

const unitLengthX = width / cellsH;
const unitLengthY = height / cellsY;

const engine = Engine.create();

const { world } = engine;
engine.world.gravity.y = 0;
const render = Render.create({
	element: document.body,

	engine: engine,

	options: {
		wireframes: false,

		width,

		height
	}
});

Render.run(render);

Runner.run(Runner.create(), engine);

// Walls

const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true, label: 'topwall' }),

	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),

	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),

	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze generation

const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];

		arr[counter] = arr[index];

		arr[index] = temp;
	}

	return arr;
};

const grid = Array(cellsY).fill(null).map(() => Array(cellsH).fill(false));

const verticals = Array(cellsY).fill(null).map(() => Array(cellsH - 1).fill(false));

const horizontals = Array(cellsY - 1).fill(null).map(() => Array(cellsH).fill(false));

const startRow = Math.floor(Math.random() * cellsY);

const startColumn = Math.floor(Math.random() * cellsH);

const stepThroughCell = (row, column) => {
	// If i have visted the cell at [row, column], then return

	if (grid[row][column]) {
		return;
	}

	// Mark this cell as being visited

	grid[row][column] = true;

	// Assemble randomly-ordered list of neighbors

	const neighbors = shuffle([
		[ row - 1, column, 'up' ],

		[ row, column + 1, 'right' ],

		[ row + 1, column, 'down' ],

		[ row, column - 1, 'left' ]
	]);

	// For each neighbor....

	for (let neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;

		// See if that neighbor is out of bounds

		if (nextRow < 0 || nextRow >= cellsY || nextColumn < 0 || nextColumn >= cellsH) {
			continue;
		}

		// If we have visited that neighbor, continue to next neighbor

		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// Remove a wall from either horizontals or verticals

		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}

		stepThroughCell(nextRow, nextColumn);
	}

	// Visit that next cell
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			4,
			{
				isStatic: true,
				label: 'wall'
			}
		);

		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			4,
			unitLengthY,
			{
				isStatic: true,
				label: 'wall'
			}
		);

		World.add(world, wall);
	});
});

const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.7, unitLengthY * 0.7, {
	isStatic: true,
	label: 'goal'
});
World.add(world, goal);
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, { label: 'ball' });
World.add(world, ball);

document.addEventListener('keydown', (e) => {
	const { x, y } = ball.velocity;

	if (e.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	if (e.keyCode === 68) {
		Body.setVelocity(ball, { x: x + 5, y });
	}
	if (e.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	if (e.keyCode === 65) {
		Body.setVelocity(ball, { x: x - 5, y });
	}
});

Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			console.log('you won');
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
console.log(world.bodies);
