
function XtalPiScene() {
  this.scene = null;
  this.camera = null;
  this.renderer = null; 
  this.container = null;
  this.controls = null;
  this.clock = null;
  this.stats = null;
  this.index_points = {};
  this.index_conns = {};
}

XtalPiScene.prototype.init = function (tar) {
  this.scene = new THREE.Scene();

  var SCREEN_WIDTH = tar.width(),
      SCREEN_HEIGHT = tar.height()

  // prepare camera
  var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = 10000;
  this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
  this.scene.add(this.camera);
  this.camera.position.set(-100, 100, 100);
  this.camera.lookAt(new THREE.Vector3(0,0,0));

  // prepare renderer
  this.renderer = new THREE.CanvasRenderer();
  this.renderer.setClearColor(0xffffff);
  this.renderer.setPixelRatio( window.devicePixelRatio );
  this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  // this.renderer.setViewport( 0, 0, SCREEN_WIDTH*2, SCREEN_HEIGHT*2 );
  // this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1)

  this.renderer.shadowMapEnabled = true;
  this.renderer.shadowMapSoft = true;

  // prepare container
  this.container = document.createElement('div');
  tar[0].appendChild(this.container);
  this.container.appendChild(this.renderer.domElement);

  // events
  THREEx.WindowResize(this.renderer, this.camera);

  // prepare clock
  this.clock = new THREE.Clock();

  // add directional light
  var dLight = new THREE.DirectionalLight(0xffffff);
  dLight.position.set(-100, 100, 100);
  dLight.castShadow = true;
  // dLight.shadowCameraVisible = true;
  // dLight.shadowDarkness = 0.2;
  dLight.shadow.mapSize.width = dLight.shadow.mapSize.height = 1000;
  this.scene.add(dLight);

  // add particle of light
  // this.particleLight = new THREE.Mesh( new THREE.SphereGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x44ff44 }));
  // this.particleLight.position = dLight.position;
  // this.scene.add(this.particleLight);

  // prepare controls (OrbitControls)
  this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement, null);
  this.controls.target = new THREE.Vector3(0, 0, 0);
  
  
  this.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  
  mouse = new THREE.Vector2();
  this.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
  window.camera = this.camera;
  
  this.raycaster = new THREE.Raycaster();
};

function degTrans(a, z) {
    // console.log(a, z);
    if (a > 0 && z > 0) {
        return a;
    } else if (a <= 0 && z > 0) {
        return 360. + a;
    } else if (a <= 0 && z <= 0) {
        return 180. - a;
    } else if (a > 0 && z <= 0) {
        return 180. - a;
    }
}

function onDocumentMouseDown( event ) {
	event.preventDefault();

    if (INTERSECTED) {
        // console.log(INTERSECTED.data);
        var mol = INTERSECTED.data.handle;
        var a = parseInt(INTERSECTED.data.points[0]);
        var b = parseInt(INTERSECTED.data.points[1]);
        var a_nabs = mol.findNabsAndConns(a, b, false)[0];
        var b_nabs = mol.findNabsAndConns(b, a, false)[0];
        
        // console.log(a_nabs, b_nabs);
        
        var a_ = a_nabs[0];
        var b_ = b_nabs[0];
        
        //   a_     b_
        //    \    /
        //     a--b
        
        var pa_ = new THREE.Vector3().copy(mol.xscene.index_points[a_].position);
        var pa = new THREE.Vector3().copy(mol.xscene.index_points[a].position);
        var pb = new THREE.Vector3().copy(mol.xscene.index_points[b].position);
        var pb_ = new THREE.Vector3().copy(mol.xscene.index_points[b_].position);
        
        var dx = pa.x-pb.x;
        var dy = pa.y-pb.y;
        var dz = pa.z-pb.z;
        var dd = new THREE.Vector3(1, 0, 0).distanceTo(new THREE.Vector3(dx, dy, dz).normalize());
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(pa_, pa, pb, pb_);
        
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } ) );
        // mol.xscene.scene.add(line);
        
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-pa.x, -pa.y, -pa.z));
        
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(new THREE.Vector3(0, dz, -dy).normalize(), -Math.asin( dd/2. )*2);
        rotWorldMatrix.getInverse(rotWorldMatrix);
        geometry.applyMatrix(rotWorldMatrix);
        
        // mol.xscene.t(pa_.x, pa_.y, pa_.z, 0xff0000);
        
        var a1 = degTrans(Math.asin(pa_.y / Math.sqrt(pa_.y*pa_.y+pa_.z*pa_.z))/Math.PI*180, pa_.z);
        var a2 = degTrans(Math.asin(pb_.y / Math.sqrt(pb_.y*pb_.y+pb_.z*pb_.z))/Math.PI*180, pb_.z);
        
        var deg = (a1-a2) > 0 ? (a1-a2): (360+a1-a2);
        // console.log(a1, a2, deg+" deg");
        
        setTimeout(function () {
            var pa = new THREE.Vector3().copy(mol.xscene.index_points[a].position);
            var pb = new THREE.Vector3().copy(mol.xscene.index_points[b].position);
            var res = null;  // prompt([a_,a,b].join(",")+" 和 "+[a,b,b_].join(",")+" 的二面角，取值范围:[0-360）", deg);
            if (res != null) {
                var newd = parseFloat(res);
                if (newd < 0. || newd >= 360.) {
                    // alert("请输入 [0-360）的角度");
                    return;
                }
                
                var d_ = (deg - newd);
                // console.log("d: ", d_);
                
                var nac = mol.findNabsAndConns(a, b, true);
                // console.log(nac);
                var geometry = new THREE.Geometry();
                for (var i = 0; i < nac[0].length; i++) {
                    geometry.vertices.push(mol.xscene.index_points[nac[0][i]].position);
                }
                for (var i = 0; i < nac[1].length; i++) {
                    var lines = mol.xscene.index_conns[nac[1][i]];
                    for (var j = 0; j < lines.length; j++) {
                        // console.log(lines[j].geometry.vertices);
                        if (lines[j].data && lines[j].data.fixRing) {
                            var t1 = new THREE.Matrix4().makeTranslation(-pb.x, -pb.y, -pb.z);
                            var t2 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(dx, dy, dz).normalize(), d_/180.*Math.PI);
                            var t3 = new THREE.Matrix4().makeTranslation(pb.x, pb.y, pb.z);
                            
                            lines[j].applyMatrix(t3.multiply(t2).multiply(t1));
                        }else{
                            var points = lines[j].geometry.vertices;
                            for (var k = 0; k < points.length; k++) {
                                geometry.vertices.push(points[k]);
                            }
                        }
                    }
                }
                
                // geometry.vertices.push(mol.xscene.index_points[b].position);
                
                // var rotWorldMatrix = new THREE.Matrix4();
                // rotWorldMatrix.makeRotationAxis(new THREE.Vector3(0, dz, -dy).normalize(), d_/180.*Math.PI);
                
                geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-pb.x, -pb.y, -pb.z));
                geometry.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(dx, dy, dz).normalize(), d_/180.*Math.PI));
                geometry.applyMatrix(new THREE.Matrix4().makeTranslation(pb.x, pb.y, pb.z));
                
                // for (var i = 0; i < nac[1].length; i++) {
                //     var lines = mol.xscene.index_conns[nac[1][i]];
                //     for (var j = 0; j < lines.length; j++) {
                //         // console.log(lines[j].geometry.vertices);
                //         if (lines[j].data && lines[j].data.fixRing) {
                //             lines[j].updateMatrix();
                //         }
                //     }
                // }
            }
        }, 300);
        
        /////////
        
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(dx, dy, dz));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } ) );
        // mol.xscene.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(2, 0, 0));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } ) );
        // mol.xscene.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 2, 0));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 1 } ) );
        // mol.xscene.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 2));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 1 } ) );
        // mol.xscene.scene.add(line);
    }
}

var mouse;
function onDocumentMouseMove( event ) {
	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

XtalPiScene.prototype.atomColor = function(tp) {
    return ATOM_TABLE[tp].c;
}

XtalPiScene.prototype.atomSize = function(tp) {
    // return "NO";
    return ATOM_TABLE[tp].s;
}


XtalPiScene.prototype.setBound = function(x, y, z) {
    this.boundx = x;
    this.boundy = y;
    this.boundz = z;

    this.bx_2 = 0;//this.boundx/2.0;
    this.by_2 = 0;//this.boundy/2.0;
    this.bz_2 = 0;//this.boundz/2.0;

    var _x = -3.8 *x;
    var _y = 1.6 *y;
    var _z = 2.2 *z;

    this.camera.position.set(_x, _y, _z);
    // this.camera.rotation.z = 90 * Math.PI / 180
    // this.camera.rotation.y = 0 * Math.PI / 180
    // this.particleLight.position.set(_x, _y, _z);
}

XtalPiScene.prototype.programFill = function ( sz, clr, s, fc) {
    var size = sz;
    var color = clr;
    var str = s;
    var fcolor = fc || 0x000000;
        
    return function (context) {
        var PI2 = 6.283185307179586;
    	context.beginPath();
        
        if (size != "NO") {
        	context.arc( 0, 0, size, 0, PI2, true );
            var offset = size * 0.5;
            var grd = context.createRadialGradient(offset, offset, 0.000, offset, offset, offset*5);
            grd.addColorStop(0.000, 'rgba(255, 255, 255, 1.000)');
            var hex = "000000"+color.toString(16);
            grd.addColorStop(0.486, '#'+hex.substr(hex.length - 6));
            context.fillStyle = grd;
            context.fill();
        }
        
        if (str) {
            if (size != "NO")
                context.scale(0.02,-0.02);
            else
                context.scale(0.025,-0.025);
            context.font = "10px Helvetica";
            var hex = "000000"+fcolor.toString(16);
            context.fillStyle = '#'+hex.substr(hex.length - 6);
            context.textAlign="center";
            context.fillText(str, 0, 5);
        }
    }
}

XtalPiScene.prototype.ddot = function(x, y, z, tp, with_num) {
    // add sphere shape
    // var sphere = new THREE.Mesh(new THREE.SphereGeometry(this.atomSize(tp), 16, 16),
    //                                                      new THREE.MeshLambertMaterial({ color: this.atomColor(tp) }));
    // sphere.rotation.y = -Math.PI / 2;
    // sphere.position.x = x - this.bx_2;
    // sphere.position.y = y - this.by_2;
    // sphere.position.z = z - this.bz_2;
    // sphere.castShadow = sphere.receiveShadow = true;
    // this.scene.add(sphere);
    
    if (with_num) {
        if (! this.num) this.num = window.data_start1 ? 1:0;
        var str = tp + this.num;
    }else{
        var str = false;
    }
    
	var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( { program: this.programFill(this.atomSize(tp), this.atomColor(tp), str) } ) );
	particle.position.x = x - this.bx_2;
	particle.position.y = y - this.by_2;
	particle.position.z = z - this.bz_2;
    // particle.scale.x = particle.scale.y = 1;
    particle.data = {tp: tp};
    this.scene.add( particle );
    
    if (with_num) {
        this.index_points[this.num] = particle;
        this.num++;
    }
}

XtalPiScene.prototype.dline = function(x1, y1, z1, x2, y2, z2, tp, w) {
    w = w || 0.05;
    
    //     var points = [];
    //     points.push(new THREE.Vector3(x1-this.bx_2, y1-this.by_2, z1-this.bz_2));
    //     points.push(new THREE.Vector3(x2-this.bx_2, y2-this.by_2, z2-this.bz_2));
    //
    // var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.SplineCurve3(points), 1, w, 16),
    //                                                      new THREE.MeshLambertMaterial({ color: this.atomColor(tp) }));
    //     // tube.rotation.y = -Math.PI / 2;
    //     tube.position.x = 0;
    //     tube.position.y = 0;
    //     tube.position.z = 0;
    //     tube.castShadow = tube.receiveShadow = true;
    //     this.scene.add(tube);
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(x1-this.bx_2, y1-this.by_2, z1-this.bz_2));
    geometry.vertices.push(new THREE.Vector3(x2-this.bx_2, y2-this.by_2, z2-this.bz_2));
    
    var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: this.atomColor(tp), linewidth: w*100 } ) );
    this.scene.add(line);
    
    return line;
}

XtalPiScene.prototype.ddline = function(x1, y1, z1, x2, y2, z2, c1, c2, tp, userdata) {
    if (userdata) {
        userdata.points.sort(function(a, b) {return a - b;});
        var conns = [];
        this.index_conns[userdata.points[0]+"_"+userdata.points[1]] = conns;
    } else {
        var conns = false;
    }
    
    
    var v1 = new THREE.Vector3(x1, y1, z1);
    var v2 = new THREE.Vector3(x2, y2, z2);
    var D = v1.distanceTo(v2);
    
    var R1 = this.atomSize(c1) == "NO" ? 0.2 : this.atomSize(c1);
    var R2 = this.atomSize(c2) == "NO" ? 0.2 : this.atomSize(c2);
    
    var Rx1 = (x1-x2) * R1 / D;
    var Ry1 = (y1-y2) * R1 / D;
    var Rz1 = (z1-z2) * R1 / D;
                 
    var Rx2 = (x2-x1) * R2 / D;
    var Ry2 = (y2-y1) * R2 / D;
    var Rz2 = (z2-z1) * R2 / D;
    
    x1 -= Rx1;
    y1 -= Ry1;
    z1 -= Rz1;
    
    x2 -= Rx2;
    y2 -= Ry2;
    z2 -= Rz2;
    
    // console.log(Rx1,Ry1,Rz1,Rx2,Ry2,Rz2, c1, c2)
    
    var v1_ = new THREE.Vector3(x1, y1, z1);
    var v2_ = new THREE.Vector3(x2, y2, z2);
    
    var x_ = (x1+x2)/2.0;
	var y_ = (y1+y2)/2.0;
	var z_ = (z1+z2)/2.0;
    
    if (tp == "DOUBLE") {
        var dx = x1-x2;
        var dy = y1-y2;
        var dz = z1-z2;
        var dd = new THREE.Vector3(1, 0, 0).distanceTo(new THREE.Vector3(dx, dy, dz).normalize());
        var d_ = new THREE.Vector3(0, 0, 0).distanceTo(new THREE.Vector3(dx, dy, dz));
        var dis = 0.08;
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, dis, 0), new THREE.Vector3(d_, dis, 0));
        var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: this.atomColor(c1), linewidth: 5 } ) );
        
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(new THREE.Vector3(0, dz, -dy).normalize(), -Math.asin( dd/2. )*2);
        var trans = new THREE.Matrix4().makeTranslation(x2,y2,z2).multiply(rotWorldMatrix);
        geometry.applyMatrix(trans);
                
        this.scene.add(line);
        if (conns) conns.push(line);
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, -dis, 0), new THREE.Vector3(d_, -dis, 0));
        var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: this.atomColor(c2), linewidth: 5 } ) );
        
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(new THREE.Vector3(0, dz, -dy).normalize(), -Math.asin( dd/2. )*2);
        var trans = new THREE.Matrix4().makeTranslation(x2,y2,z2).multiply(rotWorldMatrix);
        geometry.applyMatrix(trans);
                
        this.scene.add(line);
        if (conns) conns.push(line);
        
    } else {
        if (c1 != c2) {
            // this.dline(v1.x, v1.y, v1.z, x1, y1, z1, "Kr");
        	var l = this.dline(x1, y1, z1, x_, y_, z_, c1);
            if (conns) conns.push(l);
        	var l = this.dline(x2, y2, z2, x_, y_, z_, c2);
            if (conns) conns.push(l);
            // this.dline(v2.x, v2.y, v2.z, x2, y2, z2, "Kr");
        } else {
            // this.dline(v1.x, v1.y, v1.z, x1, y1, z1, "Kr");
            var l = this.dline(x1, y1, z1, x2, y2, z2, c1);
            if (conns) conns.push(l);
            // this.dline(v2.x, v2.y, v2.z, x2, y2, z2, "Kr");
        }
    }
        
    if (tp == "FIX") {
        var dx = x1-x2;
        var dy = y1-y2;
        var dz = z1-z2;
        var dd = new THREE.Vector3(1, 0, 0).distanceTo(new THREE.Vector3(dx, dy, dz).normalize());
        
        var geometry = new THREE.Geometry();
        var a = [270, 255, 240, 225, 210, 195, 180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15, 0];
        for (var i = 0; i < a.length; i++) {
            var p = new THREE.Vector3(0, Math.sin(a[i]/180.*Math.PI)*0.3, Math.cos(a[i]/180.*Math.PI)*0.3);
            geometry.vertices.push(p);
        }
        
        geometry.vertices.push(new THREE.Vector3(0, 0, 0.3));
        geometry.vertices.push(new THREE.Vector3(0.15, 0.15, 0.25));
        geometry.vertices.push(new THREE.Vector3(0, 0, 0.3));
        geometry.vertices.push(new THREE.Vector3(-0.15, 0.15, 0.25));
        
        var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff3333, linewidth: 3 } ) );
        line.data = userdata
        line.data.fixRing = true;
        
        var trans = new THREE.Matrix4().makeTranslation(x_,y_,z_).multiply(
            new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, dz, -dy).normalize(), -Math.asin( dd/2. )*2)
        );
        geometry.applyMatrix(trans);
        this.scene.add(line);
        
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0.6, 0));
        geometry.applyMatrix(trans);
        var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( 
            { program: this.programFill("NO", 0x0, userdata.fix_label ? "φ"+userdata.fix_label : "", 0xff3333) } ) 
        );
        var p = geometry.vertices[0];
    	particle.position.x = p.x;
        particle.position.y = p.y;
        particle.position.z = p.z;
        this.scene.add( particle );
        
        if (conns) conns.push(line);
        
        
        //////
        
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(dx, dy, dz));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xf03f50, linewidth: 1 } ) );
        // this.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, dz, -dy));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x223f50, linewidth: 1 } ) );
        // this.scene.add(line);
                
        //////
        
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(2, 0, 0));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } ) );
        // this.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 2, 0));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 1 } ) );
        // this.scene.add(line);
        //
        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 2));
        // var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 1 } ) );
        // this.scene.add(line);
    }
}

XtalPiScene.prototype.t = function (x_,y_,z_,c) {
	var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( { program: this.programFill(0.05, c) } ) );
	particle.position.x = x_;
	particle.position.y = y_;
	particle.position.z = z_;
    // particle.scale.x = particle.scale.y = 1;
    this.scene.add( particle );
}

XtalPiScene.prototype.flexibleProgram = function ( ) {
    return function (context) {
        var PI2 = 6.283185307179586;
    	context.lineWidth = 0.025;
    	context.beginPath();
    	context.arc( 0, 0, 0.1, 0, PI2, true );
    	context.stroke();
    }
}

XtalPiScene.prototype.dcircle = function(x, y, z) {
	var particle = new THREE.Sprite( new THREE.SpriteCanvasMaterial( { program: this.flexibleProgram(), color:0xff3333 } ) );
	particle.position.x = x;
	particle.position.y = y;
	particle.position.z = z;
    // particle.scale.x = particle.scale.y = 1;
	this.scene.add( particle );
}

XtalPiScene.prototype.clear = function () {
    cancelAnimationFrame(animation_id);// Stop the animation
    this.renderer.domElement.addEventListener('dblclick', null, false); //remove listener to render
    this.scene = null;
    this.projector = null;
    this.camera = null;
    this.controls = null;
    this.particleLight = null;
    $(this.container).parent().empty();
}

XtalPiScene.prototype.toXYZ = function () {
    var buf = [];
    var n = 0;
    for (var i in xtalpiscene.index_points) {
        var p = xtalpiscene.index_points[i];
        buf.push([p.data.tp, p.position.x, p.position.y, p.position.z].join("  "));
        n++;
    }
    
    return n + "\n\n" + buf.join("\n");
}

window.xtalpiscene = new XtalPiScene();

// Animate the scene
function animate() {
    window.animation_id = requestAnimationFrame(animate);
    render();
    update();
}

// Update controls and stats
function update() {
    xtalpiscene.controls.update(xtalpiscene.clock.getDelta());
    // xtalpiscene.stats.update();
}

var INTERSECTED;
var last_selected_t = 0;
function render() {
    if (xtalpiscene.renderer) {
        xtalpiscene.renderer.render(xtalpiscene.scene, xtalpiscene.camera)
        
        xtalpiscene.raycaster.setFromCamera( mouse, camera );
        var intersects = xtalpiscene.raycaster.intersectObjects( xtalpiscene.scene.children );
        var tar = null;
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.data && intersects[i].object.data.fixRing) {
                tar = intersects[i].object;
                break;
            }
        }
        
        if (tar) {
            if (INTERSECTED != tar) {
                if (INTERSECTED) 
                    INTERSECTED.material.color = new THREE.Color( 0xff3333 );
                tar.material.color = new THREE.Color( 0x000000 );
            }
            last_selected_t = (new Date()).valueOf();
            INTERSECTED = tar;
        }
        
        if (INTERSECTED && tar == null && (new Date()).valueOf() - last_selected_t > 100){
            if (INTERSECTED)
                INTERSECTED.material.color = new THREE.Color( 0xff3333 );
            INTERSECTED = null;
        }
    }
}


//////////////////////////////////////////////////////

function CIF(xscene, op){
    this.xscene = xscene;
    this.a     = op["length_a"];
    this.b     = op["length_b"];
    this.c     = op["length_c"];
    this.angle_alpha  = op["angle_alpha"];
    this.angle_beta   = op["angle_beta"];
    this.angle_gamma  = op["angle_gamma"];

    this.cosA = Math.cos(this.angle_alpha /180. *Math.PI);
    this.sinA = Math.sin(this.angle_alpha /180. *Math.PI);
    this.cosB = Math.cos(this.angle_beta  /180. *Math.PI);
    this.sinB = Math.sin(this.angle_beta  /180. *Math.PI);
    this.cosG = Math.cos(this.angle_gamma /180. *Math.PI);
    this.sinG = Math.sin(this.angle_gamma /180. *Math.PI);

    this.v = Math.sqrt( 1 - this.cosA*this.cosA - this.cosB*this.cosB - this.cosG*this.cosG + 2*this.cosA*this.cosB*this.cosG );

    this.atoms = [];
    this.xyz_atoms = [];
}

CIF.prototype.addAtom = function (x, y, z, tp) {
    this.atoms.push([x-0.5, y-0.5, z-0.5, tp]);
};

CIF.prototype.draw = function () {
	this.boundx = this.cx(1, 1, 1);
	this.boundy = this.cy(1, 1, 1);
	this.boundz = this.cz(1, 1, 1);

    this.xscene.setBound(this.boundx/2.0, this.boundy/2.0, this.boundz/2.0);

    this.drawFrame();
    this.drawAtoms();
    this.drawConnects();
};

CIF.prototype.cx = function(A, B, C) {
    with(this) {
	    return a*A + b*cosG*B + c*cosB*C;
    }
}
CIF.prototype.cy = function(A, B, C) {
    with(this) {
	    return b*sinG*B + c*(cosA-cosB*cosG)/sinG*C;
    }
}
CIF.prototype.cz = function(A, B, C) {
    with(this) {
	    return c*v/sinG*C;
    }
}

CIF.prototype.drawFrame = function () {
    with(this) {
    	var frame = [
                        [[-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5]],
                        [[-0.5, -0.5, -0.5], [-0.5, +0.5, -0.5]],
                        [[-0.5, -0.5, -0.5], [-0.5, -0.5, +0.5]],
                        [[+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5]],
                        [[+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5]],
                        [[+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5]],

                        [[+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5]],
                        [[+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5]],
                        [[+0.5, -0.5, +0.5], [+0.5, -0.5, -0.5]],
                        [[+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5]],
                        [[-0.5, +0.5, +0.5], [-0.5, +0.5, -0.5]],
                        [[-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5]],
    				];
    	//
    	for (var i = 0; i < frame.length; i++) {
    		var f1 = frame[i][0];
    		var f2 = frame[i][1];

    		xscene.dline(cx(f1[0], f1[1], f1[2]),
    					 cy(f1[0], f1[1], f1[2]),
    					 cz(f1[0], f1[1], f1[2]),
    					 cx(f2[0], f2[1], f2[2]),
    					 cy(f2[0], f2[1], f2[2]),
    					 cz(f2[0], f2[1], f2[2]), "frame", 0.02);
    	}

        xscene.dline(-boundx*0.6, -boundy*0.6, -boundz*0.6,
                     -boundx*0.3, -boundy*0.6, -boundz*0.6, "x", 0.03);
        xscene.dline(-boundx*0.6, -boundy*0.6, -boundz*0.6,
                     -boundx*0.6, -boundy*0.3, -boundz*0.6, "y", 0.03);
        xscene.dline(-boundx*0.6, -boundy*0.6, -boundz*0.6,
                     -boundx*0.6, -boundy*0.6, -boundz*0.3, "z", 0.03);
    }
};

CIF.prototype.drawAtoms = function () {
    with(this) {
    	for (var i = 0; i < atoms.length; i++) {
    		var A = atoms[i][0];
    		var B = atoms[i][1];
    		var C = atoms[i][2];

    		var x = cx(A, B, C);
    		var y = cy(A, B, C);
    		var z = cz(A, B, C);

			xscene.ddot(x, y, z, atoms[i][3]);
            xyz_atoms.push([x, y, z, atoms[i][3]])
    	}
    }
};

CIF.prototype.drawConnects = function () {
    with(this){
        var pairs = [];

		for (var i = 0; i < xyz_atoms.length-1; i++) {
			for (var j = i+1; j < xyz_atoms.length; j++) {
                dis2 = Math.pow(xyz_atoms[i][0]-xyz_atoms[j][0], 2) +
                       Math.pow(xyz_atoms[i][1]-xyz_atoms[j][1], 2) +
                       Math.pow(xyz_atoms[i][2]-xyz_atoms[j][2], 2);

				if (xyz_atoms[i][3] == 'H' && xyz_atoms[j][3] == 'H') {
                    if (dis2 < 1.4*.14) pairs.push([i, j]);
				}else if (dis2 < 2*2) {
					pairs.push([i, j]);
				}
			}
		}

		for (var j = 0; j < pairs.length; j++) {
			var i = pairs[j][0];
			var c = pairs[j][1];
			if (i != c && c >= 0) {
				xscene.ddline(xyz_atoms[c][0], xyz_atoms[c][1], xyz_atoms[c][2],
					          xyz_atoms[i][0], xyz_atoms[i][1], xyz_atoms[i][2],
				              xyz_atoms[c][3], xyz_atoms[i][3]);
			}
		}
    }
};

//////////////////////////////////////////////////////

function MOL(xscene){
    this.xscene = xscene;
    this.atoms = [];
    this.xyz_atoms = [];
    this.pairs = [];
}

MOL.prototype.draw = function () {
    var sumX=0, sumY=0, sumZ=0,
        maxX=0, maxY=0, maxZ=0,
        cenX, cenY, cenZ;

    var atoms = this.atoms;

    for (var i=0; i<atoms.length; i++) {
        sumX += atoms[i][0]*1.0;
        sumY += atoms[i][1]*1.0;
        sumZ += atoms[i][2]*1.0;
    }
    cenX = sumX / atoms.length;
    cenY = sumY / atoms.length;
    cenZ = sumZ / atoms.length;

    for (var i = 0; i < atoms.length; i++) {
        maxX = Math.max(maxX, Math.abs(cenX-atoms[i][0]));
        maxY = Math.max(maxY, Math.abs(cenY-atoms[i][1]));
        maxZ = Math.max(maxZ, Math.abs(cenZ-atoms[i][2]));
    }

    this.xscene.setBound(maxX, maxY, maxZ);

    // this.drawFrame(Math.max(maxX, maxY, maxZ) * 0.4);
    this.drawAtoms(cenX, cenY, cenZ);
    // this.drawFlexible(15-1, 19-1);
    this.drawConnects();
};

MOL.prototype.addAtom = function (x, y, z, tp) {
    this.atoms.push([x, y, z, tp]);
};

MOL.prototype.addConn = function (pairs, da_pairs) {
    this.pairs = pairs;
    this.daPairsLabel = {}
    for (var i = 0; i < da_pairs.length; i++) {
        this.daPairsLabel[da_pairs[i][0]+"_"+da_pairs[i][1]] = i+1;
    }
}

MOL.prototype.drawFrame = function (l) {
    with(this) {
        xscene.dline(0, 0, 0,
                     l, 0, 0, "x", 0.03);
        xscene.dline(0, 0, 0,
                     0, l, 0, "y", 0.03);
        xscene.dline(0, 0, 0,
                     0, 0, l, "z", 0.03);
    }
};

MOL.prototype.drawAtoms = function (cenX, cenY, cenZ) {
    with(this) {
    	for (var i = 0; i < atoms.length; i++) {
    		var A = atoms[i][0];
    		var B = atoms[i][1];
    		var C = atoms[i][2];

    		var x = A-cenX;
    		var y = B-cenY;
    		var z = C-cenZ;

			xscene.ddot(x, y, z, atoms[i][3], true);
            xyz_atoms.push([x, y, z, atoms[i][3]])
    	}
    }
};

MOL.prototype.drawConnects = function () {
    with(this){
        var paris = {};
        for (var i = 0; i < this.pairs.length; i++) {
            paris[this.pairs[i][0] + "_" + this.pairs[i][1]] = true;
        }
            
		for (var i = 0; i < xyz_atoms.length-1; i++) {
			for (var j = i+1; j < xyz_atoms.length; j++) {
                dis2 = Math.pow(xyz_atoms[i][0]-xyz_atoms[j][0], 2) +
                       Math.pow(xyz_atoms[i][1]-xyz_atoms[j][1], 2) +
                       Math.pow(xyz_atoms[i][2]-xyz_atoms[j][2], 2);

                var d1 = ATOM_TABLE[xyz_atoms[i][3]].d;
                var d2 = ATOM_TABLE[xyz_atoms[j][3]].d;
        
                if (dis2 < Math.pow(d1*1.2+d2*1.2, 2) && ! paris[i+"_"+j]) {
                    this.pairs.push([i, j, "SINGLE"]);
                }
			}
		}

		for (var j = 0; j < this.pairs.length; j++) {
			var i = this.pairs[j][0];
			var c = this.pairs[j][1];
			if (i != c && c >= 0) {
                // console.log(this.pairs);
                // console.log(this.daPairsLabel, i+"_"+c);
				xscene.ddline(xyz_atoms[c][0], xyz_atoms[c][1], xyz_atoms[c][2],
					          xyz_atoms[i][0], xyz_atoms[i][1], xyz_atoms[i][2],
				              xyz_atoms[c][3], xyz_atoms[i][3], this.pairs[j][2], 
                              {points:[i, c], handle:this, fix_label: this.daPairsLabel[i+"_"+c]});
			}
		}
    }
};

MOL.prototype.drawFlexible = function (a, b) {
    with(this) {
		var xa = xyz_atoms[a][0];
		var ya = xyz_atoms[a][1];
		var za = xyz_atoms[a][2];
        
		var xb = xyz_atoms[b][0];
		var yb = xyz_atoms[b][1];
		var zb = xyz_atoms[b][2];
        
    	xscene.dcircle((xa+xb)/2., (ya+yb)/2., (za+zb)/2.);
    }
};

MOL.prototype.findNabsAndConns = function (start, without, isLoop) {
    var process = [start];
    var nabs = {};
    var conns = {};
    
    do {
        // console.log(process)
        var p = process.shift();
        for (var i = 0; i < this.pairs.length; i++) {
            var m = this.pairs[i][0];
            var n = this.pairs[i][1];
            var mn = [m, n].sort(function(a, b) {return a - b;}).join("_");
            
            if (m == p && n != without) {
                if (! (n in nabs)) {
                    nabs[n] = 1;
                    process.push(n);
                }
                
                conns[mn] = 1
            }
            else if (n == p && m != without) {
                if (! (m in nabs)) {
                    nabs[m] = 1;
                    process.push(m);                    
                }
                
                conns[mn] = 1
            }
        }
    } while (process.length > 0 && isLoop);
    
    var ret0 = [];
    for (var k in nabs) ret0.push(parseInt(k));
    ret0.sort(function(a, b) {return a - b; });
    
    var ret1 = [];
    for (var k in conns) ret1.push(k);
    
    return [ret0, ret1];
}


//////////////////////////////////////////////////////


ATOM_TABLE = { 
    H : {d: 0.31, c: 0xd0d0d0, s: 0.24},
    He: {d: 0.28, c: 0xfefeff, s: 0.30},
    Li: {d: 1.28, c: 0xe992fd, s: 0.31},
    Be: {d: 0.96, c: 0xecff00, s: 0.32},
    B : {d: 0.84, c: 0xffd9d6, s: 0.33},
    C : {d: 0.76, c: 0x666666, s: 0.38},
    N : {d: 0.71, c: 0x2020fc, s: 0.40},
    O : {d: 0.66, c: 0xfe0100, s: 0.46},
    F : {d: 0.57, c: 0xd6fdff, s: 0.40},
    Ne: {d: 0.58, c: 0xcfffff, s: 0.41},
    Na: {d: 1.66, c: 0xc46aff, s: 0.41},
    Mg: {d: 1.41, c: 0xccec01, s: 0.42},
    Al: {d: 1.21, c: 0xf8c6c7, s: 0.42},
    Si: {d: 1.11, c: 0x99b7b7, s: 0.43},
    P : {d: 1.07, c: 0xfe9a00, s: 0.43},
    S : {d: 1.05, c: 0xffee2f, s: 0.44},
    Cl: {d: 1.02, c: 0x20fe1b, s: 0.44},
    Ar: {d: 1.06, c: 0x9af9ff, s: 0.45},
    K : {d: 2.03, c: 0xa34af4, s: 0.45},
    Ca: {d: 1.76, c: 0xafb201, s: 0.46},
    Sc: {d: 1.70, c: 0xfffeff, s: 0.46},
    Ti: {d: 1.60, c: 0xe1e3ef, s: 0.47},
    V : {d: 1.53, c: 0xc4c3cb, s: 0.47},
    Cr: {d: 1.39, c: 0xa2b4e4, s: 0.48},
    Mn: {d: 1.39, c: 0xb88feb, s: 0.48},
    Fe: {d: 1.32, c: 0x9691eb, s: 0.49},
    Co: {d: 1.26, c: 0x6e81ff, s: 0.49},
    Ni: {d: 1.24, c: 0x6f92e6, s: 0.50},
    Cu: {d: 1.32, c: 0xff8f73, s: 0.50},
    Zn: {d: 1.22, c: 0x9597d4, s: 0.51},
    Ga: {d: 1.22, c: 0xe5aaac, s: 0.51},
    Ge: {d: 1.20, c: 0x79abac, s: 0.52},
    As: {d: 1.19, c: 0xe29afe, s: 0.52},
    Se: {d: 1.20, c: 0xffc000, s: 0.53},
    Br: {d: 1.20, c: 0xc32a27, s: 0.53},
    Kr: {d: 1.16, c: 0x70dffa, s: 0.54},
    I : {d: 1.39, c: 0xaf03b1, s: 0.54},
    
    frame:{c: 0x0}, x: {c: 0xff0000}, y: {c: 0x00ff00}, z: {c: 0x0000ff}
}
