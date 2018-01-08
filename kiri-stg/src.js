
const initMouse = (cnv)=>{
	const mouseState = {
		pos: Vector(0, 0),
		lbutton: false
	};

	window.addEventListener("mousemove", e=>{
		bcr = cnv.getBoundingClientRect();
		mouseState.pos.x = e.clientX - bcr.left;
		mouseState.pos.y = e.clientY - bcr.top;
	});

	window.addEventListener("mousedown", e=>{
		mouseState.lbutton = true;
	});

	window.addEventListener("mouseup", e=>{
		mouseState.lbutton = false;
	});

	return mouseState;
}
const initKeyStates = ()=>{
	const keyStates = {};

	window.addEventListener("keydown", key=>{
		keyStates[key.keyCode] = true;
	});

	window.addEventListener("keyup", key=>{
		keyStates[key.keyCode] = false;
	})

	return keyStates;
};

const keys = 
	Object.freeze({ up: 38
	, down: 40
	, right: 39
	, left: 37
	, space: 32
	, esc: 27
	, r: 82
	, w: 87
	, s: 83
	, t: 84
	});
	
class Sound {
	constructor(url){
		this.src = url;
		this.audio = new Audio(url);
		this.playing = [];
	}
	play(conf){
		this.audio.addEventListener("ended", e=>{
			this.playing.shift();
		});

		conf = conf || {};
		this.audio.volume = conf.volume || 1.0;
		this.audio.play();
		this.playing.push(this.audio);
		
		this.audio = new Audio(this.src);
	}

	stop(){
		this.playing.forEach(e=>{
			e.pause();
		});
		this.playing = [];
	}

	loopPlay(){
		this.audio.loop = true;
		this.play();
	}
}
const clearCanvas = (ctx, cnv, color)=>{
	const col = color || "white";

	ctx.save();
	ctx.fillStyle = col;
	ctx.fillRect(0,0,cnv.width, cnv.height);
	ctx.restore();
}

const drawNumber = (ctx, numbers, pos, size, num) => {
	const numarray = [];

	for(let i=num; i>0; i=Math.floor(i/10)){
		numarray.push(i%10);
	}
	if(numarray.length==0){
		numarray.push(0);
	}

	numarray.forEach((n,i)=>{
		ctx.drawImage(numbers, n%5*100, Math.floor(n/5)*160, 100,160, pos.x-(i*size.x), pos.y, size.x, size.y);
	});
}
class RectCollider{
	constructor(pos, size){
		this.pos = pos;
		this.size = size;
	}
	draw(ctx){
		ctx.save();
		ctx.fillStyle = "purple";
		ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
		ctx.restore();
	}
}

class CircleCollider {
	constructor(pos, rad){
		this.pos = pos;
		this.rad = rad;
	}
	draw(ctx){
		ctx.save();
		ctx.fillStyle = "purple";
		ctx.beginPath();
		ctx.arc(this.pos.x, this.pos.y, this.rad, 0, Math.PI*2, false);
		ctx.fill();
		ctx.restore();
	}
}

// each object must have a collider
const col_circle_rect = (obja, objb)=>{

	const cir_p = move(obja.pos, obja.collider.pos);
	const rbase = move(objb.pos, objb.collider.pos);
	const rect_corners = [ rbase 
	                     , move(rbase, Vector(objb.collider.size.x, 0))
	                     , move(rbase, Vector(objb.collider.size.x, objb.collider.size.y))
	                     , move(rbase, Vector(0, objb.collider.size.y))
	                     ];


	// attach from up and down
	if( (rect_corners[0].x <= cir_p.x) && (cir_p.x <= rect_corners[1].x) ){
		if( (rect_corners[0].y <= cir_p.y+obja.collider.rad) &&
		    (cir_p.y-obja.collider.rad <= rect_corners[3].y) ){

		    return true;
		}
	}

	// attach from right and left
	if( (rect_corners[0].y <= cir_p.y) && (cir_p.y <= rect_corners[3].y) ){
		if( (rect_corners[0].x <= cir_p.x+obja.collider.rad) &&
		    (cir_p.x-obja.collider.rad <= rect_corners[1].x) ){

		    return true;
		}
	}

	// attach to corners
	return rect_corners.map(corner=>{
		if( distance(corner, cir_p) <= obja.collider.rad ){
			return true;
		}
	}).reduce((p,c)=>(p||c));

	return false;
}

const col_rect_rect = (obja, objb)=>{
	const a_base = move(obja.pos, obja.collider.pos);
	const b_base = move(objb.pos, objb.collider.pos);

	const c1 = a_base.x <= b_base.x + objb.collider.size.x;
	const c2 = b_base.x <= a_base.x + obja.collider.size.x;
	const c3 = a_base.y <= b_base.y + objb.collider.size.y;
	const c4 = b_base.y <= a_base.y + obja.collider.size.y; 

	if( c1 && c2 && c3 && c4 ){
		return true;
	}
}

const col_circle_circle = (obja, objb)=>{
	const d = distance (move(obja.pos, obja.collider.pos), move(objb.pos, objb.collider.pos));
	if( d <= obja.collider.rad + objb.collider.rad ){
		return true;
	}
}

const isCollide = (obja, objb)=>{
	if(obja.collider==null || objb.collider==null)
		return false;

	if( obja.collider.constructor === RectCollider ){
		if (objb.collider.constructor === RectCollider ){
			return col_rect_rect(obja, objb);
		} else if (objb.collider.constructor === CircleCollider) {
			return col_circle_rect(objb, obja);
		}
	} else if (obja.collider.constructor === CircleCollider){
		if (objb.collider.constructor === RectCollider){
			return col_circle_rect(obja, objb);
		} else if (objb.collider.constructor === CircleCollider){
			return col_circle_circle(obja, objb);
		}
	}
}
const Vector = (x,y) => ({x:x, y:y});
const move = (pos, delta)=>Vector(pos.x+delta.x, pos.y+delta.y);
const sqr = x=>(x*x);
const distance = (v1,v2) => Math.sqrt(sqr(v1.x-v2.x) + sqr(v1.y-v2.y));
const vadd = (v1, v2) => Vector(v1.x+v2.x, v1.y+v2.y);
const vsub = (v1, v2) => Vector(v1.x-v2.x, v1.y-v2.y);
const vscale = (v, s) => Vector(v.x*s, v.y*s);
const vlength = v => Math.sqrt(v.x*v.x + v.y*v.y)
const vunit = v => vscale( v, 1/vlength(v) );
const vrotate = (v, angle) => Vector(v.x*Math.cos(angle)-v.y*Math.sin(angle), v.x*Math.sin(angle)+v.y*Math.cos(angle));
class Scene {
	constructor(){
	}

	update(){
		return null;
	}

	draw(){
	}
	
	draw(resources){

		clearCanvas(resources.canvasCtx, resources.canvas, "white");

		this.objects.forEach(obj=>{
			resources.canvasCtx.save();
			resources.canvasCtx.translate(obj.pos.x, obj.pos.y);
			obj.draw(resources.canvasCtx, resources.images);
			resources.canvasCtx.restore();
		});

		if (this.player) {
			resources.canvasCtx.save();
			resources.canvasCtx.translate(this.player.pos.x, this.player.pos.y);
			this.player.draw(resources.canvasCtx, resources.images);
			resources.canvasCtx.restore();
		}
	}

	updateObjects(resources, inputs){
		const newObjs = [];

		if (this.player) {
			const result = this.player.update(resources, inputs);
			(result.newObjects || []).forEach(e =>{newObjs.push(e)});
		}

		this.objects.forEach(obj=>{
			const result = obj.update(resources, inputs);
			(result.newObjects || []).forEach(e => {newObjs.push(e)});
		});

		this.objects = this.objects.filter(obj=>(!obj.dead));
		Array.prototype.push.apply(this.objects, newObjs);
	}

	collisionCheck(){

		if(this.player){
			this.objects.forEach(e=>{
				if (isCollide(this.player, e)) {
					this.player.onCollide(e);
					e.onCollide(this.player);
				}
			})
		}

		for(let i=0; i<this.objects.length-1; i++){
			for(let j=i+1; j<this.objects.length; j++){
				if(isCollide(this.objects[i], this.objects[j])){
					this.objects[i].onCollide(this.objects[j]);
					this.objects[j].onCollide(this.objects[i]);
				}
			}
		}
	}
}
class GameObject {
	constructor(pos, tag, collider){
		this.pos = Object.assign({}, pos);
		this.tag = tag;
		this.collider = collider;
		this.dead = false;
	}

	onCollide(obj){
	}

	update(resources, gameObjects){
		return {};
	}

	draw(ctx){
	}

	updateTimers(){
		Object.entries(this.timers).forEach( t=>{
			if( t[1] > 0 ){
				this.timers[t[0]] = t[1]-1;
			}
		})
	}
}
/*
 images = { imageName1 : url1, imageName2 : url2, ... }
*/

const loadImage = (name,src)=>new Promise((resolve,reject)=>{
	const img = new Image();
	img.onload = resolve([name,img]);
	img.onerror = reject;

	img.src = src;
});

const loadImages = (srcs)=>{
	const ps = Object.entries(srcs).map(e=>loadImage(e[0], e[1]));
	const images = {};
	return Promise.all(ps)
		.then(imgs=>{
			imgs.forEach(img=>{
				images[img[0]] = img[1];
			});
			return Promise.resolve(Object.freeze(images));
		});
};

class Game {
	constructor(config){
		this.load = true;

		this.src = {}
		this.resources = {}

		this.src.sounds = config.sounds;
		this.resources.sounds = {};
		Object.entries(config.sounds).forEach(e=>{
			this.resources.sounds[e[0]] = new Sound(e[1]);
		})
		console.log(this.resources.sounds);

		this.src.images = config.images;
		this.scene = config.initScene;
		this.resources.canvas = config.canvas;

		this.resources.canvasCtx = this.resources.canvas.getContext('2d');
		if( !this.resources.canvasCtx ){
			console.log("nothing context");
			this.load = false;
		}

	}

	run(){

		const keyStates = initKeyStates();
		const mouseState = initMouse(this.resources.canvas);
		const inputs = { keyStates: keyStates, mouseState: mouseState};

		loadImages(this.src.images)
		.then(imgs=>{
			console.log(imgs);
			this.resources.images = imgs;

			console.log(this);

			const intId = setInterval(()=>{
				const nextScene = this.scene.update(this.resources, inputs);
				this.scene.draw(this.resources);
				if(nextScene){
					this.scene = nextScene;
				}
			}, 1000/60);
		})
		.catch(()=>console.log("images can't load"))
	}

}
class Kiritan extends GameObject {
	constructor(pos){
		super(pos, "kiritan", 
			new RectCollider(Vector(30,30), Vector(Kiritan.size.x-60, Kiritan.size.y-60)));
		this.size = Kiritan.size;
		this.maxSpeedX = 10
		
		this.accel = Vector(1, 1);
		this.cannonPos =
			{ right: Vector(58,18)
			, left : Vector(20,22)
			}

		this.state =
			{ speed : Vector(0, 0)
			, color : "black"
			, jumping : false
			, shotFrom : "right"
			, shotAngle : Math.PI * 1.1
			, fullBurst : false
			};

		this.animation =
			{ shooting : false
			, timer : 0
			}

		this.shotAngleMax = Math.PI + Math.PI/2;
		this.shotAngleMin = Math.PI - Math.PI/6;

		this.shotInterval = 40;
		this.aim = Vector(0,0);

		this.timers =
			{ shot : 0
			, fullBurst : 0
			};

        this.score = 0;

	}

	onCollide(obj){
	}

	update(res, inputs){
		const newObjs = [];

		this.updateTimers();

		this.aim = inputs.mouseState.pos;

		if(this.animation.timer > 0){
			this.animation.timer--;
		}

		if(inputs.keyStates[keys.up] && (!this.state.jumping) ){
			this.state.speed.y = -15;
			this.state.jumping = true;
		} else {
			this.state.speed.y += this.accel.y;
		}

		const accel_x = this.state.jumping ? (this.accel.x*0.1) : (this.accel.x);

		if (inputs.keyStates[keys.right]){
			this.state.speed.x += accel_x;
			if(this.state.speed.x > this.maxSpeedX){
				this.state.speed.x = this.maxSpeedX;
			}
		} else if (inputs.keyStates[keys.left]){
			this.state.speed.x -= accel_x;
			if(this.state.speed.x < -this.maxSpeedX){
				this.state.speed.x = -this.maxSpeedX;
			}
		} else {
			if (this.state.speed.x > 0){
				this.state.speed.x -= accel_x;
				if (this.state.speed.x < 0){
					this.state.speed.x = 0;
				}
			} else {
				this.state.speed.x += accel_x;
				if (this.state.speed.x > 0){
					this.state.speed.x = 0;
				}
			}
		}

		if( inputs.keyStates[keys.w] ){
			this.state.shotAngle += 0.02;
			if(this.state.shotAngle > this.shotAngleMax){
				this.state.shotAngle = this.shotAngleMax;
			}
		} else if (inputs.keyStates[keys.s]){
			this.state.shotAngle -= 0.02;
			if(this.state.shotAngle < this.shotAngleMin){
				this.state.shotAngle = this.shotAngleMin;
			}
		}

		this.pos = move(this.pos, this.state.speed);
		if (this.pos.y + this.size.y > res.canvas.height){
			this.state.jumping = false;
			this.pos.y = res.canvas.height - this.size.y;
			this.state.speed.y = 0;
		}

		if (this.pos.x < 0) {
			this.pos.x = 0;
			this.state.speed.x = 0;
		} else if (this.pos.x + this.size.x > res.canvas.width) {
			this.pos.x = res.canvas.width - this.size.x;
			this.state.speed.x = 0;
		}

		//shoot zundamochi
		if(inputs.mouseState.lbutton && this.timers.shot<=0){
			const speed = vscale( this.getShootVectorUnit(), 10 );
			const mochi = this.shoot(speed);
			res.sounds.shoot.play();

			newObjs.push(mochi)	;
		}

		if(this.state.fullBurst){
			if(this.timers.fullBurst>0){
				if(this.timers.fullBurst%3==0){
					const speed = vscale( this.getShootVectorUnit(), 10);
					const mochi = this.shoot(vrotate(speed, Math.random()*0.5-0.25));
					res.sounds.z.play();
					newObjs.push(mochi);
				}
			}else{
				this.state.fullBurst = false;
			}
		}

		if(inputs.keyStates[keys.t] && !this.state.fullBurst){
			this.state.fullBurst = true;
			this.timers.fullBurst = 200;
			//res.sounds.fullBurst.play();
		}

		if(this.animation.shooting && this.animation.timer<=0){
			this.animation.shooting = false;
		}

		return { newObjects: newObjs };
	}

	draw(ctx, imgs){
		ctx.save();
		if(this.animation.shooting){
			ctx.scale(0.9, 0.9);
		}

		const img = imgs.kiritan;
		ctx.drawImage(imgs.kiritan, 0, 0);

		const tmp = vsub(this.aim, this.pos);
		const cp = this.cannonPos[this.state.shotFrom];

		ctx.strokeStyle = "#ffcccc";
		ctx.beginPath();
		ctx.moveTo(cp.x, cp.y);
		ctx.lineTo(tmp.x, tmp.y);
		ctx.stroke();

		ctx.restore();
	}

	getShootVectorUnit(){
		return vunit( vsub(this.aim, vadd(this.pos, this.cannonPos[this.state.shotFrom]) ) );
	}

	shoot(speed){
		const cp = this.cannonPos[this.state.shotFrom];
		const mochi = new Mochi(vadd(this.pos, vadd(cp, Vector(-Mochi.size.x/2, -Mochi.size.y/2))), speed, this);

		if(this.state.shotFrom=="right") this.state.shotFrom = "left";
		else this.state.shotFrom = "right";

		this.animation.timer = 2;
		this.animation.shooting = true;

		this.timers.shot = this.shotInterval;

		return mochi;
	}

	hit(){
		this.score++;
	}
}

Kiritan.size = Vector(100,100);

class Zunko extends GameObject {
	constructor(pos, res){
		//super(pos, "zunko", RectCollider(Vector(91)(68))(16)(11));
		// (367,276) -> (425,309) size(58,33)

		super(pos, "zunko", new RectCollider(Vector(46,35), Vector(8,5)));

		this.speed = Vector(1.2, 0);

		this.dying = false;
		this.size = Zunko.size;

		this.animation =
			{ imgIndex : 0
			, timer : 0
			}

		this.images = [ "zunko_angry", "zunko_sleep" ];
	}

	draw(ctx, imgs){
		ctx.save();
		ctx.drawImage( imgs[this.images[this.animation.imgIndex]], 0, 0 );
		//ctx.fillStyle = "green";
		//ctx.fillRect(0,0,this.size.x, this.size.y);
		ctx.restore();
	}

	update(res, objs){

		if( this.animation.timer > 0 ){
			this.animation.timer--;
		}

		if(!this.dying){
			this.pos = move(this.pos, this.speed);
		}

		if( this.pos.x >= res.canvas.width){
			this.dead = true;
		}

		if( this.dying && this.animation.timer <= 0){
			this.dead = true;
		}

		return {};
	}

	onCollide(obj){

		if(obj.tag === "mochi"){
			this.dying = true;
			this.animation.timer = 20;
			this.animation.imgIndex = 1;

			this.collider = null;
		}
	}

}

Zunko.size = Vector(100,100);

class ZunkoFactory extends GameObject {
	constructor(){
		super(Vector(0,0), "ZunkoFactory", null);

		this.state = { timer : 100 };
	}

	draw(){
	}

	update(res){
		const newObjs = [];
		if(this.state.timer > 0){
			this.state.timer--;
		}

		if( this.state.timer <= 0){
			const y = (Math.random()*(res.canvas.height-300))+50;
			const z = new Zunko(Vector(0, y), res);
			newObjs.push(z);

			this.state.timer = 50;
		}

		return { newObjects: newObjs };
	}
}
class Mochi extends GameObject {
	constructor(pos, speed, parent){
		super(pos, "mochi", new CircleCollider(Vector(21,21),15));
		
		this.parent = parent;
		this.size = Mochi.size;
		this.rad = 25;
		this.accel = Vector(0, 0.1);
		this.state =
			{ speed : speed
			}
	}

	update(res){

		this.state.speed.y += this.accel.y;

		this.pos = move(this.pos, this.state.speed);

		if( this.pos.y > res.canvas.height){
			this.dead = true;
		}

		return {};
	}

	draw(ctx, imgs){
		ctx.save();
		const img = imgs.mochi;
		ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.size.x, this.size.y);
		ctx.restore();
	}

	onCollide(obj){
		if(obj.tag === "zunko"){
			this.dead = true;
			this.parent.hit();
		}
	}
}

Mochi.size = Vector(50,50);
class StartScene {
	constructor(){
		this.starting = false;
		this.timer = 0;
		this.mouse = null;
		this.titlecall = false;
	}

	update(res, inputs){

		if(!this.titlecall){
			res.sounds.titlecall.play();
			this.titlecall=true;
		}

		if(this.timer > 0){
			this.timer--;
		}

		this.mouse = inputs.mouseState;

		if(!this.starting && inputs.keyStates[keys.space]){
			this.starting = true;
			res.sounds.start.play();
			this.timer = 100;
		}

		if(this.starting && this.timer<=0){
			return new MainScene(new Kiritan(Vector(500,300)), [new ZunkoFactory()]);
		}

		return null;
	}
	draw(res){
		const ctx = res.canvasCtx;

		clearCanvas(ctx, res.canvas);

		ctx.save();
		ctx.drawImage(res.images.logo, 20, 20);
		ctx.restore();

		ctx.save();
		ctx.fillStyle = "gray";
		ctx.font = "30px 'Arial'";
		ctx.fillText("press space key", 200,400);

		if( this.mouse ){
			ctx.save();
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(this.mouse.pos.x, this.mouse.pos.y, 10, 0, Math.PI*2, false);
			ctx.fill();
			ctx.restore();
		}
	}
}
class MainScene extends Scene {

	constructor(player, objects){
		super();
		this.player = player;
		this.objects = objects;
		this.timer = 3000;
	}

	update(resources, inputs){

		this.timer--;

		this.updateObjects(resources, inputs);

		this.collisionCheck();

		if (this.timer <= 0){
			return new GameoverScene(this.player);
		} else {
			return null;
		}
	}
}
class GameoverScene extends Scene {

	constructor(player){
		super();
		this.player = player;
		this.objects = [];
		this.score = player.score;
		this.flag =
			{ comment : false
			};
	}

	update(resources, inputs){
		if(!this.flag.comment){
			if(this.score>45){
				resources.sounds.excellent.play();
			}else if(this.score>20){
				resources.sounds.well.play();
			}else{
				resources.sounds.bad.play();
			}
			this.flag.comment=true;
		}

		if(inputs.keyStates[keys.esc]){
			return new StartScene();
		}
		return null;
	}

	draw(res){
		res.canvasCtx.save();
		clearCanvas(res.canvasCtx, res.canvas, "white");
		res.canvasCtx.drawImage(res.images.kiritan_big, 50,200, 200, 200);
		res.canvasCtx.drawImage(res.images.result, 50,80, 200, 100);
		res.canvasCtx.drawImage(res.images.ko, 500, 250, 100, 100);
		drawNumber(res.canvasCtx, res.images.numbers, Vector(500,100), Vector(100,160), this.score);
		res.canvasCtx.fillStyle="gray";
		res.canvasCtx.fillText("press ESC to back", 190,400);
		res.canvasCtx.restore();
	}
}
const images = {
	kiritan:        "img/kiritan_sized.png",
	kiritan_big:    "img/kiritan.png",
	mochi:          "img/mochi_sized.png",
	zunko_angry:    "img/zunko_angry_sized.png",
	zunko_sleep:    "img/zunko_sleep_sized.png",
	numbers:        "img/numbers.png",
	ko:             "img/ko.png",
	result:         "img/result.png",
	logo:           "img/logo.png",
}

const sounds = {
	start: 	    "sound/start.mp3",
	titlecall: 	"sound/titlecall.mp3",
	shoot: 	    "sound/shoot.mp3",
	//fullBurst: 	"sound/fullburst.mp3",
	z:          "sound/z.mp3",
	bad:        "sound/bad.mp3",
	well:       "sound/well.mp3",
	excellent: 	"sound/excellent.mp3"
}

window.addEventListener("load", ()=>{
	const canvas = document.getElementById("canvas");
	if( !canvas ){
		console.log("canvas does not found");
	} else {
		const game = new Game({
			images: images,
			sounds: sounds,
			initScene : new StartScene(),
			canvas: canvas
		});

		game.run();
	}
});
