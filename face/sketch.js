let faceBg;
let faceFg;

let mic;

const w = 1000;
const h = 750;

function preload() {
  faceBg = loadImage('face_background.png');
  faceFg = loadImage('face_foreground.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  mic = new p5.AudioIn();
  mic.start();
}

function draw() {

  let t = millis() / 1000;

  let volume = mic.getLevel();
  let mouthOffset = pow(volume, 0.75) * 300;

  let aspect = faceBg.width / faceBg.height;
  image(faceBg, 0, 0, windowWidth, windowWidth / aspect,
    0, 0, faceBg.width, faceBg.height, p5.COVER, p5.CENTER, p5.TOP);
  image(faceFg, mouthOffset*-0.05, mouthOffset, windowWidth, windowWidth / aspect,
    0, 0, faceBg.width, faceBg.height, p5.COVER, p5.CENTER, p5.TOP);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
