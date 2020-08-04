import { Cell, Grid } from "./grid";
import { PriorityQueue } from "./priority-queue";
import { UIEvent } from "./ui";

export enum AstarEvents {
  NEXT_STEP = "next_step",
  PATH_FOUND = "path_found",
  NEW_NEIGHBOURS = "new_neighbours",
}

export class Astar implements Observer, Subscriber {
  subscribers: Subscriber[] = [];
  grid: Grid;
  aGen;
  startCell: string;
  goalCell: string;

  constructor() {
    this.subscribers = [];
    this.grid = new Grid();
    this.aGen = null;
    this.startCell = "";
    this.goalCell = "";
  }
  subscribe = (s: Subscriber) => {
    this.subscribers.push(s);
  };

  notifySubscribers = (event: { type: string; data: any }) => {
    this.subscribers.forEach((s) => {
      s.update(event);
    });
  };

  update = (event: { type: string; data: any }) => {
    if (event.type === UIEvent.NEW_GRAPH) {
      this.setGoal("");
      this.setStart("");
      const { columns, rows } = event.data;
      this.grid.createGrid(columns, rows);
    }

    if (event.type === UIEvent.GET_PATH) {
      const path = this.astar();

      this.notifySubscribers({
        type: AstarEvents.PATH_FOUND,
        data: path,
      });
    }

    if (event.type === UIEvent.SET_WALL) {
      const { cellNameList, isWallList } = event.data;
      this.grid.updateWall(cellNameList, isWallList);
    }

    if (event.type === UIEvent.SET_START) {
      this.setStart(event.data.start);
    }

    if (event.type === UIEvent.SET_GOAL) {
      this.setGoal(event.data.goal);
    }

    if (event.type === UIEvent.CAN_COMPUTE_PATH) {
      this.aGen = this.astarStep();
    }

    if (event.type === UIEvent.ASTAR_STEP) {
      const { path, done } = this.aGen.next();
      if (!done) {
        this.notifySubscribers({
          type: AstarEvents.NEW_NEIGHBOURS,
          data: path,
        });
        return;
      }

      if (path != null) {
        this.notifySubscribers({
          type: AstarEvents.PATH_FOUND,
          data: path,
        });
      }
    }
  };

  setGoal(goal: string) {
    this.goalCell = goal;
  }

  setStart(start: string) {
    this.startCell = start;
  }

  heuristic(
    cell: Cell,
    destination: Cell,
    gridSizeX: number,
    gridSizeY: number
  ) {
    // use the following expression to break seach ties. This will force astar to
    // look closer to the goal rather that the start.
    const p = 1 / Math.sqrt(Math.pow(gridSizeX, 2) + Math.pow(gridSizeY, 2));
    const D = 1 + p;
    return Math.round(
      // Manhattan distance
      D * (Math.abs(cell.x - destination.x) + Math.abs(cell.y - destination.y))
    );
  }

  movementCost(current, neighbour) {
    return 1;
  }

  reconstructPath(cameFrom: any, start: string, destination: string) {
    let current = destination;
    const path = [];
    while (current != start) {
      path.push(current);
      current = cameFrom[current];
    }

    path.push(start);
    path.reverse();
    return path;
  }

  astar(): string[] {
    const closedList: string[] = [];
    const cameFrom = {};
    const costSoFar = {};
    const openList = new PriorityQueue();

    const grid = this.grid;
    const start = grid.getCellByName(this.startCell);
    const destination = grid.getCellByName(this.goalCell);

    openList.put(start, 0);
    cameFrom[start.name] = null;
    costSoFar[start.name] = 0;

    while (!openList.isEmpty()) {
      const current = openList.get().element;
      closedList.push(current.name);

      if (current.name === destination.name) {
        break;
      }

      // get the neighbours of the cell
      const neighbours = grid.getNeighbours(current);
      for (const neighbour of neighbours) {
        let newCost =
          costSoFar[current.name] + this.movementCost(current, neighbour);

        if (
          !Object.keys(costSoFar).includes(neighbour.name) ||
          newCost < costSoFar[neighbour.name]
        ) {
          costSoFar[neighbour.name] = newCost;
          cameFrom[neighbour.name] = current.name;
          let priority =
            newCost +
            this.heuristic(neighbour, destination, grid.sizeX, grid.sizeY);

          openList.put(neighbour, priority);
        }
      }
    }
    this.notifySubscribers({
      type: AstarEvents.NEW_NEIGHBOURS,
      data: costSoFar,
    });

    return this.reconstructPath(cameFrom, start.name, destination.name);
  }

  astarStep = () => {
    const closedList: string[] = [];
    const cameFrom = {};
    const costSoFar = {};
    const openList = new PriorityQueue();
    const grid = this.grid;
    const start = grid.getCellByName(this.startCell);
    const destination = grid.getCellByName(this.goalCell);

    openList.put(start, 0);
    cameFrom[start.name] = null;
    costSoFar[start.name] = 0;

    return {
      next: () => {
        if (openList.isEmpty()) {
          return { path: null, done: true };
        }

        const current = openList.get().element;
        closedList.push(current.name);

        if (current.name === destination.name) {
          const finalPath = this.reconstructPath(
            cameFrom,
            start.name,
            destination.name
          );
          return { path: finalPath, done: true };
        }

        // get the neighbours of the cell
        const neighbours = grid.getNeighbours(current);
        for (const neighbour of neighbours) {
          let newCost =
            costSoFar[current.name] + this.movementCost(current, neighbour);

          if (
            !Object.keys(costSoFar).includes(neighbour.name) ||
            newCost < costSoFar[neighbour.name]
          ) {
            costSoFar[neighbour.name] = newCost;
            cameFrom[neighbour.name] = current.name;
            let priority =
              newCost +
              this.heuristic(neighbour, destination, grid.sizeX, grid.sizeY);

            openList.put(neighbour, priority);
          }
        }
        return { path: costSoFar, done: false };
      },
    };
  };
}
