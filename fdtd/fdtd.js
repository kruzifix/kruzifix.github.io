var can = document.getElementById("myChart");
var ctx = can.getContext("2d");
ctx.font = "20px Consolas";
var hw = can.width * 0.5;

var can2 = document.getElementById("waterfall");
var ctx2 = can2.getContext("2d");

var SIZE = 200;
var ez = [];
var hy = [];
var epsR = [];
var dielectric_start = 100;
var dielectric_stop = 150;
var dielectric_index = 9.0;

for(var i = 0; i < SIZE; i++){
	epsR[i] = (i >= dielectric_start && i <= dielectric_stop) ? dielectric_index : 1.0;
}

function resetFields(){
	for(var i = 0; i < SIZE; i++){
		ez[i] = hy[i] = 0.0;
	}
}
resetFields();
var imp0 = 377.0;
var inv_imp0 = 1.0 / imp0;
var maxTime = 350;
var time = 0;

var dt = 15.0
var dx = can.width / (SIZE-2);
var dy = can.height * 0.5;
var dy2 = can.height / (maxTime / dt);
var time2 = 0;
var timeStepID;

function source(x, t){
	return Math.exp(-(t - 30.0)*(t - 30.0) / 100.0);
	
	// standing waves with dielectric at 100 -> 150 with index=16
	//return Math.sin((t-10.0)*0.2)*0.1;
}

function runTimeStep(){	
	// update magnetic field
	for(var i = 0; i < SIZE - 1; i++){
		hy[i] += (ez[i+1] - ez[i]) * inv_imp0;
	}
	
	// correction for Hy adjacent to TFSF boundary
	hy[49] -= source(50, time) * inv_imp0;
	
	// simple ABC for left boundary
	ez[0] = ez[1];
	ez[SIZE - 1] = ez[SIZE - 2];
	
	// update electric field
	for(var i = 1; i < SIZE - 1; i++){
		ez[i] += (hy[i] - hy[i-1]) * imp0 / epsR[i];
	}
	// additive source node
	// with correction for Ez adjacent to TFSF boundary
	ez[50] += source(50, time + 1);
	
	ctx.clearRect(0, 0, can.width, can.height);
	// amplitude=0 line
	ctx.strokeStyle = '#aaa';
	ctx.beginPath();
	ctx.moveTo(0, dy);
	ctx.lineTo(can.width, dy);
	ctx.stroke();
	// dielectric region
	ctx.fillStyle = '#bfa';
	ctx.fillRect(dx*dielectric_start, 0, dx*(dielectric_stop-dielectric_start), can.height);	
	// source node
	ctx.strokeStyle='#ccc';
	ctx.beginPath();
	ctx.moveTo(dx*49, 0);
	ctx.lineTo(dx*49, can2.height);
	ctx.stroke();
	
	ctx.fillStyle = 'black';
	ctx.fillText("timestep: " + time, 5, 20);
	
	// plot electric field
	ctx.strokeStyle = 'red';
	ctx.beginPath();
    ctx.moveTo(0, dy - ez[0]*0.9 * dy);
	for(var i = 1; i < SIZE; i++){
		ctx.lineTo(dx * i, dy - ez[i]*0.9 * dy);
	}
	ctx.stroke();
	
	//waterfall
	if (time > 0 && time % dt == 0 && time < maxTime){
		ctx2.strokeStyle = 'black';
		ctx2.beginPath();
        ctx2.moveTo(0, -ez[0] * dy2 + time/dt * dy2);
		for(var i = 1; i < SIZE; i++){
			ctx2.lineTo(dx * i, -ez[i] * dy2 + time/dt * dy2);
		}	
		ctx2.stroke();
	}
	// plot magnetic field
	ctx.strokeStyle = 'blue';
	ctx.beginPath();
    ctx.moveTo(0, dy - hy[0]*100.0 * dy);
	for(var i = 1; i < SIZE; i++){
		ctx.lineTo(dx * i, dy - hy[i]*100.0 * dy);
	}
	ctx.stroke();
	
	time++;
}

function clearWaterfall(){
	ctx2.clearRect(0, 0, can2.width, can2.height);
	ctx2.beginPath();
	ctx2.moveTo(dx*49, 0);
	ctx2.lineTo(dx*49, can2.height);
	ctx2.strokeStyle = '#ccc';
	ctx2.stroke();
	ctx2.fillStyle = '#bfa';
	ctx2.fillRect(dx*dielectric_start, 0, dx*(dielectric_stop-dielectric_start), can.height);
}

function reset(){
	stop();
	time = 0;
	resetFields();
	clearWaterfall();
	runTimeStep();
}

function start(resume){
	if (!resume){
		time = 0;
		resetFields();
		clearWaterfall();
	}
	stop();
	timeStepID = setInterval(runTimeStep, 50);
}

function stop(){
	if (timeStepID){
		clearInterval(timeStepID);
		timeStepID = null;
	}
}

function step(){
	if (timeStepID)
		return;
	runTimeStep();
}
