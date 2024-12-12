export class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isVisited = false;
        this.distance = Infinity;
        this.previousNode = null;
        this.f = Infinity; // A*算法使用
        this.g = Infinity; // A*算法使用
        this.h = Infinity; // A*算法使用
    }

    reset() {
        this.isVisited = false;
        this.distance = Infinity;
        this.previousNode = null;
        this.f = Infinity;
        this.g = Infinity;
        this.h = Infinity;
    }

    resetPathfinding() {
        this.isVisited = false;
        this.distance = Infinity;
        this.previousNode = null;
        this.f = Infinity;
        this.g = Infinity;
        this.h = Infinity;
    }

    toString() {
        return `Node(${this.row},${this.col})`;
    }

    equals(other) {
        return this.row === other.row && this.col === other.col;
    }
} 