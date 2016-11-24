<?php
header("Content-Type:text/html;charset=utf8");
// header('Access-Control-Allow-Origin', '*');
header("Access-Control-Allow-Origin: *");

$method =$_SERVER['REQUEST_METHOD'];



// 返回json各项说明

// status : 本次请求后台是否发生了错误
// msg : 给用户看的中文提示信息，静默升级时候没什么用
// latestBundleV : 当前的最新bundle版本
// latestAppMinV : 最新bundle要求的app最低版本
// canUpdate : 能否升级，boolean
// canUpdateBundleV : 能升级的bundle版本
// canUpdateAppMinV : 能升级的bundle要求的app最低版本
// patchUrl : 补丁包相对地址
// platform : 平台：ios or android

switch ($method) {
	case 'GET':
		# code...
		// var_dump($_GET);
		break;
	
	default:
		# code...
		echo array('code' => 1, 'msg' => '请使用GET方法请求数据');
		break;
}


function getUpdateJson(){
	$filename = "../update.json";
	$json_string = file_get_contents($filename);
	// echo "<pre>";
	// echo print_r($json_string,true);            //打印文件的内容
	// echo "</pre>";
	$obj=json_decode($json_string,true);
	if (!is_array($obj)) die('no successful');
	// echo "<pre>";
	// print_r($obj);
	// echo "</pre>";

	return array_pop($obj);
}


$lastVersion = getUpdateJson();

// var_dump($lastVersion);

$query = $_GET;

// var_dump($query);


// 接收数据各项说明

// bundleV : app中的bundle版本
// appV : app版本
// platform : app的平台

if($query['appV'] !== $lastVersion['min-v']) {
	// app更新
	//-------要取对应app版本信息

	echo json_encode(array(
	   'status' => 'success',
	   'msg' => '可以升级，但app版本' . $lastVersion['min-v'] . '太低，只能升到bundleV' . $lastVersion['v'] . '，bundleV最新为' . $lastVersion['v'],
	   'latestBundleV' => $lastVersion['v'],
	   'latestAppMinV' => $lastVersion['min-v'],
	   'canUpdate' => true,
	   'canUpdateBundleV' => $lastVersion['v'],
	   'canUpdateAppMinV' => $lastVersion['min-v'],
	   'patchUrl' => 'patch/' . $lastVersion['v'] . '/'.$query['platform'].'/'.$query['bundleV'].'-' .$lastVersion['v'].'.zip',
	   'platform' => $query['platform']
	));
	
} else if($query['bundleV'] !== $lastVersion['v']) {
	// app版本一致，bundle更新

	echo json_encode(array(
	   'status' => 'success',
	   'msg' => '可以升级，bundleV最新为' . $lastVersion['v'],
	   'latestBundleV' => $lastVersion['v'],
	   'latestAppMinV' => $lastVersion['min-v'],
	   'canUpdate' => true,
	   'canUpdateBundleV' => $lastVersion['v'],
	   'canUpdateAppMinV' => $lastVersion['min-v'],
	   'patchUrl' => 'patch/' . $lastVersion['v'] . '/'.$query['platform'].'/'.$query['bundleV'].'-' .$lastVersion['v'].'.zip',
	   'platform' => $query['platform']
	));

	
} else {
	// 已是最新

	echo json_encode(array(
	   'status' => 'success',
	   'msg' => '无需升级，已经是最新版本',
	   'canUpdate' => false,
	   'platform' => 'ios'
	));

}


?>