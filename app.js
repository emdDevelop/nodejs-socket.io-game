var express=require('express');
var app=express();
var server =require('http').Server(app);
var io=require('socket.io')(server);
var socketList={};
var frame=0;
var playersCount=0;

function getRandomColor() {
	  // creating a random number between 0 and 255
	  var r = Math.floor(Math.random() * 256);
	  var g = Math.floor(Math.random() * 256);
	  var b = Math.floor(Math.random() * 256);
	 
	  // going from decimal to hex
	  var hexR = r.toString(16);
	  var hexG = g.toString(16);
	  var hexB = b.toString(16);
	 
	  // making sure single character values are prepended with a "0"
	  if (hexR.length == 1) {
	    hexR = "0" + hexR;
	  }
	 
	  if (hexG.length == 1) {
	    hexG = "0" + hexG;
	  }
	 
	  if (hexB.length == 1) {
	    hexB = "0" + hexB;
	  }
	 
	  // creating the hex value by concatenatening the string values
	  var hexColor = "#" + hexR + hexG + hexB;
	   
	  return hexColor.toUpperCase();
	}

var Player=function(id){//player constructor
		var self={
				 name: null,
				   id: id,
		    userAgent: null,
		          lat: null,
		          lon: null,
		        score: 0,
				color: getRandomColor(),
			    width: 25,
		       height: 25,
		            x: 25,
		            y: 25,
		 gravitySpeed: 0,
		      gravity: 0.06,
		    collision: false,
		pressingRight: false,
		 pressingLeft: false,
	       pressingUp: false,
		pressingSpace: false,
		   sideAttack: null,
		   clientTime: null,
		   serverTime: null,
		          rec: null
		};
		
		self.updatePosition=function(){
			if(self.pressingRight){
				self.x+=5;
				self.sideAttack="right";
			}
				
			if(self.pressingLeft){
				self.x-=5;
				self.sideAttack="left";
			}
			if(self.pressingUp){
				self.gravitySpeed+=-0.2;
				self.y=self.y+self.gravitySpeed;
			}
			
			//self.gravitySpeed+=self.gravity;
			//self.y=self.y+self.gravitySpeed;
			
		};
		
		self.hitBoundaries=function(){
			if(self.x<0)
				self.x=0; //left boundary
			if(self.x+25>500)
				self.x=500-25; //right boundary
			if(self.y+25>500){
				self.y=500-25; //bottom boundary	
				self.score=0;   //hit bottom clear player score
				self.gravity=0;
			}else
				self.gravity=0.06;
		};
		
		self.attack=function(){
			if(self.pressingSpace){
				if(frame!=0 && frame%10==0 && playersCount>=1) //step every 10 frames
					var blt = new Bullet(self.x,self.y,self.sideAttack,self.id);	
					}
		};
		
		self.detectCollision=function(){
				for(var i in Object.list){
					if(((self.x+self.width>Object.list[i].x && self.x+self.width<Object.list[i].x +Object.list[i].width)
						||(self.x>Object.list[i].x && self.x<Object.list[i].x+Object.list[i].width)
						||(self.x+self.width/2>Object.list[i].x && self.x+self.width/2<Object.list[i].x+Object.list[i].width)) 
					    &&(self.y>Object.list[i].y && (self.y<Object.list[i].y +Object.list[i].height)
						||(self.y+self.height>Object.list[i].y && self.y+self.height<Object.list[i].y+Object.list[i].height))){
							self.score=0;
					}
				}
					for(var i in Bullet.list){
						if(self.id!=Bullet.list[i].parent && (((self.x+self.width>Bullet.list[i].x && self.x+self.width<Bullet.list[i].x +Bullet.list[i].width)
							||(self.x>Bullet.list[i].x && self.x<Bullet.list[i].x+Bullet.list[i].width)
							||(self.x+self.width/2>Bullet.list[i].x && self.x+self.width/2<Bullet.list[i].x+Bullet.list[i].width)) 
						    &&(self.y>Bullet.list[i].y && (self.y<Bullet.list[i].y +Bullet.list[i].height)
							||(self.y+self.height>Bullet.list[i].y && self.y+self.height<Bullet.list[i].y+Bullet.list[i].height)))){
								self.score=0;
						}
				}//end of for
		};//end of detectCollision
		
		Player.list[id]=self;
		return self;
	};	
	
Player.list={};
	
Player.onConnect=function(socket,usersAgent){
	var player=Player(socket.id);
	player.userAgent=usersAgent;
		
	var add=15;
	for(var i in Player.list){
		if(Player.list[i].name!=null){
			socketList[socket.id].emit("users",{
				  name: Player.list[i].name,
				 agent: Player.list[i].userAgent,
				 color: Player.list[i].color,
				     y: add,
			 clearRect: 1
			});
			add+=30;
		}//end of if	
	}//end of for
	
//response to username..........................................................................
  socket.on('username',function(data){
	console.log("User Name: " + data.userN);
	player.name=data.userN;
	playersCount++;
	
	for(var x in socketList){
		var add=15;
		var clearSet=0; // we use it to clear canvas so as not to have duplicates
		for(var i in Player.list){
			if(clearSet == 0){ //if clearSet is 0 clear canvas
				socketList[x].emit("users",{
					  name: Player.list[i].name,
					 agent: Player.list[i].userAgent,
					 color: Player.list[i].color,
					     y: add,
				 clearRect: clearSet
				});
				add+=30;
				clearSet=1;// set clearSet to 1 so as not to clear canvas
			}else {
				socketList[x].emit("users",{
				 	  name: Player.list[i].name,
				 	 agent: Player.list[i].userAgent,
				 	 color: Player.list[i].color,
					     y: add,
				 clearRect: clearSet
				});
				add+=30;
			}//end of else
		}//end of for 
	 }//end of for
  });//end of socket.on username 
  
// response to time
  socket.on('clientTime',function(data){
	  var time=new Date().getTime()/1000;
	  player.clientTime=data;
	  player.serverTime=time;
	  socket.emit('serverTime',{
		  serverT:player.serverTime,
		  clientT:player.clientTime
	  })
  });
  
 //response to coords..........................................................................
  socket.on('coords',function(data){
	  player.lat=data.lat;
	  player.lon=data.lon;
	  console.log(player.lat +" "+ player.lon);
	  
	  var pack=[];
	  
	  for(var t in Player.list){  
		  pack.push({
			  lat:Player.list[t].lat,
			  lon:Player.list[t].lon
		  });
	  }
		  for(var i in socketList){
			  socketList[i].emit('addCoords',pack);
		  }  
  });
  
 //response to message.......................................................................... 
    socket.on('sendMsgToServer',function(data){
    	for(var i in socketList){
    		socketList[i].emit('addToChat',player.name + ': ' + data);
    	}
    });
  
//response to keypress..........................................................................
  socket.on('keypress',function(data){ 
	  if(data.inputId==='left')
		  {
		  player.pressingLeft=data.state;
		  }
	  if(data.inputId==='right')
		  {
		  player.pressingRight=data.state;
		  }
	  if(data.inputId==='up')
		  {
		  player.pressingUp=data.state; 
		  }
	  if(data.inputId==='attack')
		  {
		  player.pressingSpace=data.state;
		  }
	  
	  if(data.state===true)
		  {
		  console.log(data.sequence); 
		  player.req=data.sequence;
		  }
	     
  }); 	
}//end of player on connect

Player.onDisconnect=function(socket){
	//Response to disconnect........................................................................  
	  socket.on('disconnect',function(){
		  if(Player.list[socket.id]==null){
			  delete socketList[socket.id];
		  }else{
			  console.log(Player.list[socket.id].name + " disconnected with id " + socket.id);
			  delete socketList[socket.id];
			  delete Player.list[socket.id];
			  
			  if(playersCount>0)
			  playersCount--;
			  
			  for(var x in socketList){
					var add=15;
					var clearSet=0;
					for(var i in Player.list){
						if(clearSet == 0){
							socketList[x].emit("users",{
							   	  name: Player.list[i].name,
							   	 agent: Player.list[i].userAgent,
							   	 color: Player.list[i].color,
								     y: add,
							 clearRect: clearSet
							});
							add+=30;
							clearSet=1;
						}else {
							socketList[x].emit("users",{
								  name: Player.list[i].name,
								 agent: Player.list[i].userAgent,
								 color: Player.list[i].color,
								     y: add,
							 clearRect: clearSet
							});
							add+=30;
						}//end of else
					}//end of for in users
				 }//end of for in socketList
			  var pack=[];
			  
			  for(var t in Player.list){  
				  pack.push({
					  lat:Player.list[t].lat,
					  lon:Player.list[t].lon
				  });
			  }
				  for(var i in socketList){
					  socketList[i].emit('addCoords',pack);
				  }  
			  
			  
		  }//end of else
	  });//end of disconnect	
}

Player.update=function(){
	var pack=[];
	for(var i in Player.list){
		if(Player.list[i].name!=null){
			var player=Player.list[i];
			player.updatePosition();
			player.hitBoundaries();
			player.attack();
			player.detectCollision();
			player.score++;
			pack.push({
			    name:player.name,
				   x:player.x,
				   y:player.y,
			   color:player.color,
	     playerScore:player.score,
	  	  sideAttack:player.sideAttack,
last_processed_input:player.req
			});
		}//end of if
	  }//end of for
	
	return pack;
}

var Obstacles=function(){
	   this.id=Math.random();
	   this.x=510;
	   this.y=Math.random()*400; 
	   this.width=15;
	   this.height=150;
	   this.color='black';
		   
	   this.updatePosition=function(){
		   this.x--;
		   if(this.x<-5)
				delete Object.list[this.id];// Removes obstacle outside canvas                    
	   };
	   
	   Object.list[this.id]=this;
		return this;	   
};

Object.list={};

Obstacles.update=function(frame){
	var pack=[];
	
	
	if(frame==0 && playersCount>=1){
	var obst = new Obstacles();	
	}

	for(var i in Object.list){
		var object=Object.list[i];
		object.updatePosition();
		pack.push({
			   x:object.x,
				y:object.y,
			width:object.width,
		   height:object.height,
			color:'black'
		   });
		for(var i in Player.list){
			if(((Player.list[i].x+Player.list[i].width>object.x && Player.list[i].x+Player.list[i].width<object.x +object.width)
				||(Player.list[i].x>object.x && Player.list[i].x<object.x+object.width)
				||(Player.list[i].x+Player.list[i].width/2>object.x && Player.list[i].x+Player.list[i].width/2<object.x+object.width)) 
			    &&(Player.list[i].y>object.y && (Player.list[i].y<object.y +object.height)
				||(Player.list[i].y+Player.list[i].height>object.y && Player.list[i].y+Player.list[i].height<object.y+object.height))){
				   pack.push({
					    x:object.x,
						y:object.y,
					width:object.width,
				   height:object.height,
					color:'red'
				   });
			}
		}//end of for
	  }
		
	return pack;
};

var Bullet=function(x,y,sideAttack,parent){
	   this.id=Math.random();
	   this.x=x;
	   this.y=y; 
	   this.width=15;
	   this.height=15;
	   this.color='black';
	   this.sideAttack=sideAttack;
	   this.parent=parent;
		   
	   this.updatePosition=function(){
		   if(this.sideAttack==='left'){
		   this.x-=5;
		   }else if(this.sideAttack==='right'){
			   this.x+=5;  
		   }
		   if(this.x<-5 || this.x>505)
				delete Bullet.list[this.id];// Removes obstacle outside canvas 
	   };
	 
	  this.detectCollision=function(){
			for(var i in Object.list){
				if(((this.x+this.width>Object.list[i].x && this.x+this.width<Object.list[i].x +Object.list[i].width)
					||(this.x>Object.list[i].x && this.x<Object.list[i].x+Object.list[i].width)
					||(this.x+this.width/2>Object.list[i].x && this.x+this.width/2<Object.list[i].x+Object.list[i].width)) 
				    &&(this.y>Object.list[i].y && (this.y<Object.list[i].y +Object.list[i].height)
					||(this.y+this.height>Object.list[i].y && this.y+this.height<Object.list[i].y+Object.list[i].height))){
					delete Bullet.list[this.id];// Removes bullet
				}
			}//end of for
	};//end of detectCollision
	   
	   Bullet.list[this.id]=this;
		return this;	   
};

Bullet.list={};

Bullet.update=function(frame){
	var pack=[];
	
	for(var i in Bullet.list){
		var bullet=Bullet.list[i];
		bullet.updatePosition();
		bullet.detectCollision();
		pack.push({
			    x:bullet.x,
				y:bullet.y,
			width:bullet.width,
		   height:bullet.height,
			color:'black'
		   });
	  }
	return pack;
};

app.get('/',function(req,res){
	res.sendFile(__dirname + '/client/index.html');
	console.log("Ip:"+req.connection.remoteAddress + " Port:"+req.connection.remotePort /
			+" Local Address: "+req.connection.localAddress +" Local Port: "+req.connection.localPort);
	//console.log(req.headers['user-agent']);
});
app.use('/client',express.static(__dirname +'/client'));

server.listen(2000);
console.log("server is listening on port 2000");

//Response on connection.......................................................................
io.sockets.on('connection',function(socket){
	socket.id=Math.random();
	console.log("socket connection "+ socket.id);
	console.log(socket.handshake.headers['user-agent']);
	
	var usersAgent=socket.handshake.headers['user-agent'];
	var start=usersAgent.indexOf(';');
	var end=usersAgent.indexOf(')');
	usersAgent=usersAgent.substring(start+2,end);
	usersAgent=usersAgent.replace(/;/g,' ');
	console.log(usersAgent);
	
	socketList[socket.id]=socket;	
	Player.onConnect(socket,usersAgent);
	Player.onDisconnect(socket);

}); //end of io.sockets.on
//var oldtime=0;
setInterval(function(){
	//var time=new Date().getTime()/1000;
	//console.log((time-oldtime)*1000+" ms");
	//oldtime=time;
	var pack={
		player:Player.update(),
	  obstacle:Obstacles.update(frame),
	    bullet:Bullet.update(frame)
	};

	if(playersCount==0)
		clearInterval();
		
			for(var i in socketList){
				var socket=socketList[i];
				socket.emit('newPosition',pack);
			}	

			frame++;	
			if(frame==151)
				  frame=0;	
},16);




