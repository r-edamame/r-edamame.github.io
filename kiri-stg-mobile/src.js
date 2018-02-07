
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
const registTouchEvent = (target, evname, callback)=>{
    target.addEventListener(evname, e=>{
        e.preventDefault()
        const bound = target.getBoundingClientRect();
        for(const touch of e.changedTouches){
            const x = touch.clientX - bound.left;
            const y = touch.clientY - bound.top;
            if(0<=x && x<target.width && 0<=y && y<target.height){
                callback({id:touch.identifier, x:x, y:y});
            }
        }
    });
}

const initTouch = (dom, target) => {
    registTouchEvent(dom, "touchstart", target.onTouchStart.bind(target));
    registTouchEvent(dom, "touchmove", target.onTouchMove.bind(target));
    registTouchEvent(dom, "touchend", target.onTouchEnd.bind(target));
}

class Tick {
    constructor(fps, target){
        this.fps = fps;
        this.target = target;
        this.frame = 0;
        this.ticking = false;
    }

    start(){
        if(!this.ticking){
            const func = ()=>{
                this.target.onTick(this.frame)
                this.frame++;
            };
            this.intv = setInterval(func, 1000/this.fps);
            this.ticking = true;

            return true;
        }else{
            return false;
        }
    }

    pause(){
        if(this.ticking){
            clearInterval(this.intv);
            this.ticking = false;

            return true;
        }else{
            return false;
        }
    }
    
    reset(){
        this.frame = 0;
    }
}
class Controller {
    constructor(core){
        this.core = core;
    }

    clear(color){
        this.core.ctx.save();
        this.core.ctx.fillStyle = color || "white";
        this.core.ctx.fillRect(0,0,this.core.canvas.width, this.core.canvas.height);
        this.core.ctx.restore();
    }
    rect(x,y,sx,sy,color){
        this.core.ctx.save();
        this.core.ctx.fillStyle = color;
        this.core.ctx.fillRect(x,y,sx,sy);
        this.core.ctx.restore();
    }
    arc(x,y,rad,start,end,color){
        const mid = (start+end)/2;
        this.core.ctx.save();
        this.core.ctx.fillStyle = color;
        this.core.ctx.beginPath();
        this.core.ctx.arc(x,y,rad, mid,end, true);
        this.core.ctx.lineTo(x,y);
        this.core.ctx.arc(x,y,rad, start, end, false);
        this.core.ctx.lineTo(x,y);
        this.core.ctx.closePath();
        this.core.ctx.fill();
        this.core.ctx.restore();
    }
    circle(x,y,rad,color){
        this.core.ctx.save();
        this.core.ctx.fillStyle = color;
        this.core.ctx.beginPath();
        this.core.ctx.arc(x,y,rad, 0,Math.PI*2, false);
        this.core.ctx.fill();
        this.core.ctx.restore();
    }
    img(img,x,y){
        this.core.ctx.save();
        this.core.ctx.drawImage(this.core.imgs[img],x,y);
        this.core.ctx.restore();
    }
    imgSize(img,px,py,sx,sy){
        this.core.ctx.save();
        this.core.ctx.drawImage(this.core.imgs[img],px,py,sx,sy);
        this.core.ctx.restore();
    }
    imgSplit(img, px, py, sx, sy, wn, hn, index){
        this.core.ctx.save();

        const splittedWidth = this.core.imgs[img].width/wn;
        const splittedHeight = this.core.imgs[img].height/hn;
        this.core.ctx.drawImage(
            this.core.imgs[img],
            (index%wn)*splittedWidth,
            (Math.floor(index/wn))*splittedHeight,
            splittedWidth,
            splittedHeight,
            px,
            py,
            sx,
            sy
        );

        this.core.ctx.restore();
    }

    sound(name){
        const dummy = Object.freeze({
            play: ()=>{console.log("it's dummy sound")},
            loopPlay: ()=>{console.log("it's dummy sound")},
            stop: ()=>{console.log("it's dummy sound")}
        });
        return this.core.sounds[name] || dummy;
    }

    text(txt, px, py, color, size){
        this.core.ctx.save();
        this.core.ctx.font = size + "px 'Arial'";
        this.core.ctx.fillStyle = color;
        const textlen = this.core.ctx.measureText(txt).width;
        this.core.ctx.fillText(txt, px-(textlen/2), py);
        this.core.ctx.restore();
    }

    pushScene(scene){
        this.core.sceneStack.on("stop", [this]);
        scene.init(this);
        this.core.sceneStack.pushScene(scene);
    }
    popScene(){
        this.core.sceneStack.popScene();
        this.core.sceneStack.on("resume", [this]);
    }
    replaceScene(scene){
        this.core.sceneStack.on("stop", [this]);
        scene.init(this);
        this.core.sceneStack.replaceScene(scene);
    }

    tickStart(){
        if(this.core.tick){
            this.core.tick.reset();
            this.core.tick.start();
        }
    }

    tickPause(){
        if(this.core.tick){
            this.core.tick.pause();
        }
    }

    tickResume(){
        if(this.core.tick){
            this.core.tick.start();
        }
    }

    addScore(point){
        if(this.core.score!==null && typeof point==="number"){
            this.core.score += point;
        }
    }
    getScore(){
        if(this.core.score!==null){
            return this.core.score;
        }else{
            return null;
        }
    }
    resetScore(){
        if(this.score!==null){
            this.core.score = 0;
        }
    }

    mkButton(name,event){
        if(this.core.dom){
           const button = document.createElement("input");
           button.type = "button"
           button.value = name;
           button.addEventListener("click",()=>{
               this.core.onDOMEvent(event, button);
           });
           this.core.dom.appendChild(button);
        }
    }
    mkTextForm(name,event){
        if(this.core.dom){
            const form = document.createElement("form");
            const text = document.createElement("input");
            const submit = document.createElement("input");

            text.type = "text";
            text.placeholder = name;
            submit.type = "button";
            submit.value = "submit";

            form.appendChild(text);
            form.appendChild(submit);
            submit.addEventListener('click', ()=>{
                this.core.onTextSubmit(event, text.value, form);
             });
             this.core.dom.appendChild(form);
         }
    }
    insertDOM(dom){
        if(this.core.dom){
            this.core.dom.appendChild(dom);
        }
    }
    deleteDOM(dom){
        if(this.core.dom){
            this.core.dom.removeChild(dom);
        }
    }
    clearDOM(){
        if(this.core.dom){
            while(this.core.dom.firstChild) this.core.dom.removeChild(this.core.dom.firstChild);
        }
    }

    setTimer(evname, time){
        setTimeout(()=>{this.core.onTimer(evname);}, time);
    }

    WSSend(data){
        if(this.core.ws && this.core.ws.readyState===1){
            console.log(data);
            this.core.ws.send(typeof data==="string" ? data : JSON.stringify(data));
        }
    }

    WSClose(){
        if(this.core.ws){
            this.core.ws.close();
            delete this.core.ws;
        }
    }
    httpGetYaml(event, path){
        const xhr = new XMLHttpRequest();
        xhr.onload = e => {
            this.core.onHttpResponse(event, jsyaml.load(xhr.responseText));
        }
        xhr.onerror = err =>{ console.log("http request error : ", err); };
        xhr.open("GET", path);
        xhr.send();
    }

    width(){
        return this.core.canvas.width;
    }
    height(){
        return this.core.canvas.height;
    }
}


// images
// imgName : string
// imgUrl : string
// imgs : { imgName: imgUrl }

// sounds : { soundName : soundUrl }

class Core {
    constructor(scene){
        this.sceneStack = new SceneStack(scene);
    }


    initialize(config){
        return new Promise((resolve,reject)=>{

            const ps = [];
            
            const canvas = document.getElementById("maincanvas");
            if(!canvas){
                reject("canvas not found");
            }
            if(!canvas.getContext){
                reject("invalid canvas");
            }
            const ctx = canvas.getContext("2d");

            this.canvas = canvas;
            this.ctx = ctx;

            if(config.score){
                this.score = 0;
            }

            if(config.touch){
                initTouch(this.canvas, this);
            }

            if(typeof config.tick==="number"){
                this.tick = new Tick(config.tick, this);
            }

            if(config.imgs){
                ps.push(imgload(config.imgs).then(imgs=>{
                    this.imgs = imgs;
                    return Promise.resolve();
                }));
            }

            if(config.sounds){
                this.sounds = {};
                Object.entries(config.sounds).forEach(e=>{
                    this.sounds[e[0]] = new Sound(e[1]);
                });
            }

            if(typeof config.ws==="string"){
                ps.push(new Promise((res,rej)=>{
                    this.ws = new WebSocket(config.ws);
                    if(!this.ws){
                        rej("Websocket initialization failed");
                    }
                    this.ws.onopen = ()=>{
                        this.ws.onerror = this.onError;
                        res();
                    }
                    this.ws.onmessage = this.onMessage.bind(this);
                    this.ws.onerror = rej;
                    this.ws.onclose = this.onClose;
                }));
            }

            if(config.dom){
                this.dom = config.dom;
            }

            if(config.geo){
                if(!("geolocation" in navigator)){
                    reject("geolocation is invalid");
                }else{
                    this.geo = navigator.geolocation.watchPosition(this.onGeolocation.bind(this), this.onGeoError, {enableHighAccuracy:true});
                }
            }
                

            this.ctl = new Controller(this);

            Promise.all(ps).then(()=>{
                this.sceneStack.on("init", [this.ctl]);
                this.sceneStack.draw(this.ctl);
                resolve();
            }).catch(reject);
        });
    }

    onTouchStart(e){
        this.sceneStack.on("onTouchStart", [this.ctl, e]);
        this.sceneStack.draw(this.ctl);
    }
    onTouchMove(e){
        this.sceneStack.on("onTouchMove", [this.ctl, e]);
        this.sceneStack.draw(this.ctl);
    }
    onTouchEnd(e){
        this.sceneStack.on("onTouchEnd", [this.ctl, e]);
        this.sceneStack.draw(this.ctl);
    }
    onTick(frame){
        this.sceneStack.on("onTick", [this.ctl, frame]);
        this.sceneStack.draw(this.ctl);
    }
    onDOMEvent(event,dom){
        this.sceneStack.on("onDOMEvent", [this.ctl, event, dom]);
        this.sceneStack.draw(this.ctl);
    }
    onTextSubmit(event, text, dom){
        this.sceneStack.on("onTextSubmit", [this.ctl, event, text, dom]);
        this.sceneStack.draw(this.ctl);
    }
    onTimer(event){
        this.sceneStack.on("onTimer", [this.ctl, event]);
        this.sceneStack.draw(this.ctl);
    }
    onMessage(mes){
        this.sceneStack.on("onMessage", [this.ctl, JSON.parse(mes.data)]);
        this.sceneStack.draw(this.ctl);
    }
    onWSError(m){
        console.log(m);
        this.ws = null;
    }
    onWSClose(){
        this.ws = null;
    }
    onGeolocation(position){
        const coord = position.coords;
        this.sceneStack.on("onGeolocation", [this.ctl, {lng:coord.longitude, lat:coord.latitude}]);
    }
    onGeoError(e){
        console.log(e);
    }
    onHttpResponse(event, data){
        this.sceneStack.on("onHttpResponse", [this.ctl, event, data]);
        this.sceneStack.draw(this.ctl);
    }
}

const imgload = imgs=>{
    const ps = [];
    for(const name in imgs){
        const img = new Image();
        img.src = imgs[name];
        const p = new Promise((res,rej)=>{
            img.onload = ()=>res([name,img]);
            img.onerror = rej;
        });
        ps.push(p);
    }
    return Promise.all(ps).then(values=>{
        const _imgs = {};
        for(const i of values){
            _imgs[i[0]] = i[1];
        }
        return Promise.resolve(_imgs);
    });
};

class GameObject {
    constructor(pos, tag, collider){
        this.pos = Object.assign({}, pos);
        this.tag = tag;
        this.collider = collider;
    }

    onCollide(obj){
    }

    update(corectl, objctl){
        return false;
    }

    draw(ctl){
    }

    updateTimers(){
        Object.entries(this.timers).forEach(t=>{
            if(t[1]>0){
                this.timers[t[0]] = t[1]-1;
            }
        });
    }
}
class ObjContainer {
    constructor(objects){
        this.objects = objects;
        this.controller = new ObjController();
    }


    update(corectl){
        this.objects = this.objects.filter(e=>e.update(corectl, this.controller));
        Array.prototype.push.apply(this.objects, this.controller.takeObjects());
    }

    collisionCheck(){
        for(let i=0; i<this.objects.length-1; i++){
            for(let j=i+1; j<this.objects.length; j++){
                if(isCollide(this.objects[i], this.objects[j])){
                    this.objects[i].onCollide(this.objects[j]);
                    this.objects[j].onCollide(this.objects[i]);
                }
            }
        }
    }

    draw(ctl){
        this.objects.forEach(e=>{
            e.draw(ctl);
        });
    }
}

class ObjController {
    constructor(){
        this.objects = [];
    }

    addObject(object){
        this.objects.push(object);
    }

    takeObjects(){
        const tmp = this.objects;
        this.objects = [];
        return tmp;
    }
}
class Zunko extends GameObject {
    constructor(pos){
        super(pos, "zunko", new RectCollider(Vector(46,35), Vector(8,5)));
        
        this.speed = Vector(2.4, 0);

        this.dying = false;
        this.size = Zunko.size;

        this.timers = {
            animation: 0
        };

        this.animation = {
            imgIndex: 0,
        };

        this.images = ["zunko_angry", "zunko_sleep"];
    }

    draw(ctl){
        ctl.img(this.images[this.animation.imgIndex], this.pos.x, this.pos.y);
    }

    update(corectl, objctl){
        this.updateTimers();

        if(!this.dying){
            this.pos = move(this.pos, this.speed);
        }

        if(this.pos.x >= corectl.width()){
            return false;
        }

        if(this.dying && this.timers.animation <= 0){
            return false;
        }

        return true;
    }

    onCollide(obj){
        if(obj.tag === "mochi"){
            this.dying = true;
            this.timers.animation = 10;
            this.animation.imgIndex = 1;

            this.collider = null;
        }
    }
}

Zunko.size = Vector(100,100);

class ZunkoFactory extends GameObject {
    constructor(){
        super(Vector(0,0), "ZunkoFactory", null);
        this.timers = {
            pop: 50
        };
    }

    update(corectl, objctl){
        this.updateTimers();

        if(this.timers.pop<=0){
            const y = (Math.random()*(corectl.height()-300))+50;
            objctl.addObject(new Zunko(Vector(0,y)));

            this.timers.pop = 25;
        }

        return true;
    }
}
class Kiritan extends GameObject {
    constructor(pos){
        super(pos, "kiritan", null);

        this.size = Kiritan.size;

        this.cannonPos = {
            right: Vector(58,18),
            left: Vector(20,22)
        };

        this.states = {
            shotFrom: "right",
            fullBurst: false
        };

        this.timers = {
            animation: 0,
            shot: 0,
            fullBurst: 0
        };

        this.flags = {
            shooting: false
        };

        this.shotInterval = 20;
        this.aim = Vector(0,0);
    }

    update(corectl, objctl){
        this.updateTimers();

        if(this.pos.y < corectl.height()-this.size.y){
            this.pos.y += 0.3;
            if(this.pos.y > corectl.height()-this.size.y){
                this.pos.y = corectl.height()-this.size.y;
            }
        }

        if(this.flags.shooting && this.timers.animation <= 0){
            const speed = vscale(this.getShootVectorUnit(), 20);
            const cp = this.cannonPos[this.states.shotFrom];
            const mpos = vadd(this.pos, vadd(cp, Vector(-Mochi.size.x/2, -Mochi.size.y/2)));
            objctl.addObject(new Mochi(mpos, speed));

            this.flags.shooting = false;
        }

        return true;
    }

    onTap(ctl, t){
        if(this.timers.shot<=0){
            this.flags.shooting = true;
            this.timers.animation = 3;

            if(this.states.shotFrom==="right") this.states.shotFrom = "left";
            else this.states.shotFrom = "right";

            this.timers.shot = this.shotInterval;

            this.aim = Vector(t.x, t.y);

            ctl.sound("shoot").play();
        }
    }

    getShootVectorUnit(){
        return vunit(vsub(this.aim, vadd(this.pos, this.cannonPos[this.states.shotFrom])));
    }

    draw(ctl){
        const scale = this.flags.shooting ? 0.9 : 1;
        ctl.imgSize("kiritan", this.pos.x, this.pos.y, this.size.x*scale, this.size.y*scale);
    }
}

Kiritan.size = Vector(100,100);
class Mochi extends GameObject {
    constructor(pos, speed){
        super(pos, "mochi", new CircleCollider(Vector(21,21),20));

        this.size = Mochi.size;
        this.accel = Vector(0, 0.25);
        this.states = {
            speed: speed
        };
        this.flags = {
            hit: false
        }
    }

    update(corectl, objctl){
        this.states.speed.y += this.accel.y;

        this.pos = move(this.pos, this.states.speed);

        if(this.pos.y > corectl.height()){
            return false;
        }

        if(this.flags.hit){
            corectl.addScore(1);
            return false;
        }

        return true;
    }

    draw(ctl){
        ctl.imgSize("mochi", this.pos.x, this.pos.y, this.size.x, this.size.y);
    }

    onCollide(obj){
        if(obj.tag === "zunko"){
            this.flags.hit = true;
        }
    }
}

Mochi.size = Vector(50,50);
class Scene{
    constructor(){}

    init(){}
    stop(){}
    resume(){}

    draw(){}

    onTouchStart(){}

    onTouchMove(){}

    onTouchEnd(){}

    onMessage(){}

    onTick(){}

    onDOMEvent(){}

    onTextSubmit(){}
    
    onGeolocation(){}

    onTimer(){}

    onHttpResponce(){}
}

class SceneStack {
    constructor(scene){
        this.scenes = [scene];
    }

    on(func, args){
        const top = this.scenes[0];
        top[func].apply(top,args);
    }

    getTop(){
        return this.scenes[0];
    }

    pushScene(scene){
        this.scenes.unshift(scene);
    }

    popScene(){
        if(this.scenes.length<=1){
            throw "invalid pop"
        }
        this.scenes.shift();
    }

    replaceScene(scene){
        this.scenes[0] = scene;
    }

    draw(ctl){
        this.scenes[0].draw(ctl);
    }
}


class InitScene extends Scene {
    constructor(){
        super();

        this.flags = {
            tapped: false
        };

        this.frame = 0;
    }

    init(ctl){
        ctl.sound("titlecall").play();
    }

    onTimer(ctl, event){
        switch(event){
            case "startGame":
                ctl.replaceScene(new MainScene());
                break;
        }
    }

    onTouchStart(ctl){
        if(!this.flags.tapped){
            this.flags.tapped = true;
            ctl.sound("start").play();
            ctl.setTimer("startGame", 2000);
        }
    }

    draw(ctl){
        ctl.clear();

        ctl.img("logo", 20, 20);
        ctl.text("tap to start", 350, 370, "gray", 30);
    }
}

class MainScene extends Scene {
    constructor(){
        super();

        this.kiritan= new Kiritan(Vector(500,300));
        this.objects = new ObjContainer([
            new ZunkoFactory(),
            this.kiritan
        ]);
    }

    init(ctl){
        ctl.tickStart();
    }

    onTick(ctl,frame){
        if(frame>1500){
            ctl.tickPause();
            ctl.replaceScene(new ResultScene());
            return;
        }

        this.objects.update(ctl);
        this.objects.collisionCheck();
    }

    onTouchStart(ctl, e){
        this.kiritan.onTap(ctl,e);
    }

    draw(ctl){
        ctl.clear("white");
        this.objects.draw(ctl);
    }

}
class ResultScene extends Scene {
    constructor(){
        super();
        this.score = null;
        this.taptoback = false;
    }

    init(ctl){
        ctl.setTimer("taptoback", 2000);

        this.score = ctl.getScore();

        if(this.score===null){
            throw new Error("score does not exist");
        }

        if(this.score>=45){
            ctl.sound("excellent").play();
        }else if(this.score>=20){
            ctl.sound("well").play();
        }else{
            ctl.sound("bad").play();
        }
    }

    onTimer(ctl, event){
        switch(event){
            case "taptoback":
                this.taptoback = true;
                break;
        }
    }

    onTouchStart(ctl){
        if(this.taptoback){
            ctl.resetScore();
            ctl.replaceScene(new InitScene());
        }
    }

    draw(ctl){
        ctl.clear();
        ctl.imgSize("big_kiritan", 50, 200, 200, 200);
        ctl.imgSize("result", 50, 80, 200, 100);
        ctl.imgSize("ko", 500, 250, 100, 100);
        drawNumber(ctl, Vector(500,100), Vector(100,160), this.score);
        ctl.text("tap to back", 350, 370, "gray", 30);
    }
}

const drawNumber = (ctl, pos, size, num) => {
    const numarray = [];

    for(let i=num; i>0; i=Math.floor(i/10)){
        numarray.push(i%10);
    }
    if(numarray.length===0){
        numarray.push(0);
    }

    numarray.forEach((n,i)=>{
        ctl.imgSplit("numbers", pos.x-(i*size.x), pos.y, size.x, size.y, 5, 2, n);
    })
}
window.addEventListener("load", ()=>{
    const images = {
        kiritan: "img/kiritan_sized.png",
        mochi: "img/mochi_sized.png",
        zunko_angry: "img/zunko_angry_sized.png",
        zunko_sleep: "img/zunko_sleep_sized.png",
        numbers: "img/numbers.png",
        logo: "img/logo.png",
        result: "img/result.png",
        ko: "img/ko.png",
        big_kiritan: "img/kiritan.png"

    };

    const sounds = {
        titlecall: "sound/titlecall.mp3",
        start: "sound/start.mp3",
        shoot: "sound/shoot.mp3",
        bad: "sound/bad.mp3",
        well: "sound/well.mp3",
        excellent: "sound/excellent.mp3"
    };

    const config = {
        tick: 30,
        imgs: images,
        sounds: sounds,
        touch: true,
        score: true
    };

    const core = new Core(new InitScene());
    core.initialize(config);
});
