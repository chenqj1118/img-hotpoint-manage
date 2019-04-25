var ajax = require("boke-cms-ajax");

//通过url获取数据
function getData (url, callback){
    ajax.post(url, {}, function (json){
        callback(json);
    });
};

module.exports = {
    getData: getData
}

