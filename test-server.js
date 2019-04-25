var app = require("webpack-dev-web-test");

var fs = require('fs');
var Busboy = require('busboy');
var URL = require('url');

app.start({}, function (app){
    app.post('/upload.action', function (req, resp){
        var busboy = new Busboy({headers: req.headers});

        var fileName;
        var filePath;
        var downloadUrl;
        var viewUrl;
        var reqUrl = URL.parse(req.url, true).query;
        var testcase = reqUrl.testcase;
        var timestamp = reqUrl.timestamp;
        var fileList = [];

        //接受fast-upload的data参数
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype){
            console.log('Field [' + fieldname + ']: value: ' + val + ",mimetype:" + mimetype);
            if("testcase" == fieldname){
                testcase = val;
            }
            if("timestamp" == fieldname){
                timestamp = val;
            }
        });

        busboy.on('file', function (fieldname, file, filename, encoding, mimetype){
            console.log('Upload File [' + fieldname + ']: filename: ' + filename + ' ...');
            var saveToDir = __dirname + '/web-test/tmp';
            try{
                fs.accessSync(saveToDir, fs.R_OK | fs.W_OK);
            } catch(ex){
                fs.mkdirSync(saveToDir);
            }
            fileName = filename;
            storefileName = testcase + "-" + (timestamp || '') + "-" + filename;
            filePath = saveToDir + "/" + storefileName;
            downloadUrl = "/web-test/tmp/" + storefileName;
            viewUrl = downloadUrl;
            file.pipe(fs.createWriteStream(filePath));
            var file = {
                fileName: fileName,
                filePath: filePath,
                downloadUrl: downloadUrl,
                viewUrl: viewUrl
            };
            fileList.push(file);
        });

        busboy.on('finish', function (){
            var jsonStr = JSON.stringify(fileList);
            resp.send(jsonStr);
            resp.end();
        });
        return req.pipe(busboy);
    });
    app.post('/imgPartsInfo.json', function (req, resp){
        var data = {
            imgCode: 1,
            imgName: "QQ截图20171116160103",
            imgPath: "/web-test/tmp/undefined--QQ截图20171116160103.png",
            partsInfo: [{
                partCode: 1,
                partNo: "A252-2552-W01",
                partName: "机械变速箱1",
                partQty: 2,
                partTip: "3.8 中柴 >2013",
                partPosition: "0,0",
                show: false
            }, {
                partCode: 2,
                partNo: "A252-2552-W01",
                partName: "机械变速箱1",
                partQty: 2,
                partTip: "3.8 中柴 >2013",
                partPosition: "200,200",
                show: true
            }]
        };
        resp.send(JSON.stringify(data));
    });
    app.post('/imgPartsInfo2.json', function (req, resp){
        var data = {
            partsInfo: [{
                partCode: 1,
                partNo: "A252-2552-W01",
                partName: "机械变速箱1",
                partQty: 2,
                partTip: "3.8 中柴 >2013",
                partPosition: "0,0",
                show: false
            }, {
                partCode: 2,
                partNo: "A252-2552-W01",
                partName: "机械变速箱1",
                partQty: 2,
                partTip: "3.8 中柴 >2013",
                partPosition: "200,200",
                show: true
            }, {
                partCode: 2,
                partNo: "A252-2552-W01",
                partName: "机械变速箱1.1",
                partQty: 3,
                partTip: "3.8 中柴 >2013",
                partPosition: "200,200",
                show: true
            }]
        };
        resp.send(JSON.stringify(data));
    });
});
