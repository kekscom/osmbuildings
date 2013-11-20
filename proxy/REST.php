<?php
/*
 * @date 2013-11-18 10:15
 */
class REST {

  private $origin;
  private $age;
  private $cache;
  private $uid;

  private $statusCodes = array(
    400 => "Bad Request",
    401 => "Unauthorized",
    402 => "Payment Required",
    403 => "Forbidden",
    404 => "Not Found",
    405 => "Method Not Allowed",
    406 => "Not Acceptable",
    407 => "Proxy Authentication Required",
    408 => "Request Time-out",
    409 => "Conflict",
    410 => "Gone",
    411 => "Length Required",
    412 => "Precondition Failed",
    413 => "Request Entity Too Large",
    414 => "Request-URL Too Long",
    415 => "Unsupported Media Type",
    416 => "Requested range not satisfiable",
    417 => "Expectation Failed",
    420 => "Policy Not Fulfilled",
    421 => "There are too many connections from your internet address",
    422 => "Unprocessable Entity",
    423 => "Locked",
    424 => "Failed Dependency",
    425 => "Unordered Collection",
    426 => "Upgrade Required",
    429 => "Too Many Requests",
    500 => "Internal Server Error",
    501 => "Not Implemented",
    502 => "Bad Gateway",
    503 => "Service Unavailable",
    504 => "Gateway Time-out",
    505 => "HTTP Version not supported",
    506 => "Variant Also Negotiates",
    507 => "Insufficient Storage",
    509 => "Bandwidth Limit Exceeded",
    510 => "Not Extended"
  );

  public $resource;
  public $params;
  public $filter;

  public function __construct($config, $cache) {
    $this->origin = $config["origin"];
    $this->age    = $config["age"];
    $this->cache  = $cache;

    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
      $this->sendCorsHeaders();
      header("Access-Control-Allow-Methods: HEAD, GET, POST, PUT, DELETE, OPTIONS");
      header("Access-Control-Allow-Headers: X-Requested-With, Content-Type");
      exit;
    }

    $this->uid = md5($_SERVER["QUERY_STRING"]);
    $this->sendCacheHeaders();

    $queryParts = explode("&", $_SERVER["QUERY_STRING"]);

    $path = preg_replace("/\/$/", "", $queryParts[0]);
    $params = explode("/", $path);
    $this->resource = array_shift($params);
    if (!$this->resource) {
      $this->sendStatus(422);
    }

    $this->params = array();
    for ($i = 0; $i < count($params); $i+=2) {
      $this->params[ $params[$i] ] = $params[$i+1] ? $params[$i+1] : "";
    }

    unset($_REQUEST[$queryParts[0]]);
    $this->filter = $_REQUEST;

    $cached = $this->cache->get($this->uid);
    if ($cached) {
      $this->sendResponse(json_decode($cached));
    }
  }

  private function sendCorsHeaders() {
    header("Access-Control-Allow-Origin: ".$this->origin);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: ".$this->age);
  }

  private function sendCacheHeaders() {
    header("Pragma: cache");
    header("Cache-Control: max-age=".$this->age);
    header("Expires: ".gmdate("D, d M Y H:i:s", time()+$this->age)." GMT");

    $lastModified = time()-$this->age;
    header("Last-Modified: ".gmdate("D, d M Y H:i:s", $lastModified)." GMT");

    $headers = getallheaders();

    if (@strtotime($headers["If-Modified-Since"]) == $lastModified) {
      header("HTTP/1.1 304 Not Modified");
      exit;
    }

    if (@$headers["If-None-Match"] == $this->uid) {
      header("HTTP/1.1 304 Not Modified");
      exit;
    }

    header("Etag: ".$this->uid);
  }

  public function sendResponse($res = NULL) {
    $res = $this->cleanupJson($res);

    $this->sendCorsHeaders();

    if (!$res) {
      header("HTTP/1.0 204 No Content");
      exit;
    }

    $json = json_encode($res);
    $this->cache->add($this->uid, $json);

    header("Content-Type: application/json; charset=utf-8");
    $this->compressResponse($json);
  }

  public function sendStatus($code = 500, $message = NULL) {
    header("HTTP/1.0 ".$this->statusCodes[$code] ? "$code ".$this->statusCodes[$code] : "500 ".$this->statusCodes[500]);
    if ($message) {
      echo $message;
    }
    exit;
  }

  /**
   * remove empty properties from a data object
   * purpose is to keep JSON data as small as possible
   * note: removing an empty associative property is different from removing a numeric one

      array("A", "B", "C")                --> ["A","B","C"]
      array(0=>"A", 1=>"B", 2=>"C")       --> ["A","B","C"]
      array("0"=>"A", "1"=>"B", "2"=>"C") --> ["A","B","C"]
      array("A", "", "C")                 --> {"0":"A","2":"C"}
      array(0=>"A", 1=>"", 2=>"C")        --> {"0":"A","2":"C"}
      array("0"=>"A", "1"=>"", "2"=>"C")  --> {"0":"A","2":"C"}
      array("a"=>"A", "b"=>"B", "c"=>"C") --> {"a":"A","b":"B","c":"C"}
      array("a"=>"A", "b"=>"", "c"=>"C")  --> {"a":"A","c":"C"}

   * @param array obj the data structure to clean up
   * @return array the cleaned data structure
   */
  public function cleanupJson($obj) {
    if (!is_array($obj) && !is_object($obj)) return $obj; // investigates arrays and objects only, returns everything else
    if (!$obj) return NULL; // applies to arrays and objects only

    // associative array
    if (is_object($obj) || array_diff_key($obj, array_keys(array_keys($obj)))) {
      $res = array();
      foreach ($obj as $k=>$v) {
        $v = $this->cleanupJson($v);
//      if ($v !== "" && $v !== NULL && $v !== FALSE) {
        if ($v !== "" && $v !== NULL) {
          $res[$k] = $v;
        }
      }
      return $res;
    }

    $res = array();
    for ($i = 0; $i < count($obj); $i++) {
      $res[$i] = $this->cleanupJson($obj[$i]);
    }

    return $res;
  }

  private function compressResponse($str) {
		preg_match("~(x-)?gzip~i", $_SERVER["HTTP_ACCEPT_ENCODING"], $match);
		$acceptedCompression = $match[0];

		if (!$acceptedCompression || !function_exists("gzcompress") || $_SERVER["HTTP_X_FORWARDED_FOR"]) {
			echo $str;
			exit;
		}

		header("Content-Encoding: $acceptedCompression");
		$size = strlen($str);
		$crc  = crc32($str);
		$compressedStr = gzcompress($str, 3);
		$compressedStr = substr($compressedStr, 0, strlen($compressedStr)-4);
		echo "\x1f\x8b\x08\x00\x00\x00\x00\x00".$compressedStr.pack("V", $crc).pack("V", $size);
		exit;
	}
}
?>