var imgHotpointManage = require("..");
var $ = require("jquery");

var imgPartsTableTmpl = require('./tmpl/imgPartsTable.html');

var options = {
    $imgArea: $(".imgHotpointManage-img"),  //左侧图片容器
    $tableArea: $(".imgHotpointManage-table"), //右侧信息容器
    $title: $(".imgHotpointManage-title"), //标题信息容器
    imgPartsTableTmpl: imgPartsTableTmpl,
    uploadAction: '/upload.action',
    imgPartsInfoUrl: '/imgPartsInfo2.json',
	$uploadBtn: $(".testuploadBtn")
}

imgHotpointManage.defaultInit(options);





