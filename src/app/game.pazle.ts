import { isNull } from "util";

class Point
{
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distance(point: Point) {
        return Math.abs(Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)));
    }

    delta(point: Point) {
        return new Point(point.x - this.x, point.y - this.y);
    }

    add(point: Point) {
        this.x += point.x;
        this.y += point.y;
    }
}

class GridPoint
{
    index: string;
    row: number;
    col: number;
    gridSettings: any;

    constructor(row: number, col: number, gridSettings) {
        this.index = col + ',' + row;
        this.row = row;
        this.col = col;
        this.gridSettings = gridSettings;
    }

    getTop(): GridPoint|null {
        if (this.row > this.gridSettings.rowMin) {
            return new GridPoint(this.row - 1, this.col, this.gridSettings)
        }
        return null;
    }

    getBottom(): GridPoint|null {
        if (this.row < this.gridSettings.rowMax) {
            return new GridPoint(this.row + 1, this.col, this.gridSettings)
        }
        return null;
    }

    getLeft(): GridPoint|null {
        if (this.col > this.gridSettings.colMin) {
            return new GridPoint(this.row, this.col - 1, this.gridSettings)
        }
        return null;
    }

    getRight(): GridPoint|null {
        if (this.col < this.gridSettings.colMax) {
            return new GridPoint(this.row, this.col + 1, this.gridSettings)
        }
        return null;
    }
}

class Grid
{
    rows: number;
    cols: number;
    tiles: Map<string, Tile>;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.tiles = this.generateTiles();
    }

    generateTiles(tileSize = 100, tileGap = 50) {
        let index = 1;
        let gridSettings = {
            rowMin: 0,
            colMin: 0,
            rowMax: this.rows - 1,
            colMax: this.cols - 1,
            tileSize: tileSize,
            tileGap: tileGap,
        }
        let tiles = new Map();
        for (let rows = gridSettings.rowMin; rows < gridSettings.rowMax; rows++) {
            for (let cols = gridSettings.colMin; cols < gridSettings.colMax; cols++) {
                let gridPoint = new GridPoint(rows, cols, gridSettings);
                let point = new Point(rows * tileSize + rows * tileGap, cols * tileSize + cols * tileGap);
                tiles.set(gridPoint.index, new Tile(index, gridPoint, point));
                index++;
            }
        }
        return tiles;
    }

    // найти все возможные пары сцеплений, 
    // обойти все и найти совпадение координат пары по допустимой ошибке,
    // если совпадение есть склеить тайлы/группы тайлов и запустить заново
    // если совпадений нет закончить выполнение
    findMatch(tile: Tile|TileComposite, tolerance = 20) {
        for (let [index, pair] of tile.getNeighborsPair(this.tiles)) {
            if (pair.source.position.distance(pair.target.position) < tolerance) {
                tile = this.findMatch(pair.source.union(pair.target), tolerance);
                break;
            }
        }
        return tile;
    }
}

// 0,0; 0,1; 0,2
// 1,0; 1,1; 1,2
// 2,0; 2,1; 2,2 

interface TileI {
    positionAdd(point: Point): void;
    getNeighborsPair(tiles: Map<string, Tile>): Map<string, TilePair>;
    getNeighbors(): Map<string, GridPoint>;
    union(tile: Tile|TileComposite): TileComposite
}

class Tile implements TileI
{
    index: number;
    gridPosition: GridPoint;
    position: Point;
    parent: null|TileComposite;

    constructor(index: number, gridPosition: GridPoint, position: Point) {
        this.index = index;
        this.gridPosition = gridPosition;
        this.position = position;
        this.parent = null;
    }

    positionAdd(point: Point) {
        this.position.add(point);
    }

    getNeighbors(): Map<string, GridPoint> {
        let neighbors: Map<string, GridPoint> = new Map();
        let top = this.gridPosition.getTop();
        if (top !== null) {
            neighbors.set(top.index, top);
        }
        let bottom = this.gridPosition.getBottom();
        if (bottom !== null) {
            neighbors.set(bottom.index, bottom);
        }
        let left = this.gridPosition.getLeft();
        if (left !== null) {
            neighbors.set(left.index, left);
        }
        let right = this.gridPosition.getRight();
        if (right !== null) {
            neighbors.set(right.index, right);
        }
        return neighbors;
    }

    getNeighborsPair(tiles: Map<string, Tile>): Map<string, TilePair> {
        let pairs: Map<string, TilePair> = new Map();
        this.getNeighbors().forEach(gridPoint => {
            let pair = new TilePair(this, tiles.get(gridPoint.index));
            let indexCombain = this.gridPosition.index + '::' + gridPoint.index;
            pairs.set(indexCombain, pair);
        });
        return pairs;
    }

    hasParent(): boolean {
        return !isNull(this.parent);
    }

    union(tile: Tile|TileComposite) {
        if (this.hasParent) {
            this.parent.union(tile);
            return this.parent;
        } else {
            let tileComposit = new TileComposite(this);
            this.parent.union(tile);
            return tileComposit;
        }
    }
}

class TileComposite implements TileI
{
    tiles: Map<string, Tile> = new Map();

    constructor(tile: Tile) {
        tile.parent = this;
        this.tiles.set(tile.gridPosition.index, tile);
    }

    addTile(tile: Tile) {
        tile.parent = this;
        this.tiles.set(tile.gridPosition.index, tile);
    }

    positionAdd(point: Point) {
        this.tiles.forEach(tile => {
            tile.position.add(point);
        });
    }

    getNeighbors(): Map<string, GridPoint> {
        let neighbors: Map<string, GridPoint> = new Map();
        this.tiles.forEach(tile => {
            for (const [index, gridPoint] of tile.getNeighbors()) {
                // пропустить тайлы уже состоящие в группе
                if (this.tiles.get(index) === undefined) {
                    neighbors.set(index, gridPoint);
                }
            }
        });
        return neighbors;
    }

    getNeighborsPair(tiles: Map<string, Tile>): Map<string, TilePair> { // tiles из глобального стейта
        let pairs: Map<string, TilePair> = new Map();
        for (const [index, tile] of this.tiles) {
            this.getNeighbors().forEach(gridPoint => {
                let pair = new TilePair(tile, tiles.get(gridPoint.index));
                let indexCombain = index + '::' + gridPoint.index;
                pairs.set(indexCombain, pair);
            });
        }
        return pairs;
    }

    union(tile: Tile|TileComposite) {
        if (tile instanceof Tile) {
            tile.parent = this;
            this.tiles.set(tile.gridPosition.index, tile);
        } else {
            tile.tiles.forEach(tile => {
                tile.parent = this;
                this.tiles.set(tile.gridPosition.index, tile);
            })
        }
        return this;
    }
}

class TilePair
{
    source: Tile;
    target: Tile;

    constructor(source: Tile, target: Tile) {
        this.source = source;
        this.target = target;
    }

    getDestination(): Point {
        return ;
    }

    // перетаскивать все тайлы к тому который брошен (source)
    union() {
        let sourcePosition = this.source.position; // позиция источника
        let targetPosition = this.target.position; // текущая позиция цели
        let destination; // необходимая позиция цели
        let diffTargetDestination // разница между текущей и необходимой;

        // если есть родитель то двигаем группу, иначе двигаем только один тайл
        // после перемещения сливаем в одну группу все тайлы
        if (this.target.hasParent()) {
            this.target.parent.positionAdd(diffTargetDestination);
        } else {
            this.target.positionAdd(diffTargetDestination);
        }
        this.source.union(this.target)
    };
}
//==========================================================================

const VALLEY = -1;
const FLAT = 0;
const MOUNTED = 1;

function getRandomSide() {
    const rand = Math.round(Math.random());
    return rand === 0 ? MOUNTED : VALLEY;
}

const tiles = [];
const cols = 3;
const rows = 3;
const tileSize = 100;
const tolerance = 20;

const puzzleElement = document.createElement('div');
puzzleElement.className = 'puzzle';
const puzzle = {
    element: puzzleElement,
    tiles: tiles
};

let tileGroups = [];

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        let tile = {};
        let group = [];
        let index = (i * cols) + j;
        tile.i = i;
        tile.j = j;
        tile.index = index;
        tile.x = tile.j * tileSize + tile.j * 50;
        tile.y = tile.i * tileSize + tile.i * 50;
        tile.top = hasTop(i) ? tiles[getTop(index, cols)].bottom * -1 : FLAT;
        tile.right = hasRight(j, cols) ? getRandomSide() : FLAT;
        tile.bottom = hasBottom(i, rows) ? getRandomSide() : FLAT;
        tile.left = hasLeft(j) ?  tiles[index - 1].right * -1 : FLAT;
        tile.element = drawTile(tile);
        tile.element.addEventListener('mouseover', mouseOverTile);
        tile.element.addEventListener('tile_drag', (e) => {
            moveTileWithGroup(tile);
        });
        tile.element.addEventListener('tile_finishdrag', (e) => testMatching(tile));
        tiles.push(tile);
        tile.group = group;
        group.push(tile);
        tileGroups.push(group);
    }
}

function moveTileWithGroup(tile) {
    const x = parseInt(tile.element.style.left);
    const y = parseInt(tile.element.style.top);
    const shiftX = x - tile.x;
    const shiftY = y - tile.y;
    for (let i = 0; i < tile.group.length; i++) {
        const current = tile.group[i];
        current.x += shiftX;
        current.y += shiftY;
        redrawTile(current);
    }
}

function testMatching() {
    let moved = false;
    let matched = 0;
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (hasLeft(tile.j)) {
            const left = tiles[tile.index - 1];
            if (left.group !== tile.group) {
                const distance = length(tile.x, tile.y, left.x + tileSize, left.y);
                if (distance <= tolerance) {
                    if (distance > 0) {
                        left.x = tile.x - tileSize;
                        left.y = tile.y;
                        redrawTile(left);
                        moved = true;
                    }
                    console.log('left match');
                    changeGroup(left, tile);
                    matched++;
                }
            }
        }
        if (hasTop(tile.i)) {
            const top = tiles[getTop(tile.index, cols)];
            if (top.group !== tile.group) {
                const distance = length(tile.x, tile.y, top.x, top.y + tileSize);
                if (distance <= tolerance) {
                    if (distance > 0) {
                        top.x = tile.x;
                        top.y = tile.y - tileSize;
                        redrawTile(top);
                        moved = true;
                    }
                    console.log('top match');
                    changeGroup(top, tile);
                    matched++;
                }
            }
        }
    }
    console.log(`matched ${matched}`);
    if (moved) {
        testMatching();
    } else if (tileGroups.length === 1) {
        setTimeout(() => alert('puzzle assembled'), 1);
    }
}

function redrawTile(tile) {
    tile.element.style.left = `${tile.x}px`;
    tile.element.style.top = `${tile.y}px`;
}

function changeGroup(from, to) {
    to.group.push(from);
    from.group.splice(from.group.indexOf(from), 1);
    // delete empty group
    if (from.group.length < 1) {
        tileGroups.splice(tileGroups.indexOf(from.group), 1);
    }
    from.group = to.group;
}

function hasTop(row) {
    return row !== 0;
}
function hasRight(col, cols) {
    return col !== cols - 1;
}
function hasBottom(row, rows) {
    return row !== rows - 1;
}
function hasLeft(col) {
    return col !== 0;
}
function getTop(index, cols) {
    return index - cols;
}
function getBottom(index, cols) {
    return index + cols;
}
/**
 * Distance between two coords
 * @param {int} x1 
 * @param {int} y1 
 * @param {int} x2 
 * @param {int} y2 
 */
function length(x1, y1, x2, y2) {
    return Math.abs(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}

function drawTile(tile) {
    const element = document.createElement('ul');
    element.className = 'puzzle__tile draggable';
    element.style = `top:${tile.y}px;left:${tile.x}px`;
    let tileContent = '';
    tileContent += `<li class="puzzle__tile-label puzzle__tile-label_top">${tile.top}</li>`;
    tileContent += `<li class="puzzle__tile-label puzzle__tile-label_left">${tile.left}</li>`;
    tileContent += `<li class="puzzle__tile-label puzzle__tile-label">${tile.index}</li>`;
    tileContent += `<li class="puzzle__tile-label puzzle__tile-label_right">${tile.right}</li>`;
    tileContent += `<li class="puzzle__tile-label puzzle__tile-label_bottom">${tile.bottom}</li>`;
    element.innerHTML = tileContent;
    return element;
}
tiles.map(tile => puzzleElement.append(tile.element));

document.querySelector('#puzzle').append(puzzle.element);

let isDragging = false;
function mouseOverTile(event){
    if (isDragging) return false;
    let dragElement = event.target.closest('.draggable');
    if (!dragElement) return;
    if (typeof dragElement.parentElement === 'undefined') return;
    const parent = dragElement.parentElement;

    parent.removeChild(dragElement);
    parent.append(dragElement);
    return false;
}

document.addEventListener('mousedown', function (event) {
    let dragElement = event.target.closest('.draggable');
    if (!dragElement) return;

    event.preventDefault();
    dragElement.ondragstart = function () {
        return false;
    };

    let coords, shiftX, shiftY;
    startDrag(dragElement, event.clientX, event.clientY);

    function onMouseUp(event) {
        finishDrag();
    };

    function onMouseMove(event) {
        moveAt(event.clientX, event.clientY);
    }

    // on drag start:
    //   remember the initial shift
    //   move the element position:fixed and a direct child of body
    function startDrag(element, clientX, clientY) {
        if (isDragging) {
            return;
        }

        isDragging = true;

        document.addEventListener('mousemove', onMouseMove);
        element.addEventListener('mouseup', onMouseUp);

        shiftX = clientX - element.getBoundingClientRect().left;
        shiftY = clientY - element.getBoundingClientRect().top;

        element.style.position = 'fixed';

        moveAt(clientX, clientY);
    };

    // switch to absolute coordinates at the end, to fix the element in the document
    function finishDrag() {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        dragElement.style.top = parseInt(dragElement.style.top) + pageYOffset + 'px';
        dragElement.style.position = 'absolute';

        document.removeEventListener('mousemove', onMouseMove);
        dragElement.removeEventListener('mouseup', onMouseUp);
        dragElement.dispatchEvent(new Event('tile_finishdrag'));
    }

    function moveAt(clientX, clientY) {
        // new window-relative coordinates
        let newX = clientX - shiftX;
        let newY = clientY - shiftY;

        // check if the new coordinates are below the bottom window edge
        let newBottom = newY + dragElement.offsetHeight; // new bottom

        // below the window? let's scroll the page
        if (newBottom > document.documentElement.clientHeight) {
            // window-relative coordinate of document end
            let docBottom = document.documentElement.getBoundingClientRect().bottom;

            // scroll the document down by 10px has a problem
            // it can scroll beyond the end of the document
            // Math.min(how much left to the end, 10)
            let scrollY = Math.min(docBottom - newBottom, 10);

            // calculations are imprecise, there may be rounding errors that lead to scrolling up
            // that should be impossible, fix that here
            if (scrollY < 0) scrollY = 0;

            window.scrollBy(0, scrollY);

            // a swift mouse move make put the cursor beyond the document end
            // if that happens -
            // limit the new Y by the maximally possible (right at the bottom of the document)
            newY = Math.min(newY, document.documentElement.clientHeight - dragElement.offsetHeight);
        }

        // check if the new coordinates are above the top window edge (similar logic)
        if (newY < 0) {
            // scroll up
            let scrollY = Math.min(-newY, 10);
            if (scrollY < 0) scrollY = 0; // check precision errors

            window.scrollBy(0, -scrollY);
            // a swift mouse move can put the cursor beyond the document start
            newY = Math.max(newY, 0); // newY may not be below 0
        }


        // limit the new X within the window boundaries
        // there's no scroll here so it's simple
        if (newX < 0) newX = 0;
        if (newX > document.documentElement.clientWidth - dragElement.offsetWidth) {
            newX = document.documentElement.clientWidth - dragElement.offsetWidth;
        }

        dragElement.style.left = newX + 'px';
        dragElement.style.top = newY + 'px';
        dragElement.dispatchEvent(new Event('tile_drag'));
    }

});