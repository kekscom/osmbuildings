<?php

abstract class Source_Abstract
{
    protected $_link;
    protected $_collection;
    protected $_options = array();
    protected $_table;
    protected $_bbox;

    public function __construct(array $options = array())
    {
        $this->_options = $options;
        $this->init();
    }

    abstract public function init();

    public function setTable($table)
    {
        $this->_table = $table;
        return $this;
    }

    public function setBbox($l, $b, $r, $t)
    {
        $this->_bbox = polyToStr(
            $t, $l,
	    $t, $r,
            $b, $r,
            $b, $l,
            $t, $l
        );
        return $this;
    }

    abstract public function query();

    abstract public function count();

    abstract public function fetch();
}

