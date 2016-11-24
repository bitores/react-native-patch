# react-native-patch


[增量升级方案](https://segmentfault.com/a/1190000004352162)
[实现增量热更新的思路](http://www.cnblogs.com/liubei/p/RNUpdate.html)

###完成以下步骤

+ 生成 bundle 升级包

+ 生成 patch增量 升级包

+ app端 请求，是否升级、加载增量包、解压



####生成 bundle 升级包

	react-native bundle --entry-file index.android.js --bundle-output ./bundle/index.android.bundle --platform android --assets-dest ./bundle --dev false


#### App 端处理

	var FileTransfer = require('@remobile/react-native-file-transfer');
	var Zip = require('@remobile/react-native-zip');
	var RNFS = require('react-native-fs');

	componentWillMount() {
	    function unzipJSZipFile(zipPath){
	        if(zipPath){
	            // Alert.alert('ss',zipPath);
	        //  // zipPath：zip的路径
	        //  // documentPath：解压到的目录
	            // var zipPath = "file:///sdcard/data/0.2.0-1.0.0.zip";
	            var documentPath = "file:///sdcard/data/";
	            Zip.unzip(zipPath, documentPath, (err)=>{
	        //      // Alert.alert('error',JSON.stringify(err));
	                if (err) {
	        //        // 解压失败
	        //        Alert.alert('er',JSON.stringify(err));
	                } else {
	                    // Alert.alert('suc',JSON.stringify(err));
	        //        // 解压成功，将zip删除
	                  RNFS.unlink(zipPath).then(() => {
	                    // 通过解压得到的补丁文件生成最新版的jsBundle
	                  });
	                }
	            });
	        } else {
	            Alert.alert('res',res);
	        }
	        
	    }
	    if (Platform.OS === 'android') {
	        BackAndroid.addEventListener('hardwareBackPress', this._onBackAndroid);
	    }

	    let fileTransfer = new FileTransfer();
	    fileTransfer.onprogress = (progress) => {
	      // console.log(parseInt(progress.loaded * 100 / progress.total))
	      ToastAndroid.show(""+progress.loaded,ToastAndroid.SHORT);
	      Alert.alert('progress', ""+progress.loaded);
	      // Alert.alert();
	    };
	    // url：新版本bundle的zip的url地址
	    // bundlePath：存新版本bundle的路径
	    // unzipJSZipFile：下载完成后执行的回调方法，这里是解压缩zip
	    var url = 'http://192.168.10.33/patch/1.0.0/android/0.2.0-1.0.0.zip';
	    var bundlePath = 'file:///sdcard/data/0.2.0-1.0.0.zip';
	    // var unzipJSZipFile = this.;
	    fileTransfer.download(url, bundlePath, unzipJSZipFile, (err) => {
	        console.log(err);
	        Alert.alert('fil ',JSON.stringify(err));
	      }, true
	    );

	    // ToastAndroid.show("hello, ni hao",ToastAndroid.SHORT);

	}




	#### 其它说明

	bundle   存放全量bundle和全量assets的目录,里面的文件基本上是使用react-native bundle命令生成的
	    0.1.0
	        略
	    0.2.0
	        android
	            略，同ios
	        ios
	            config.json    此版本的配置信息，包含要求app的最低版本等，手动配置
	            index.jsbundle    全量jsbundle文件，使用react-native bundle命令生成
	            assets    全量图片目录，使用react-native bundle命令生成
	    0.3.0
	        略
        
	patch   存放增量补丁的目录，里面文件都是命令生成的，无需手动维护    
	    0.1.0
	        第一版本无文件
	    0.2.0
	        android
	                略，同ios
	        ios
	            0.1.0-0.2.0.zip    增量包.zip
	    0.3.0
	        android
	                略，同ios
	        ios
	            0.1.0-0.3.0.zip    增量包.zip
	            0.2.0-0.3.0.zip    增量包.zip
	    update.json    所有的升级包信息
	src    存放打包用的源码
	lib    存放打包用依赖的第三方的源码
	patch.js    patch命令入口
	update.json.js    update.json命令入口


	│  patch.js
	│  README.md
	│
	│
	├─bundle
	│  ├─0.1.0
	│  │  │  config.json
	│  │  │
	│  │  ├─android
	│  │  │  │  index.android.bundle
	│  │  │  │  index.android.bundle.meta
	│  │  │  │
	│  │  │  ├─drawable-hdpi
	│  │  │  │      node_modules_.png
	│  │  │  │
	│  │  │  ├─drawable-mdpi
	│  │  │  │      app_images_allcars.png
	│  │  │  │      app_images_authentication4s.png
	│  │  │  │      app_images_authenticationresources.png
	│  │  │  │
	│  │  │  ├─drawable-xhdpi
	│  │  │  │      app_images_delete_histary.png
	│  │  │  │      app_images_search_home.png
	│  │  │  │      node_modules_.png
	│  │  │  │
	│  │  │  ├─drawable-xxhdpi
	│  │  │  │      app_images_delete_histary.png
	│  │  │  │      app_images_delete_search.png
	│  │  │
	│  │  └─ios
	│  │      │  index.ios.bundle
	│  │      │  index.ios.bundle.meta
	│  │      │
	│  │      └─assets
	│  │          ├─app
	│  │          │  └─images
	│  │          │          filter-price-defalt.png
	│  │          │          filter-price-sel.png
	│  │          │          filter-selecte.png
	│  │          │          tab-user-on.png
	│  │          │          tab-user.png
	│  │          │
	│  │
	│  ├─0.2.0
	│  │  │  config.json
	│  │  │
	│  │  ├─android
	│  │  │  │  index.android.bundle
	│  │  │  │  index.android.bundle.meta
	│  │  │  │
	│  │  │  ├─drawable-hdpi
	│  │  │  │      node_modules_.png
	│  │  │  │
	│  │  │  ├─drawable-mdpi
	│  │  │  │      app_images_allcars.png
	│  │  │  │      app_images_authentication4s.png
	│  │  │  │      app_images_authenticationresources.png
	│  │  │  │      app_images_tabuser.png
	│  │  │  │      app_images_tabuseron.png
	│  │  │  │      node_modules_.png
	│  │  │  │
	│  │  │  ├─drawable-xhdpi
	│  │  │  │      app_images_delete_histary.png
	│  │  │  │      app_images_delete_search.png
	│  │  │  │
	│  │  │  ├─drawable-xxhdpi
	│  │  │  │      app_images_delete_histary.png
	│  │  │  │      app_images_delete_search.png
	│  │  │  │
	│  │  │  └─drawable-xxxhdpi
	│  │  │          node_modules_.png
	│  │  │
	│  │  └─ios
	│  │      │  index.ios.bundle
	│  │      │  index.ios.bundle.meta
	│  │      │
	│  │      └─assets
	│  │          ├─app
	│  │          │  └─images
	│  │          │          allcars.png
	│  │          │          authentication-4s.png
	│  │          │          authentication-resources.png
	│  │          │          authentication-show.png
	│  │          │          tab-user.png
	│  │          │
	│  │
	│  │
	│  └─1.0.0
	│      │  config.json
	│      │
	│      ├─android
	│      │  │  index.android.bundle
	│      │  │  index.android.bundle.meta
	│      │  │
	│      │  ├─drawable-hdpi
	│      │  │      node_modules_.png
	│      │  │
	│      │  ├─drawable-mdpi
	│      │  │      app_images_allcars.png
	│      │  │      app_images_authentication4s.png
	│      │  │      app_images_authenticationresources.png
	│      │  │
	│      │  ├─drawable-xhdpi
	│      │  │      app_images_delete_histary.png
	│      │  │      app_images_delete_search.png
	│      │  │
	│      │  ├─drawable-xxhdpi
	│      │  │      app_images_delete_histary.png
	│      │  │      app_images_delete_search.png
	│      │  │
	│      │  └─drawable-xxxhdpi
	│      │          node_modules_.png
	│      │
	│      └─ios
	│          │  index.ios.bundle
	│          │  index.ios.bundle.meta
	│          │
	│          └─assets
	│              ├─app
	│              │  └─images
	│              │          allcars.png
	│              │          authentication-4s.png
	│              │          authentication-resources.png
	├─lib
	│      diff_match_patch.js
	│      diff_match_patch_test.html
	│      diff_match_patch_test.js
	│      diff_match_patch_uncompressed.js
	│
	└─patch
	    │  update.json
	    │
	    ├─1.0.0
	    │  ├─android
	    │  │      0.1.0-1.0.0.zip
	    │  │      0.2.0-1.0.0.zip
	    │  │
	    │  └─ios
	    │          0.1.0-1.0.0.zip
	    │
	    └─query
	            index.js
	            index.php


