import { AstarEvents } from "./astar";

export enum UIEvent {
  GET_PATH = "get_path",
  SET_WALL = "set_wall",
  EDIT_CELL = "edit_cell",
  NEW_GRAPH = "new_graph",
  ASTAR_STEP = "astar_step",
  SET_START = "set_start",
  SET_GOAL = "set_goal",
  CAN_COMPUTE_PATH = "can_compute_path",
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export class UI implements Observer, Subscriber {
  numberOfColumns = 0;
  numberOfRows = 0;

  subscribers: Subscriber[];

  constructor(numberOfColumns?: number, numberOfRows?: number) {
    this.subscribers = [];

    this.numberOfColumns = numberOfColumns;
    this.numberOfRows = numberOfRows;
  }

  subscribe = (s: Subscriber) => {
    this.subscribers.push(s);
  };

  notifySubscribers = (event: { type: string; data: any }): void => {
    this.subscribers.forEach((s) => {
      s.update(event);
    });
  };

  update = (event: { type: string; data: any }) => {
    if (event.type === AstarEvents.PATH_FOUND) {
      this.drawPath(event.data);
    }
    if (event.type === AstarEvents.NEW_NEIGHBOURS) {
      this.drawNeighbours(event.data);
    }
  };

  createGrid(numberOfColumns: number, numberOfRows: number) {
    const parentNode = document.getElementById("container");
    const columnSize = Math.floor(window.innerHeight / numberOfColumns);
    parentNode.style.setProperty("--cols", numberOfColumns.toString());
    parentNode.style.setProperty("--rows", numberOfRows.toString());
    parentNode.style.setProperty("--cell-size", columnSize.toString() + "px");
  }

  createCells(numberOfRows: number, numberOfColumns: number) {
    const parentNode = document.getElementById("container");
    for (let i = 0; i < numberOfColumns * numberOfRows; i++) {
      const name = this.getNameFromIndex(i, numberOfColumns);
      this.createDiv(parentNode, name);
    }
  }

  getNameFromIndex(index: number, numberOfColumns: number): string {
    const firstDigit = Math.floor(index / numberOfColumns);
    const lastDigit = index % numberOfColumns;
    return `${firstDigit}-${lastDigit}`;
  }

  createDiv(parentNode: HTMLElement, name: string, classname = "item") {
    const element = document.createElement("div");
    element.className = classname;
    element.id = name;
    parentNode.append(element);
  }

  selectCells = (event: MouseEvent) => {
    if (event.buttons === 1) {
      const capturedCells: Set<HTMLElement> = new Set();
      capturedCells.add(event.target as HTMLElement);
      const elList = [];
      for (const cell of capturedCells.values()) {
        if (
          Object.values(cell.classList).includes("goal") ||
          Object.values(cell.classList).includes("start")
        ) {
          continue;
        }
        cell.classList.toggle("wall");
        elList.push(cell);
      }

      this.notifySubscribers({
        type: UIEvent.SET_WALL,
        data: {
          cellNameList: elList.map((el) => el.id),
          isWallList: elList.map((el) => el.classList.contains("wall")),
        },
      });
    }
  };

  toggleWall = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (
      Object.values(target.classList).includes("goal") ||
      Object.values(target.classList).includes("start")
    ) {
      return;
    }

    target.classList.toggle("wall");

    this.notifySubscribers({
      type: UIEvent.SET_WALL,
      data: {
        cellNameList: [target["id"]],
        isWallList: [target.classList.contains("wall")],
      },
    });
  };

  removeClassFromGrid = (className: string) => {
    const cells = document.getElementsByClassName(className);
    while (cells[0]) {
      cells[0].classList.remove(className);
    }
  };

  addClassByElement = (el: HTMLElement, className: string) => {
    el.classList.add(className);
  };

  removeClassByElement = (el: HTMLElement, className: string) => {
    el.classList.remove(className);
  };

  setStart = (event: MouseEvent) => {
    if (event.ctrlKey) {
      const computeBtn = document.getElementById("compute-path");
      const computeBtnStep = document.getElementById("compute-path-step");
      this.removeClassFromGrid("start");
      // set start
      this.addClassByElement(event.target as HTMLElement, "start");
      this.removeClassByElement(event.target as HTMLElement, "wall");

      this.notifySubscribers({
        type: UIEvent.SET_START,
        data: {
          start: event.target["id"],
        },
      });

      computeBtn.dispatchEvent(new CustomEvent("compute"));
      computeBtnStep.dispatchEvent(new CustomEvent("compute"));
      return;
    }
  };

  setGoal = (event: MouseEvent) => {
    if (event.shiftKey) {
      const computeBtn = document.getElementById("compute-path");
      const computeBtnStep = document.getElementById("compute-path-step");
      this.removeClassFromGrid("goal");
      // set goal
      this.addClassByElement(event.target as HTMLElement, "goal");
      this.removeClassByElement(event.target as HTMLElement, "wall");

      this.notifySubscribers({
        type: UIEvent.SET_GOAL,
        data: {
          goal: event.target["id"],
        },
      });

      computeBtn.dispatchEvent(new CustomEvent("compute"));
      computeBtnStep.dispatchEvent(new CustomEvent("compute"));
      return;
    }
  };

  attachEventListenerToCells = () => {
    const cells = document.getElementsByClassName("item");
    for (var i = 0; i < cells.length; i++) {
      cells[i].addEventListener("click", this.setStart, false);
      cells[i].addEventListener("click", this.setGoal, false);
      cells[i].addEventListener("click", this.toggleWall, false);
      cells[i].addEventListener(
        "mouseover",
        throttle(this.selectCells, 200),
        false
      );
    }
  };

  attachEventListenersToInputs = () => {
    // inputs
    const elements = document.getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
      elements[i].addEventListener("keyup", this.isEmpty, false);
    }

    // redraw grid button
    const button = document.getElementById("redraw") as HTMLButtonElement;
    button.addEventListener("click", this.redrawGrid, false);

    // compute path button
    const button2 = document.getElementById(
      "compute-path"
    ) as HTMLButtonElement;
    button2.addEventListener("click", this.getPath, false);
    button2.addEventListener("compute", (e) => {
      const start = document.getElementsByClassName("start");
      const goal = document.getElementsByClassName("goal");
      if (start.length > 0 && goal.length > 0) {
        button2.disabled = false;
        button2.classList.remove("button-disabled");

        this.notifySubscribers({
          type: UIEvent.CAN_COMPUTE_PATH,
          data: { can_compute: true },
        });
      }
    });

    // astar step
    const button3 = document.getElementById(
      "compute-path-step"
    ) as HTMLButtonElement;
    button3.addEventListener(
      "click",
      () => {
        this.notifySubscribers({
          type: UIEvent.ASTAR_STEP,
          data: {},
        });
      },
      false
    );

    button3.addEventListener("compute", (e) => {
      const start = document.getElementsByClassName("start");
      const goal = document.getElementsByClassName("goal");
      if (start.length > 0 && goal.length > 0) {
        button3.disabled = false;
        button3.classList.remove("button-disabled");
      }
    });
  };

  isEmpty = () => {
    const input1 = document.getElementById("sizeX") as HTMLInputElement;
    const input2 = document.getElementById("sizeY") as HTMLInputElement;
    const button = document.getElementById("redraw") as HTMLButtonElement;
    if (!parseInt(input1.value) || !parseInt(input2.value)) {
      button.disabled = true;
      button.classList.add("button-disabled");

      return;
    }
    button.disabled = false;
    button.classList.remove("button-disabled");
  };

  getPath = () => {
    this.notifySubscribers({
      type: UIEvent.GET_PATH,
      data: {},
    });
  };

  initialize = (numberOfColumns: number, numberOfRows: number) => {
    this.clearCells();

    this.createGrid(numberOfColumns, numberOfRows);
    this.createCells(numberOfColumns, numberOfRows);
    this.attachEventListenerToCells();
    this.attachEventListenersToInputs();

    this.notifySubscribers({
      type: UIEvent.NEW_GRAPH,
      data: { columns: numberOfColumns, rows: numberOfRows },
    });
  };

  clearCells = () => {
    const cells = document.getElementsByClassName("item");
    while (cells[0]) {
      cells[0].parentNode.removeChild(cells[0]);
    }
  };

  redrawGrid = () => {
    this.clearCells();

    const x = document.getElementById("sizeX") as HTMLInputElement;
    const y = document.getElementById("sizeY") as HTMLInputElement;
    const cols = x.value.length > 0 ? parseInt(x.value) : this.numberOfColumns;
    const rows = y.value.length > 0 ? parseInt(y.value) : this.numberOfRows;
    this.initialize(cols, rows);
  };

  drawPath = (path: string[]) => {
    this.removeClassFromGrid("selected");

    for (const cellId of path) {
      let el = document.getElementById(cellId);
      el.classList.add("selected");
    }
  };

  clearNeighbours = () => {
    const cells = document.getElementsByClassName("neighbour");
    while (cells[0]) {
      cells[0]["innerText"] = "";
      cells[0].classList.remove("neighbour");
    }
  };

  drawNeighbours = (cost: string[]) => {
    this.clearNeighbours();

    for (const cellId of Object.keys(cost)) {
      let el = document.getElementById(cellId);
      el.classList.add("neighbour");
      el.innerText = cost[cellId];
    }
  };
}
