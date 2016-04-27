var fs = require("fs");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:false}));
app.get("/index自驾团主页.html",function(req,res){
	res.send("hello")
})
app.post("/Email",function(req,res){
	var obj = req.body;
	fs.readFile("data/userlist.json","utf8",function(err,data1){
		var result;
		var userlist = JSON.parse(data1);
		for(var i in userlist){
			if(userlist[i].Email==obj.Email1){
				result=true;
				break;
			}else
			{
				result=false;
			}
		}
		res.send(result)
	})
})
app.post("/username",function(req,res){
	var obj = req.body;
	fs.readFile("data/userlist.json","utf8",function(err,data1){
		var result;
		var userlist = JSON.parse(data1);
		for(var i in userlist){
			if(userlist[i].username==obj.username1){
				result=true;
				break;
			}else
			{
				result=false;
			}
		}
		res.send(result)
	})
})
app.post("/massage",function(req,res){
	var obj =req.body;
	fs.readFile("data/userlist.json","utf8",function(err,data1){
		var userlist = JSON.parse(data1);
		userlist.push(obj);
		userlistStr = JSON.stringify(userlist,null,4)
		fs.writeFile("data/userlist.json",userlistStr)
	})
})
app.post("/loginName",function(req,res){
	var obj =req.body;
	fs.readFile("data/userlist.json","utf8",function(err,data1){
		var userlist = JSON.parse(data1);
		var result;//布尔

		for(var i in userlist){
			if(userlist[i].Email==obj.loginname||userlist[i].username==obj.loginname){
				result=true;
				break;
			}else{
				result=false;
			}
		}
		res.send(result)
	});
});
app.post("/loginPass",function(req,res){
	var obj = req.body;
	fs.readFile("data/userlist.json","utf8",function(err,data1){
		var userlist = JSON.parse(data1);
		var result;//布尔
		for(var i in userlist){
			if(userlist[i].Email==obj.username||userlist[i].username==obj.username){
				if(userlist[i].password==obj.password){
					result=true;
					break;
				}else{
					result=false;
				}
			}else{
				result=false;
			}
		}
		res.send(result)
	});
});

app.listen(3000)
console.log("服务器启动！")