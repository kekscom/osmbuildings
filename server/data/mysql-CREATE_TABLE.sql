CREATE TABLE IF NOT EXISTS `buildings` (
  `height` int(3) DEFAULT NULL,
  `footprint` polygon NOT NULL,
  `region` varchar(255) NOT NULL,
  KEY `height` (`height`),
  SPATIAL KEY `footprint` (`footprint`),
  KEY `region` (`region`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
