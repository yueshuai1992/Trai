var express = require("express");
var fs = require("fs");
var app = express();
app.use(express.static("public"));
app.get("/index自驾团在线支付页面.html",function(req,res){
	res.send("hello")
})
app.listen(3000)