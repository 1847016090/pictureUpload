/**
 * Created by boy on 2017/7/10.
 */
var express = require('express');
var app = express();
var fs = require("fs");

var bodyParser = require('body-parser');
var multer = require('multer');

//3,指定模板引擎
app.set("views engine", 'ejs');
//4,指定模板位置
app.set('views', __dirname + '/views');

//1,接受表单的请求
app.use(bodyParser.urlencoded({extended: false}));
//2,设置下载的地址
app.use(multer({dest: '/public/'}).array('image'));

app.get('/index', function (req, res) {
    res.sendFile(__dirname + "/views/" + "index.html");
})

// 引入模块
var COS = require('cos-nodejs-sdk-v5');
var cos = new COS({
    // 必选参数
    SecretId: "AKIDa3NYYObUmuqbBc776tUt67xcfdS6Zszu",
    SecretKey: "rW0IvPipkT8xc5PsFRiroZ8cv1ub6PAl",
});

app.post('/upload', function (req, res) {
    //1,原始图片的地址
    var filepath = req.files[0].path;
    var fileKey = '123img';
    //2,把原始文件向腾讯云平台提交
    // 调用方法
    cos.putObject({
        Bucket: "yk-1257212764", /* 必须 */ // Bucket 格式：test-1250000000
        Region: "ap-chengdu",
        Key: fileKey, /* 必须 */
        TaskReady: function (tid) {
        },
        onProgress: function (progressData) {
            //console.log(JSON.stringify(progressData));
        },
        // 格式1. 传入文件内容
        // Body: fs.readFileSync(filepath),
        // 格式2. 传入文件流，必须需要传文件大小
        Body: fs.createReadStream(filepath),
        ContentLength: fs.statSync(filepath).size
    }, function (err, data) {
        if (err) {
            return console.log(err);
        }
        if (data.statusCode == 200) {
            //res.end("上传图片成功！");
            //1,上传图片成功就插入图片

//1, 引入模块
            var ImageUtil = require('./dao/ImageUtil');
//2,创建对象
            imageUtil = new ImageUtil();
            imageUtil.init();
//3,插入语句
            imageUtil.inserImage(0,fileKey);

        }
    });


})
app.get('/infor',function (req,res) {
    //1,查询数据库
    //1, 引入模块
    var ImageUtil = require('./dao/ImageUtil');
//2,创建对象
    imageUtil = new ImageUtil();
    imageUtil.init();
//3,插入语句
    imageUtil.queryAll(function (data) {
        //根据数据，获得key值
        var length =data.length;
        for(var i=0;i<length;i++){
           var key= data[i].imageKey;
           //到腾讯云平台获得图片地址
          var url=  cos.getObjectUrl({
                Bucket: "yk-1257212764", // Bucket 格式：test-1250000000
                Region: "ap-chengdu",
                Key: key,
                Expires: 600000,
                Sign: true,
            }, function (err, QQdata) {
                // var url='';
                // if(err){
                //     console.log(err);
                // }else{
                //     url=QQdata.Url;
                // }

            });

            console.log(data[i])
            data[i].imageKey=url;
        }

        res.render('infor',{imageData:data})
    });



});

var server = app.listen(8088);
