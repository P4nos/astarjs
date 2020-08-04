import { isEqual } from "lodash";

export class PriorityQueue {
  queuedElements = [];
  constructor() {
    this.queuedElements = [];
  }

  put(element: any, priority: number) {
    const queueElement = {
      element: element,
      priority: priority,
    };

    for (let i = 0; i < this.queuedElements.length; i++) {
      if (this.queuedElements[i].priority > queueElement.priority) {
        this.queuedElements.splice(i, 0, queueElement);
        return;
      }
    }
    this.queuedElements.push(queueElement);
  }

  get() {
    if (this.isEmpty()) {
      return;
    }
    return this.queuedElements.shift();
  }

  isEmpty() {
    return this.queuedElements.length === 0;
  }

  isInQueue(element: any) {
    return this.queuedElements.find((el) => isEqual(el.element, element));
  }
}
