<?php
/*
 * @date 2013-11-18 10:15
 */
class Cache {

  private $path;
  private $size;

  public function __construct($config) {
    $this->path = $config["path"];
    $this->size = $config["size"];
  }

  private function createFileName($key) {
    return $this->path."/".md5($key).".json";
  }

  public function add($key, $value) {
    $fileName = $this->createFileName($key);
    $this->purge();
    return file_put_contents($fileName, $value);
  }

  public function get($key) {
    $fileName = $this->createFileName($key);
    return file_get_contents($fileName);
  }

  public function purge() {
		$sum = 0;
    $cache = array();
		$fp = opendir($this->path);
		if ($fp) {
			while ($item = readdir($fp)) {
        $fileName = $this->path."/$item";
				if (!is_file($fileName)) {
					continue;
				}
				$fileSize = filesize($fileName);
				$sum += $fileSize;
				$cache[ filemtime($fileName) ] = array("name"=>$fileName, "size"=>$fileSize);
			}
			closedir($fp);
		}

    ksort($cache);
    while($sum > $this->size) {
      $file = array_shift($cache);
      $sum -= $file["size"];
      unlink($file["name"]);
    }
  }

  public function clear() {
		$fp = opendir($this->path);
		if ($fp) {
			while ($item = readdir($fp)) {
        $fileName = $this->path."/$item";
				if (!is_file($fileName)) {
					continue;
				}
        unlink($fileName);
			}
			closedir($fp);
    }
  }
}
?>