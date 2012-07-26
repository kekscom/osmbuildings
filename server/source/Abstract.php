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

    public function setBbox($n, $w, $s, $e)
    {
        if (preg_match('/^lat/i', $this->_options['coords'])) {
            $this->_bbox = array($n, $w, $s, $e);
        } else {
            $this->_bbox = array($w, $n, $e, $s);
        }
        return $this;
    }

    abstract public function query();

    abstract public function count();

    abstract public function fetch();
}

