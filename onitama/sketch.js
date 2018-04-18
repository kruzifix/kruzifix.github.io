const TURN_STATE = {
    NOTHING_SELECTED: 0,
    MEEPLE_SELECTED: 1,
    WON: 2
};
const swapTeam = {
    Red: 'Blu',
    Blu: 'Red'
};

const n = 5;
let board;
let turnState;
let cards;
let cardsPos;
let bases;
let capturedMeeples;

function onBoard(x, y) {
    return x >= 0 && y >= 0 && x < n && y < n;
}

function setup() {
    createCanvas(1280, 860);

    board = {};
    board.arr = new Array(n);
    for (let i = 0; i < n; i++) {
        board.arr[i] = new Array(n);
        for (let j = 0; j < n; j++) {
            if (i == 0) {
                board.arr[i][j] = {
                    x: i,
                    y: j,
                    team: 'Red',
                    col: color(200, 50, 0)
                };
                board.arr[i][j].king = j == floor(n / 2);
            } else if (i == n - 1) {
                board.arr[i][j] = {
                    x: i,
                    y: j,
                    team: 'Blu',
                    col: color(0, 100, 200)
                };
                board.arr[i][j].king = j == floor(n / 2);
            }
        }
    }
    board.w = 600;
    board.x = floor((width - board.w) / 2);
    board.y = height - board.w - 20;
    board.ts = board.w / n;

    unselectMeeple(random() < 0.5 ? 'Red' : 'Blu');

    let cardPool = [{
        name: 'snake',
        moves: [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: -1 },
            { x: 1, y: 1 }]
    }, {
        name: 'mantis',
        moves: [
            { x: -1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 0 },
        ]
    }, {
        name: 'tiger',
        moves: [
            { x: 2, y: 0 },
            { x: -1, y: 0 },
        ]
    }, {
        name: 'grasshopper',
        moves: [
            { x: -1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: -1 },
            { x: 1, y: 1 },
        ]
    }, {
        name: 'bull',
        moves: [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ]
    }];

    function randomCard() {
        let i = floor(random(cardPool.length));
        let card = cardPool.splice(i, 1);
        return card[0];
    }

    // distribute cards randomly
    cards = {
        pool: [randomCard()],
        Red: [randomCard(), randomCard()],
        Blu: [randomCard(), randomCard()]
    };

    let pad = 20;
    let cw = 300;
    cardsPos = [];
    cardsPos['Red'] = [{
        x: pad,
        y: height - pad * 2 - cw * 2,
        w: cw
    }, {
        x: pad,
        y: height - pad - cw,
        w: cw
    }];
    cardsPos['Blu'] = [{
        x: width - pad - cw,
        y: height - pad * 2 - cw * 2,
        w: cw
    }, {
        x: width - pad - cw,
        y: height - pad - cw,
        w: cw
    }];
    cw = 200;
    cardsPos['pool'] = [{
        x: (width - cw) / 2, 
        y: 20,
        w: cw
    }];

    bases = [{
        x: 0,
        y: floor(n / 2),
        team: 'Red',
        col: color(200, 50, 0)
    }, {
        x: n - 1,
        y: floor(n / 2),
        team: 'Blu',
        col: color(0, 100, 200)
    }];

    capturedMeeples = {
        Red: [],
        Blu: []
    };
}

function unselectMeeple(team) {
    turnState = {
        team: team,
        state: TURN_STATE.NOTHING_SELECTED,
        selectedCard: (turnState && turnState.team == team) ? turnState.selectedCard : 0
    };
}

function updatePossibleMoves() {
    if (turnState.state != TURN_STATE.MEEPLE_SELECTED)
        return;
    let cell = turnState.meeple;
    let invert = cell.team == 'Blu';
    turnState.possibleMoves = [];
    for (const m of cards[cell.team][turnState.selectedCard].moves) {
        let tx = cell.x + m.x;
        let ty = cell.y + m.y;
        if (invert) {
            tx = cell.x - m.x;
            ty = cell.y - m.y;
        }
        if (!onBoard(tx, ty))
            continue;
        let tcell = board.arr[tx][ty];
        if (tcell && tcell.team == cell.team)
            continue;
        turnState.possibleMoves.push({ x: tx, y: ty });
    }
}

function selectMeeple(cell) {
    if (cell && cell.team == turnState.team) {
        turnState = {
            team: cell.team,
            state: TURN_STATE.MEEPLE_SELECTED,
            meeple: cell,
            selectedCard: turnState.selectedCard,
            possibleMoves: []
        };
        updatePossibleMoves();
    }
}

function moveMeeple(movePos) {
    let oldx = turnState.meeple.x;
    let oldy = turnState.meeple.y;

    let won = checkWinCondition(movePos);

    let oldCell = board.arr[oldx][oldy];
    oldCell.x = movePos.x;
    oldCell.y = movePos.y;
    let target = board.arr[movePos.x][movePos.y];

    if (target && target.team != turnState.team) {
        capturedMeeples[turnState.team].push(target.king);
    }

    board.arr[movePos.x][movePos.y] = oldCell;
    board.arr[oldx][oldy] = undefined;

    useCard();

    if (won)
        return;

    unselectMeeple(swapTeam[turnState.team]);
}

function useCard() {
    if (turnState.state != TURN_STATE.MEEPLE_SELECTED)
        return;
    let tmp = cards[turnState.team][turnState.selectedCard];
    cards[turnState.team][turnState.selectedCard] = cards['pool'][0];
    cards['pool'][0] = tmp;
}

function checkWinCondition(movePos) {
    // jumped on other teams base
    for (let b of bases) {
        if (b.team != turnState.team &&
            b.x == movePos.x &&
            b.y == movePos.y) {
                teamWon("Captured the other's base!");
                return true;
            }
    }

    // killed king meeple of other team
    let target = board.arr[movePos.x][movePos.y];
    if (target && target.team != turnState.team && target.king) {
        teamWon("Killed the King!");
        return true;
    }
}

function teamWon(msg) {
    turnState = {
        state: TURN_STATE.WON,
        team: turnState.team,
        msg: msg
    };
}

function mousePressed() {
    let x = floor((mouseX - board.x) / board.ts);
    let y = floor((mouseY - board.y) / board.ts);

    if (onBoard(x, y)) {
        let cell = board.arr[x][y];
        switch (turnState.state) {
            case TURN_STATE.NOTHING_SELECTED:
                selectMeeple(cell);
            break;
            case TURN_STATE.MEEPLE_SELECTED:
                let movePos = undefined;
                for (let p of turnState.possibleMoves) {
                    if (x == p.x && y == p.y) {
                        movePos = p;
                        break;
                    }
                }

                if (movePos) {
                    moveMeeple(movePos);
                } else {
                    if (cell && cell.team == turnState.team) {
                        selectMeeple(cell);
                    } else {
                        unselectMeeple(turnState.team);
                    }
                }
            break;
        }
    } else {
        let arr = cardsPos[turnState.team];
        for (let i = 0; i < arr.length; i++) {
            let card = arr[i];
            if (mouseX >= card.x && mouseY >= card.y && mouseX < card.x + card.w && mouseY < card.y + card.w) {
                turnState.selectedCard = i;
                updatePossibleMoves();
                break;
            }
        }
    }
}

function draw() {
    background(200);
    
    drawBoard(board.x, board.y, board.w);

    let pad = 40;
    let dx = 50;
    noStroke();
    fill(0);
    textSize(28);
    textAlign(LEFT);
    text('Captured:', pad, 130);
    text('Captured:', width - pad - dx * n, 130);

    stroke(color(0, 75, 150));
    fill(0, 100, 200);
    for (let i = 0; i < capturedMeeples['Red'].length; i++) {
        drawMeeple(pad + i * dx, 150, dx, capturedMeeples['Red'][i]);
    }

    stroke(color(150, 0, 0));
    fill(200, 50, 0);
    for (let i = 0; i < capturedMeeples['Blu'].length; i++) {
        drawMeeple(width - pad + (i - n) * dx, 150, dx, capturedMeeples['Blu'][i]);
    }

    if (turnState.state == TURN_STATE.WON) {
        stroke(160);
        fill(180);
        let w = 500;
        let h = 200;
        rect((width - w) / 2, 20, w, h);

        textSize(48);
        noStroke();
        fill(turnState.team == 'Red' ? color(200, 30, 0) : color(0, 100, 200));
        textAlign(CENTER);
        text(turnState.team + ' wins!', width / 2, 70);

        textSize(36);
        fill(0);
        text(turnState.msg, width / 2, 150);

        return;
    }

    // left player = red
    for (let cds in cards) {
        for (let i = 0; i < cards[cds].length; i++) {
            let c = cards[cds][i];
            let pos = cardsPos[cds][i];
            drawCard(pos.x, pos.y, pos.w, c, cds == 'Blu', cds == turnState.team && i == turnState.selectedCard);
        }
    }

    textSize(48);
    if (turnState.team == 'Red') {
        textAlign(LEFT);
        fill(200, 30, 0);
        text("Red's Turn!", 20, 50);
    } else if (turnState.team == 'Blu') {
        textAlign(RIGHT);
        fill(0, 100, 200);
        text("Blu's Turn!", width - 20, 50);
    }
}

function drawMeeple(x, y, ts, king) {
    let cx = x + 0.5 * ts;
    let cy = y + 0.25 * ts;
    let th = ts * 0.3;
    triangle(cx, cy - ts * 0.1, cx - th, cy + th * 2, cx + th, cy + th * 2);
    ellipse(cx, cy, th, th);
    if (king) {
        fill(250, 200, 0);
        stroke(200, 170, 0);
        cy -= 5;
        th *= 0.6;
        beginShape();
        vertex(cx - th, cy);
        vertex(cx - th, cy - ts * 0.2);
        vertex(cx - th * 0.5, cy - ts * 0.1);
        vertex(cx, cy - ts * 0.2);
        vertex(cx + th * 0.5, cy - ts * 0.1);
        vertex(cx + th, cy - ts * 0.2);
        vertex(cx + th, cy);
        endShape(CLOSE);
    }
}

// h = w
function drawCard(ox, oy, w, card, invert, highlight) {
    stroke(160);
    strokeWeight(3);
    fill(180);
    if (highlight) {
        if (invert)
            fill(0, 100, 200);
        else
            fill(200, 0, 0);
        stroke(0);
    }
    rect(ox, oy, w, w);

    let fw = w * 0.8;
    let pad = (w - fw) / 2;
    let fx = ox + pad;
    let fy = oy + (w - fw) - 20;

    fill(100);
    if (highlight) {
        fill(0);
    }
    noStroke();
    textSize(w / 10);
    textAlign(CENTER);
    text(card.name, ox + w / 2, oy + (w - 20) / 10);

    let cn = 5;
    let ts = fw / cn;
    stroke(0);
    strokeWeight(1);
    for (let x = 0; x < cn; x++) {
        for (let y = 0; y < cn; y++) {
            fill((x + y) % 2 == 0 ? color(220) : color(200));
            rect(fx + x * ts, fy + y * ts, ts, ts);
        }
    }
    
    let mid = floor(cn / 2);
    noStroke();
    fill(180);
    drawMeeple(fx + mid * ts, fy + mid * ts, ts);
    
    let mpad = 5;
    fill(0, 200, 0);
    for (let m of card.moves) {
        let x = mid + m.x;
        let y = mid + m.y;
        if (invert) {
            x = mid - m.x;
            y = mid - m.y;
        }
        rect(fx + x * ts + mpad, fy + y * ts + mpad, ts - 2 * mpad, ts - 2 * mpad);
    }
}

// h = w
function drawBoard(ox, oy, w) {
    let ts = w / n;

    // background grid
    stroke(0);
    strokeWeight(8);
    noFill();
    rect(ox, oy, w, w);
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            noStroke();
            fill((x + y) % 2 == 0 ? color(220) : color(180));
            rect(ox + x * ts, oy + y * ts, ts, ts);
        }
    }

    fill(0, 200, 0);
    noStroke();
    let pad = 10;
    if (turnState.state == TURN_STATE.MEEPLE_SELECTED) {
        for (let p of turnState.possibleMoves) {
            rect(ox + p.x * ts + pad, oy + p.y * ts + pad, ts - pad * 2, ts - pad * 2);
        }
    }

    let tq = ts * 0.25;
    for (let b of bases) {
        let x = ox + b.x * ts;
        let y = oy + b.y * ts;

        fill(150);
        noStroke();
        rect(x + tq, y + tq * 1.5, tq * 2, tq * 2);
        rect(x + tq * 0.5, y + tq, ts * 0.75, ts * 0.2);
        // zinken
        rect(x + tq * 0.5, y + tq * 0.5, ts * 0.15, tq);
        rect(x + ts * 0.725, y + tq * 0.5, ts * 0.15, tq);
        rect(x + ts * 0.4, y + tq * 0.5, ts * 0.2, tq);

        fill(b.col);
        drawMeeple(x + tq, y + tq * 1.5, tq * 2);
    }

    strokeWeight(3);
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            let cell = board.arr[x][y];
            if (cell) {
                stroke(cell.team == 'Red' ? color(150, 0, 0) : color(0, 75, 150));
                if (turnState.state == TURN_STATE.MEEPLE_SELECTED && cell == turnState.meeple)
                    stroke(0);
                fill(cell.col);
                drawMeeple(ox + x * ts, oy + y * ts, ts, cell.king);
            }
        }
    }
}