

// var spawn = require('child_process').spawn, 
// free = spawn('free', ['-m']); 

// // 捕获标准输出并将其打印到控制台 
// free.stdout.on('data', function (data) { 
// console.log('标准输出：\n' + data); 
// }); 

// // 捕获标准错误输出并将其打印到控制台 
// free.stderr.on('data', function (data) { 
// console.log('标准错误输出：\n' + data); 
// }); 

// // 注册子进程关闭事件 
// free.on('exit', function (code, signal) { 
// console.log('子进程已退出，代码：' + code); 
// }); 


var exec = require('child_process').exec, 
android_proc = exec('react-native bundle --entry-file index.android.js --bundle-output ./bundle/android/index.android.bundle --platform android --assets-dest ./bundle/android --dev false'); 
ios_proc = exec('react-native bundle --entry-file index.ios.js --bundle-output ./bundle/ios/index.ios.bundle --platform ios --assets-dest ./bundle/ios --dev false');


// 捕获标准输出并将其打印到控制台 
android_proc.stdout.on('data', function (data) { 
console.log('标准输出：\n' + data); 
}); 

// 捕获标准错误输出并将其打印到控制台 
android_proc.stderr.on('data', function (data) { 
console.log('标准错误输出：\n' + data); 
}); 

// 注册子进程关闭事件 
android_proc.on('exit', function (code, signal) { 
console.log('子进程已退出，代码：' + code); 
}); 


// 捕获标准输出并将其打印到控制台 
ios_proc.stdout.on('data', function (data) { 
console.log('标准输出：\n' + data); 
}); 

// 捕获标准错误输出并将其打印到控制台 
ios_proc.stderr.on('data', function (data) { 
console.log('标准错误输出：\n' + data); 
}); 

// 注册子进程关闭事件 
ios_proc.on('exit', function (code, signal) { 
console.log('子进程已退出，代码：' + code); 
}); 
