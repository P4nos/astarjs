import { Astar } from "./astar";
import { UI } from "./ui";
import "./style.css";

const numberOfColumns = 20;
const numberOfRows = 20;

const ui = new UI();
const astar = new Astar();

ui.subscribe(astar);
astar.subscribe(ui);

ui.initialize(numberOfColumns, numberOfRows);
