// node patch命令入口
// -d参数: node patch 版本号 -d ，如果加入-d参数，会先删除patch目录下的对应版本目录，然后进行patch生成 

// 生成增量包时候：patch_make(text1, text2) => patches
// app生成全量包时候：patch_apply(patches, text1) => [text2, results]


// var patches =dmp.diff_main("123456789", "012356889"); // dmp.patch_make('aa','aab');
// var text1 = 'abcdefghijklmnopqrstuvwxyz--------------------1234567890';
// var text2 = 'abcXXXXXXXXXXdefghijklmnopqrstuvwxyz--------------------1234567YYYYYYYYYY890';
// var patches = dmp.patch_make(text1, text2);
// results = dmp.patch_apply(patches, text1);
// 
// results===['ABCDEFGHIJKLMNOPQRSTUVWXYZ--------------------1234567YYYYYYYYYY890', [false, true]]


// console.log(results[0]);

var fs = require('fs');
var path = require("path");
var crypto = require('crypto');
var image = require("imageinfo");
var archiver = require('archiver');
var util = require('util');
var shelljs = require('shelljs');
require('./lib/diff_match_patch');
var dmp = new diff_match_patch();
var program = require('commander');
program
	.version('0.1.0')
	.usage('[options] [value ...]')
	.option('-t, --target <value>','Add version')
	
	.on('--help', function(){
		console.log('  Examples:');
	    console.log();
	    console.log('    $ deploy exec sequential');
	    console.log('    $ deploy exec async');
	    console.log();
	})
	.parse(process.argv);
console.log(program.args);
// console.log(' int: %j', program.target);

var targetVersion = program.args[0];

if(!!targetVersion == false) {
	console.log('!!!!!  请输入版本号');
	return;
}


var fileList = [];
//创建多层文件夹 同步
function mkdirsSync(dirpath, mode) {
    dirpath = path.dirname(dirpath);
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        // console.log('ff--',dirpath.split(path.sep));
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            } else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true;
}

function copyFile(src, dst) {
    mkdirsSync(dst);

    // 大文件可用
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}

function moveFile(src, dst) {
    mkdirsSync(dst);
    // copyFile(src,dst);
    var fileReadStream = fs.createReadStream(src);
    var fileWriteStream = fs.createWriteStream(dst);
    fileReadStream.pipe(fileWriteStream);

    fileWriteStream.on('close', function() {

        fs.unlinkSync(src);
        console.log('-----------close-----------');

    });
    // fs.createReadStream(src).pipe(fs.createWriteStream(dst));

}



//模拟async.map的执行
function myMap(arrayData, call, resultCallback) {
    var p = arrayData;
    var finalResultData = [];
    var intercall = function(error, resultData) {
        watchLength--;
        finalResultData.push(resultData);
        if (watchLength == 0) {
            resultCallback(null, finalResultData);
        }
    };
    var watchLength = p.length;
    for (var i = 0; i < p.length; i++) {
        (function(index) {
            setTimeout(function() {
                call(index, intercall);
            }, 100);
        }(p[i]));
    }

}

//获取目录下的所有文件信息
function getDir(dir_path, oldVersion, lastVersion, updateJson, finalCallback) {
    var mpath = path.join(__dirname, dir_path);
    // console.log(mpath);
    var over = [];
    var watchProcessDir = [];
    watchProcessDir.push(mpath);

    function judgeAllDone(mpath) {
        // console.log('*********',mpath);
        watchProcessDir.splice(watchProcessDir.indexOf(mpath), 1);
        //console.log(watchProcessDir.length);
        if (watchProcessDir.length == 0) {
            //全部结束了
            (function() {

                setTimeout(function() {
                    finalCallback(over, oldVersion, lastVersion);
                }, 1000)

            })();

            return true;
        } else {
            return false;
        }
    }

    var i = 0;

    function forDir(mpath) {
        var fi = fs.readdir(mpath, function(err, files) {
            // console.log(mpath);
            // console.log(files);
            if (err) {
                return false;
            }
            if (!files || files.length == 0) {
                judgeAllDone(mpath);
                return;
            }
            myMap(files, function(e, cb) {
                //console.log('file:'+e);
                var paths = path.join(mpath, e);

                //------------

                // 文件路径 console.log(paths); 
                var pathTmp = paths;
                var lastVersionFilePath = pathTmp;
                var oldVersionFilePath = pathTmp.replace(lastVersion, oldVersion);
                var tempFilePath = pathTmp.replace(/([\/\\])bundle([\/\\])/, '$1temp$2');

                var destFilePath = tempFilePath.replace(lastVersion, oldVersion + '-' + lastVersion); 


                //-------------


                fs.stat(paths, function(err, file) {

                    if (file.isDirectory()) {
                        //如果是目录那么将paths放入result，等待files遍历完了后，执行[2]
                        cb(null, paths)
                    } else {
                        //如果是文件，设置为空字符串
                        over.push(paths)
                        cb(null, '');
                        //移动到cb上面
                        //over.push(paths);

                        //-------------------
                        // console.log('file', lastVersionFilePath, lastVersionFilePath.indexOf('config.json'));

                        var lastContent = "";
                        var lastMd5 = crypto.createHash('md5');
                        var lastStream = fs.createReadStream(lastVersionFilePath);
                        lastStream.on('data', function(chunk) {
                            lastMd5.update(chunk);
                            lastContent += chunk;
                        });
                        lastStream.on('end', function() {

                            var lastVersionFileMD5 = lastMd5.digest('hex').toUpperCase();
                            fs.exists(oldVersionFilePath, function(exists) {
                                if (exists) {
                                    //存在 
                                    //?修改 ? 拷贝(图片js)： 不拷贝
                                    // - 图片、其它js文件
                                    var oldContent = "";
                                    var oldMd5 = crypto.createHash('md5');
                                    var oldStream = fs.createReadStream(oldVersionFilePath);
                                    oldStream.on('data', function(chunk) {
                                        oldMd5.update(chunk);
                                        oldContent += chunk;
                                    });
                                    oldStream.on('end', function() {
                                        oldVersionFileMD5 = oldMd5.digest('hex').toUpperCase();

                                        var ms = image(oldContent);
                                        if (lastVersionFileMD5 !== oldVersionFileMD5) {
                                            // js生成增量、图片拷贝
                                            // 类型
                                            // console.log('file', lastVersionFilePath, lastVersionFilePath.indexOf('config.json'),ms.mimeType);
                                            if (ms.mimeType) { /*图片*/
                                                copyFile(lastVersionFilePath, destFilePath);
                                            } else {
                                            	
                                                // config.json
                                                if (pathTmp.indexOf("config.json") !== -1) {
                                                    // config.json
                                                    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++");
                                                    console.log(oldVersion, '----------config.json--------');


                                                    
													
                                                    
                                                } else {
                                                    // bundle
                                                    var patches = dmp.patch_make(oldContent, lastContent);
                                                    // 生成增量文件
                                                    // console.log('########',destFilePath);

                                                    var patchJson = path.join(path.dirname(destFilePath), 'patch.json');
                                                    mkdirsSync(patchJson);
                                                    // 创建一个可以写入的流，写入到文件 output.txt 中
                                                    var writerStream = fs.createWriteStream(patchJson);

                                                    // 使用 utf8 编码写入数据
                                                    writerStream.write(JSON.stringify(patches), 'UTF8');

                                                    // 标记文件末尾
                                                    writerStream.end();
                                                }

                                            }

                                            // console.log(i++);

                                        } else {
                                            // 不变文件
                                            // console.log(i++,lastVersionFileMD5,oldVersionFileMD5);
                                        }
                                    });

                                } else {
                                    // console.log(i++);
                                    // 为新增 - 一定为图片
                                    copyFile(lastVersionFilePath, destFilePath);
                                }
                            });


                        });


                        //--------------------------

                    }
                });
            }, function(err, results) { //[2],进入子目录进行递归
                if (results.join('') != '') {
                    //去掉空字符串
                    results = results.filter(function(item) {
                        return !!item;
                    });
                    watchProcessDir = watchProcessDir.concat(results);
                    results.forEach(function(e, i) {
                        forDir(e);
                    });
                }

                judgeAllDone(mpath);

            })
        })
    }

    forDir(mpath);


}






function readVersion(rpath) {
    var all_version = [];
    files = fs.readdirSync(rpath); //需要用到同步读取
    files.forEach(walk);

    function walk(file) {
        states = fs.statSync(rpath + '/' + file);
        if (states.isDirectory()) {
            all_version.push(file);
        }
    }

    console.log(all_version);


    if (all_version.length <= 1)
        return;

    if(all_version.indexOf(targetVersion) !== -1){

    	console.log('可用');
    	// var last_version = 
    } else {
    	console.log('不可用');
    }

    // return;
    

    // for (var i = all_version.length - 1; i >= 0; i--) {
    	var last_version = all_version.pop();

    // 	if(last_version === targetVersion){
    // 		break;
    // 	}
    // }

    // if (all_version.length <= 0){
    // 	console.log('未找到');
    //     return;
    // }
    // var old_version = all_version.pop();
    // --读更新配置
    var PatchUpdateJson = "./patch/update.json";
    var updateJson=JSON.parse(fs.readFileSync(PatchUpdateJson));
	console.log(JSON.stringify(updateJson, null, 4));

	var configJson=JSON.parse(fs.readFileSync('./bundle/'+last_version+'/config.json'));
	console.log(JSON.stringify(configJson, null, 4));



	var adrbundleMd5 = crypto.createHash('md5');
    var adrStream = fs.createReadStream("./bundle/" + last_version + '/android/index.android.bundle');
    adrStream.on('data', function(chunk) {
        adrbundleMd5.update(chunk);
    });
    adrStream.on('end', function() {
        var adrVersionFileMD5 = adrbundleMd5.digest('hex').toUpperCase();


        var iosbundleMd5 = crypto.createHash('md5');
	    var iosStream = fs.createReadStream("./bundle/" + last_version + '/ios/index.ios.bundle');
	    iosStream.on('data', function(chunk) {
	        iosbundleMd5.update(chunk);
	    });
	    iosStream.on('end', function() {
	        var iosVersionFileMD5 = iosbundleMd5.digest('hex').toUpperCase();

	        configJson.iosBundleMd5 = iosVersionFileMD5;
	        configJson.androidBundleMd5 = adrVersionFileMD5;
	        // console.log(typeof(updateJson),updateJson instanceof Array);
			updateJson.push(configJson);

			fs.writeFile('./patch/update.json', JSON.stringify(updateJson, null, 4), function(err) {
			    if(err) {
			      console.log(err);
			    } else {
			      console.log("PatchUpdateJson saved");
			    }
			});

	    });

    });

	



	


    console.log(last_version, all_version);
    for (var k = 0, len = all_version.length; k < len; k++) {

        //循环对比version
        var old_version = all_version[k];
        //v1=current_version, v2= last_version;

        console.log('(((((',old_version, last_version);

        //===================

        if(1){

        getDir('./bundle/' + last_version, old_version, last_version, updateJson, function(over, oldVersion, lastVersion) {
            // console.log('~~~done~~~~file size：%d',over.length);

            console.log(oldVersion, lastVersion);


            var folder_exists = fs.existsSync("./temp/" + oldVersion + '-' + lastVersion);

            if (folder_exists == true) {

                console.log('-----------可以打包----------');

                var android_folder_exists = fs.existsSync("./temp/" + oldVersion + '-' + lastVersion + "/android");
                if (android_folder_exists === true) {

                    console.log('----------打包android.zip-----------');
                    mkdirsSync('./patch/' + lastVersion + '/android.zip');
                    var zipArchive = archiver('zip');
                    var androidOutput = fs.createWriteStream('./patch/' + lastVersion + '/' + oldVersion + '-' + lastVersion + '.android.zip');
                    zipArchive.pipe(androidOutput);
                    androidOutput.on('close', function() {
                        // shelljs.rm('-rf','./patch/'+lastVersion+'/android/');
                        // shelljs.mkdir('./patch/'+lastVersion+'/android/');
                        moveFile('./patch/' + lastVersion + '/' + oldVersion + '-' + lastVersion + '.android.zip', './patch/' + lastVersion + '/android/' + oldVersion + '-' + lastVersion + '.zip');

                    });
                    zipArchive.bulk([{
                        expand: true,
                        cwd: "./temp/" + oldVersion + '-' + lastVersion + "/android",
                        src: ['**/*']
                    }]);
                    zipArchive.finalize();

                }


                var ios_folder_exists = fs.existsSync("./temp/" + oldVersion + '-' + lastVersion + "/ios");
                if (ios_folder_exists === true) {

                    console.log('----------打包ios.zip-----------');
                    // mkdirsSync('./patch/'+lastVersion+'/ios.zip');
                    var ioszipArchive = archiver('zip');
                    var iosOutput = fs.createWriteStream('./patch/' + lastVersion + '/' + oldVersion + '-' + lastVersion + '.ios.zip');
                    ioszipArchive.pipe(iosOutput);
                    iosOutput.on('close', function() {
                        // shelljs.rm('-rf','./patch/'+lastVersion+'/ios/');
                        // shelljs.mkdir('./patch/'+lastVersion+'/ios/');
                        moveFile('./patch/' + lastVersion + '/' + oldVersion + '-' + lastVersion + '.ios.zip', './patch/' + lastVersion + '/ios/' + oldVersion + '-' + lastVersion + '.zip');

                    });
                    ioszipArchive.bulk([{
                        expand: true,
                        cwd: "./temp/" + oldVersion + '-' + lastVersion + "/ios",
                        src: ['**/*']
                    }]);
                    ioszipArchive.finalize();

                }

            } else {
                console.log('-----------没有更新打包----------');
            }
        });

    }
        //===================
    }


}

readVersion('./bundle');
