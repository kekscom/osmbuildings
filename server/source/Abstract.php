<?php

abstract class Source_Abstract
{
    protected $_link;
    protected $_collection;
    protected $_options = array();
    protected $_table;
    private static $validSources = array("Mysql", "Mapnik");

    public function __construct(array $options = array())
    {
        $this->_options = $options;
        $this->init();
    }

    public static function create($dbConfig) {
        if (!in_array($dbConfig['source'], self::$validSources)) {
            // TODO: throw proper exception
            return FALSE;
        }

        require_once dirname(__FILE__) . '/'. $dbConfig['source'] . '.php';

        $className = 'Source_' . $dbConfig['source'];
        return new $className($dbConfig);
    }

    abstract public function init();

    abstract public function query($bbox);

    abstract public function count();

    abstract public function fetch();
}
