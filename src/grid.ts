export class Cell {
  name: string = "";
  x: number = null;
  y: number = null;
  isWall: boolean = null;
  constructor(x: number, y: number, isWall = false) {
    this.x = x;
    this.y = y;
    this.isWall = isWall;
    this.name = `${x}-${y}`;
  }
}

export class Grid {
  sizeX: number = null;
  sizeY: number = null;
  cells: Cell[] = [];
  walls: string[] = [];

  constructor() {
    this.cells = [];
    this.walls = [];
  }

  createGrid(sizeX: number, sizeY: number): void {
    // clear old cells
    this.cells = [];
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    for (let x = 0; x < sizeX; x++) {
      for (let y = 0; y < sizeY; y++) {
        let cell = new Cell(x, y);
        this.cells.push(cell);
      }
    }
  }

  private isWall(cellName: string): boolean {
    return this.walls.includes(cellName);
  }

  getNeighbours(cell: Cell): Cell[] {
    let x = cell.x;
    let y = cell.y;
    // create neighbours
    let res = [
      this.getCellByName(`${x - 1}-${y}`),
      this.getCellByName(`${x}-${y - 1}`),
      this.getCellByName(`${x}-${y + 1}`),
      this.getCellByName(`${x + 1}-${y}`),
    ];
    res = res.filter((c) => c != undefined); // remove out of range Cells
    res = res.filter((c) => !this.isWall(c.name));
    return res;
  }

  getGrid(): Cell[] {
    return this.cells;
  }

  updateWall = (cellNameList: string[], isWallList: boolean[]): void => {
    for (let i = 0; i < cellNameList.length; i++) {
      const isWall = isWallList[i];
      const cellName = cellNameList[i];

      if (isWall) {
        this.walls.push(cellName);
      } else {
        const index = this.walls.indexOf(cellName);
        if (index < 0) {
          return;
        }
        this.walls.splice(index, 1);
      }

      const cell = this.getCellByName(cellName);
      cell.isWall = isWall;
    }
  };

  removeWalls(): void {
    this.walls = [];
  }

  getCellByName(cellName: string): Cell {
    return this.cells.find((cell) => cell.name === cellName);
  }
}
