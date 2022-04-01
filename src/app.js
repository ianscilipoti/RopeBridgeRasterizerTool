import p5, {Vector} from 'p5'


class Point {
    constructor (position, locked) {
        this.position = position;
        this.prevPosition = position;
        this.locked = locked;
    }
}

class Stick {
    constructor (p1, p2, slack) {
        this.p1 = p1;
        this.p2 = p2;
        this.length = p5.Vector.dist(p1.position, p2.position) * slack;
    }
}

let bridgeCalculator = new p5(( s ) => {

    const paddingPixels = 5;
    const paddingPixelsVert = 5;
    const pixelsPerSquare = 8;
    const gravity = new Vector(0, 0.15);
    const minRunToAddGuide = 3;
    let slack = 0.6;

    const numIterationsPerSim = 20; 
    const minIterations = 150;
    
    let gravityMultiplier = 0.5;
    let iterationsRun = 0;
    let paused = false;
    let settled = true;


    let points = [];
    let sticks = [];
    let yPixels = [];

    let width = 0;
    let offset = 0;

    

    let wipePixels = () => {
        s.loadPixels();
        for(let i = 0; i < s.pixels.length; i ++) {
            s.pixels[i] = 255;
        }
        s.updatePixels();
    }

    let initialize = () => {
        s.resizeCanvas(pixelsPerSquare * (width + paddingPixels*2), (Math.abs(offset) + width/2 + paddingPixelsVert*2)*pixelsPerSquare);
        points = [];
        sticks = [];

        const leftHeight = -Math.min(0, offset);
        const rightHeight = Math.max(0, offset);

        const numPoints = width * 2;
        for (let i = 0; i < numPoints; i ++) {
            const value = ((parseFloat(i) + 0.5) / (numPoints));
            const locked = i == 0 || i == numPoints-1;
            const x = value * width;
            const y = s.lerp(leftHeight, rightHeight, value);
            points.push(new Point(new Vector(x, y), locked));
        }

        for (let i = 0; i < numPoints-1; i ++) {
            const stick = new Stick(points[i], points[i+1], slack);
            sticks.push(stick);
        }
        // s.clear();
        s.background(255);
        // wipePixels();
        paused = false;
        iterationsRun = 0;

        s.textSize(17);
        s.textAlign(s.CENTER);
    }

    let addGuides = () => {
        let runCounter = 0;
        let runHeight = 0;
        for (let i = 0; i < yPixels.length; i ++) {
            if (yPixels[i] == runHeight) {
                runCounter ++;
            }
            else {
                if (runCounter >= minRunToAddGuide) {
                    s.text(runCounter + "", (i + paddingPixels - runCounter/2) * pixelsPerSquare, (runHeight+paddingPixelsVert) * pixelsPerSquare - 10);
                }
                runCounter = 1;
                runHeight = yPixels[i];
            }
        }
        if (runCounter >= minRunToAddGuide) {
            s.text(runCounter + "", (yPixels.length + paddingPixels - runCounter/2) * pixelsPerSquare, (runHeight+paddingPixelsVert) * pixelsPerSquare - 10);
        }
    }

    let simulate = () => {  
        iterationsRun ++;
        let change = 0;
        for (let p of points) {
            if (!p.locked) {
                const lastPos = p.position.copy();
                p.position.add(Vector.sub(p.position, p.prevPosition).div(1.1))
                p.position.add(Vector.mult(gravity, gravityMultiplier));
                p.prevPosition = lastPos;
                change += Vector.sub(p.position, p.prevPosition).magSq();
            }
        }
        if (iterationsRun > minIterations) {
            paused = true;
            addGuides();
        }

        for (let i = 0; i < numIterationsPerSim; i ++) {
            const simStick = (s) => {
                const center = Vector.add(s.p1.position, s.p2.position).div(2);
                const dir = Vector.sub(s.p1.position, s.p2.position).normalize();
                if (!s.p1.locked) {
                    s.p1.position = Vector.add(center, Vector.mult(dir, s.length / 2));
                }
                if (!s.p2.locked) {
                    s.p2.position = Vector.sub(center, Vector.mult(dir, s.length / 2));
                }
            }
            if (i % 2 == 0) {
                for (let s of sticks) {
                    simStick(s);
                }
            }
            else {
                for (let i = sticks.length-1; i >= 0; i --) {
                    simStick(sticks[i]);
                }
            }
        }
    }

    

    s.setup = () => {
        s.createCanvas(1000, 500);
        s.noSmooth();
        

        const widthSlider = document.getElementById("widthSlider");
        const widthDisp = document.getElementById("widthValue");
        width = widthSlider.valueAsNumber;
        widthSlider.onchange = () => {
            width = widthSlider.valueAsNumber;
            
            initialize();
        };
        widthSlider.oninput = () => {
            widthDisp.innerHTML = widthSlider.value;
        }

        const offsetSlider = document.getElementById("offsetSlider");
        const offsetDisp = document.getElementById("offsetValue");
        offset = offsetSlider.valueAsNumber;
        offsetSlider.onchange = () => {
            offset = offsetSlider.valueAsNumber;
            initialize();
        };
        offsetSlider.oninput = () => {
            offsetDisp.innerHTML = offsetSlider.value;
        }

        const tensionSlider = document.getElementById("tensionSlider");
        const tensionDisp = document.getElementById("tensionValue");
        slack = parseFloat(tensionSlider.valueAsNumber) / 100.0;
        tensionSlider.onchange = () => {
            slack = parseFloat(tensionSlider.valueAsNumber) / 100.0;
            
            initialize();
        };
        tensionSlider.oninput = () => {
            tensionDisp.innerHTML = tensionSlider.value;
        }

        initialize();
        
    }

    

    s.draw = () => {
        
        s.fill(0);
        if (!paused) { 
            s.background(255);
            yPixels = [];

            let pixDic = {};

            let indexOffset = 0;
            let lastUniqueX = -1;
            let lastY = -1;
            let lastX = -1;
            for (let i = 0; i < points.length; i ++) {
                const p = points[i];
                const x = parseInt(p.position.x);
                const y = parseInt(p.position.y);

                s.push();
                if (p.locked) {
                    console.log(i);
                    s.fill(200, 10, 10);
                }
                if (x > lastUniqueX) {
                    yPixels.push(y);
                    lastUniqueX = x;
                }
                if (y != lastY || x != lastX || i == 0 || i == points.length-1) {
                    lastY = y;
                    lastX = x;
                    s.square((x + paddingPixels) * pixelsPerSquare, (y + paddingPixelsVert) * pixelsPerSquare, pixelsPerSquare-1);
                }

                // s.square((p.position.x + paddingPixels) * pixelsPerSquare, (p.position.y + paddingPixelsVert) * pixelsPerSquare, 2);

                pixDic[x + "" + y] = p.locked ? s.color(200, 10, 10) : s.color(0);
                
                
                s.pop();
            }

        }

        if (!paused) {
            simulate();
        }
        
    }

}, 'sketch1');