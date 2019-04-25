"use strict";
var $ = require("jquery");
var upload = require("boke-cms-upload");
var ajax = require("boke-cms-ajax");
require("./style.css");

var _ = require("lodash");

var commonJs = require("./common.js");

//保存
var _SaveData = function (info, $tableArea){
    info.partsInfo = [];
    $tableArea.find("tbody tr:not(.emptyText)").each(function (i){
        var data = new Object();
        $(this).find("[name]").each(function (){
            var name = $(this).attr("name");
            data[name] = name == "show" ? this.checked : $(this).val();
        });
        info.partsInfo[i] = data;
    });
};
var _handleSaveData = function (info, options){
    options.$title.find(".saveBtn").click(function (){
        _SaveData(info, options.$tableArea);
        //todo 提交数据
        ajax.post(options.saveAction, {"data": JSON.stringify(info)}, function (data){
            options.saveCallback(data);
        });
    });
};

var _commHandleFun = function (info, options){
	_handleMapping(info.partsInfo);
    _renderPoint(info.partsInfo, options.$imgArea);
    _renderTable(info.partsInfo, options.$tableArea, options.imgPartsTableTmpl);
    _handleChangeEvent(info, options.$tableArea, options.$imgArea, options);
    _handleHoverEvent(options.$imgArea, options.$tableArea);
    _handleMoveEvent(info, options.$imgArea, options.$tableArea);
    _handleDeleteEvent(info, options);
};

// 处理映射关系，导入的数据1-多，新增的1-1，最终以idx为主
var _handleMapping = function(partsInfo){
	for(var i = 0; i < partsInfo.length; i++){
		var partCode1 = partsInfo[i].partCode,
			newAdd1 = eval(partsInfo[i].newAdd) || 0;
		partsInfo[i].idx = i;
		if(!newAdd1){
			partsInfo[i].newAdd = 0;// 替代undefined
			for(var j = 0; j < i; j++){
				var partCode2 = partsInfo[j].partCode,
					newAdd2 = eval(partsInfo[j].newAdd) || 0,
					idx = partsInfo[j].idx;
				if(partCode1 == partCode2 && !newAdd2){
					partsInfo[i].idx = idx;
					break;
				}
			}
		}
	}
}

//添加热点
var _handleAddPoint = function (info, options){
    options.$title.find(".addPointBtn").click(function (){
        var length = info.partsInfo.length;
        var newData = {
            partCode: length + 1,
            partPosition: "0,0",
            show: true,
			newAdd: 1
        }
        info.partsInfo.push(newData);
        _commHandleFun(info, options);
    });
    options.$title.find(".addPointBtn").dblclick(function (){  //当连续双击的时候触发；
        alert("请勿双击！请单击添加热点！");
		return false;
    });	
};

//鼠标经过事件
var _handleHoverEvent = function ($imgArea, $tableArea){
    var switchHover = function (a, b){
        a.hover(function (){
            $(this).addClass('hover');
            var index = $(this).data("code");
            b.each(function (){
                if($(this).data("code") == index){
                    $(this).addClass("hover");
                }
            });
        }, function (){
            $(this).removeClass('hover');
            var index = $(this).data("code");
            b.each(function (){
                if($(this).data("code") == index){
                    $(this).removeClass("hover");
                }
            });
        });
    };
    switchHover($imgArea.find(".map .area"), $tableArea.find(".imgPartsTable tbody tr"));
    switchHover($tableArea.find(".imgPartsTable tbody tr"), $imgArea.find(".map .area"));
};

//热点拖动事件
var _handleMoveEvent = function (info, $imgArea, $tableArea){
    var moved = function ($obj){
        var index = $obj.data('code');
        var _move = false, _x, _y;
        $obj.mousedown(function (e){
            _move = true;
            _x = e.screenX - parseInt($obj.css("left"));
            _y = e.screenY - parseInt($obj.css("top"));
            $obj.addClass("moving");   //加一个“移动中...”的标记
        });
        $imgArea.find(".map").mousemove(function (e){
			
            if(_move){
                var x = e.screenX - _x, y = e.screenY - _y;//移动时根据鼠标位置计算控件左上角的绝对位置
                var w_x = $imgArea.find(".image-item img").width() || $(this).width(),
                    w_h = $imgArea.find(".image-item img").height() || $(this).height();
                var minL = 0, minT = 0;
                var maxL = w_x - $obj.width() + minL,
                    maxT = w_h - $obj.height() + minL;
                x = x < minL ? minL : (x > maxL ? maxL : x);
                y = y < minT ? minT : (y > maxT ? maxT : y);
                $obj.css({top: y + "px", left: x + "px"});//控件新位置
				$.each($tableArea.find(".imgPartsTable tbody").find("tr"), function(){
					var i = $(this).data('code');
					if(index == i){
						$(this).find(".partPosition").addClass("changing").val(x + "," + y);
					}
				});
            }
			
        }).mouseup(function (){
			if(_move){
				$obj.removeClass("moving");
				$.each($tableArea.find(".imgPartsTable tbody").find("tr"), function(){
					var i = $(this).data('code');
					if(index == i){
						$(this).find(".partPosition").removeClass("changing");
					}
				});
			   _SaveData(info, $tableArea);
			   _move = false;
			}
        });
    };
    $imgArea.find(".map .area").each(function (){
        moved($(this));
    });
};

//渲染左侧热点
var _renderPoint = function (partsInfo, $imgArea){
    $imgArea.addClass("imgHotpointManage-imgArea").find(".map").html("");
    //console.log(partsInfo);
    partsInfo.forEach(function (item){
        var position = item.partPosition.split(','),
            left     = position[0],
            top      = position[1],
			idx = item.idx;
        var display = (item.show || item.show == undefined || item.show == null) ? "block" : "none";
		$.each($imgArea.find(".map").find('.area'), function(){
			var IIdx = $(this).data("code");
			if(idx == IIdx){
				display = "none";
				return false;
			}
		});
        $imgArea.find(".map").append('<span class="area" data-code="' + idx + '" style="left:' + left + 'px;top:' + top + 'px;display: ' + display + '">' + (item.partCode ) + '</span>');
    })
};

//渲染右侧零件信息列表
var _renderTable = function (partsInfo, $tableArea, imgPartsTableTmpl){
    var compiled = _.template(imgPartsTableTmpl);
    var html = compiled({items: partsInfo});
    $tableArea.find("tbody").addClass("hasInfo").html(html);
};

//右侧列表数据change事件
var _handleChangeEvent = function (info, $tableArea, $imgArea, options){
    $tableArea.find(".partPosition").change(function (){
        //var index = $(this).parents("tr").data("code");
        var $img = $imgArea.find(".image-item img");
        var maxLeft = $img.width(),
            maxTop  = $img.height();
        var position = $(this).val().split(',');
        var left = position[0], top = position[1];
        if(position.length == 1 || left > maxLeft || top > maxTop){
            alert("输入不正确，请重新输入!");
            $(this).addClass("error").focus();
			return false;
        } else{
            $(this).removeClass("error");
            //$($imgArea.find(".map .area[data-code=" + index + "]")).css({'top': top + "px", 'left': left + "px"});
        }
		
		var partPosition = $(this).val();
		var $tr = $(this).parents('tr');
		var index = $tr.data('code');
		$.each($tableArea.find("tbody").find("tr"), function(idx,el){
			var i = $(el).data('code');
			if(index == i){
				$(this).find('.partPosition').val(partPosition);
			}
		});
        _SaveData(info, $tableArea);
		_commHandleFun(info, options);
    });
    $tableArea.find(".partCode").change(function (){
		var TPartCode = $(this).val();
		var $tr = $(this).parents('tr');
		var newAdd = eval($tr.find('[name = newAdd]').val());
		if(!newAdd){
			$.each($tableArea.find("tbody").find("tr").not($tr), function(){
				var partCode = $(this).find('.partCode').val();
				var code = $(this).data('code');
				var ina = eval($(this).find('[name = newAdd]').val());
				if(TPartCode == partCode && !ina){
					var partPosition = $(this).find('.partPosition').val();
					$tr.find('.partPosition').val(partPosition);
					$tr.data('code', code);
					return false;
				}
			});
		}
        _SaveData(info, $tableArea);
		_commHandleFun(info, options);
    });
    $tableArea.find(".isShow").change(function (){
		var $tr = $(this).parents('tr');
		var index = $tr.data("code");
		var isShow = $(this).is(":checked");
		$.each($tableArea.find("tbody").find("tr"), function(idx,el){
			var i = $(el).data('code');
			if(index == i){
				if(isShow){
					$(el).find(".isShow").attr('checked','true');
				}else{
					$(el).find(".isShow").removeAttr('checked');
				}
			}
		});
        _SaveData(info, $tableArea);
		_commHandleFun(info, options);
    });
};

var _handleDeleteEvent = function (info, options){
    $(options.$tableArea.find(".delBtn")).click(function (){
        var index = $(this).parents("tr").data("code");
        var msg = "您真的确定要删除吗？\n\n请确认！";
        if(confirm(msg) == true){
            $(this).parents("tr").remove();
            $(options.$imgArea.find(".map .area[data-code=" + index + "]")).remove();
            _SaveData(info, options.$tableArea);
            _commHandleFun(info, options);
        }
    });
};
//change or add img upload
var _handleUpload = function (info, options){
    var uploadOptions = {
        $uploadFileShow: $(options.$imgArea).find('.upload-file-show'),
        $uploadBtn: options.$uploadBtn,
        uploadAction: options.uploadAction,
        uploadType: 'image',
        showlocalPath: true,
        successCallBack: function (fileData){
            var imgName = fileData[0].fileName;
            info.imgName = imgName.substring(0, imgName.lastIndexOf('.'));
            info.imgPath = fileData[0].viewUrl;
            options.$title.find("span").html(info.imgName);
            _SaveData(info, options.$tableArea);
        }
    };
    upload.defaultInit(uploadOptions);
};

//渲染图片
var _renderImg = function (info, options){
    var uploadLayout = '<div class="upload-file-show"></div><div class="map"></div>';
    options.$imgArea.html(uploadLayout);
    if(info.imgName){
        options.$imgArea.find(".upload-file-show").html('<a target="_blank" class="image-item" href="' + info.imgPath + '"><img src="' + info.imgPath + '" title="' + info.imgName + '" ></a>');
        options.$title.html('<span>' + info.imgName + '</span><button type="button" class="saveBtn">保存</button><button type="button" class="addPointBtn">添加热点</button>');
    } else{
        options.$title.html('<span>请上传图片</span><button type="button" class="saveBtn">保存</button><button type="button" class="addPointBtn">添加热点</button>');
    }
};

//热点设置页面
var renderInfo = function (options){
    commonJs.getData(options.imgPartsInfoUrl, function (info){
        _renderImg(info, options);
        _commHandleFun(info, options);
        _handleSaveData(info, options);
        _handleAddPoint(info, options);
        _handleUpload(info, options);
    });
};

//鼠标经过事件(用于显示页面)
var _handleHoverEvent2 = function ($imgArea, $tableArea){
	$imgArea.find(".map .area").hover(function (){
            $(this).addClass('hover');
            var index = $(this).text();
            $tableArea.find(".imgPartsTable tbody tr").each(function (){
                if($(this).data("partcode") == index){
                    $(this).addClass("hover");
                }
            });
        }, function (){
            $(this).removeClass('hover');
            var index = $(this).text();
            $tableArea.find(".imgPartsTable tbody tr").each(function (){
                if($(this).data("partcode") == index){
                    $(this).removeClass("hover");
                }
            });
        });
	$tableArea.find(".imgPartsTable tbody tr").hover(function (){
            $(this).addClass('hover');
            var index = $(this).data("partcode");
            $imgArea.find(".map .area").each(function (){
                if($(this).text() == index){
                    $(this).addClass("hover");
                }
            });
        }, function (){
            $(this).removeClass('hover');
            var index = $(this).data("partcode");
            $imgArea.find(".map .area").each(function (){
                if($(this).text() == index){
                    $(this).removeClass("hover");
                }
            });
        });
};
var _commHandleFun2 = function (info, options){
	_handleMapping(info.partsInfo);
    _renderPoint(info.partsInfo, options.$imgArea);
    _renderTable(info.partsInfo, options.$tableArea, options.imgPartsTableTmpl);
    _handleHoverEvent2(options.$imgArea, options.$tableArea);
    options.callback && options.callback();
};

var _renderImg2 = function(info, options){
	var uploadLayout = '<div class="upload-file-show"></div><div class="map"></div>';
	options.$imgArea.html(uploadLayout);
	if(info.imgName){
		options.$imgArea.find(".upload-file-show").html('<a target="_blank" class="image-item" href="' + info.imgPath + '"><img src="' + info.imgPath + '" title="' + info.imgName + '" ></a>');
	}else{
		options.$imgArea.find(".upload-file-show").html('');
	}
}

//热点显示页面 定制化
var renderCustomer = function(options){
	commonJs.getData(options.imgPartsInfoUrl, function (info){
        _renderImg2(info, options);
        _commHandleFun2(info, options);
    });
}

var customerInit = function(options){
	renderCustomer(options);
}

var defaultInit = function (options){
    renderInfo(options);
};

/** Define the export point for module */
module.exports = {
    defaultInit: defaultInit,
	customerInit: customerInit
}

