CREATE TABLE IF NOT EXISTS `buildings` (
  `height` int(3) DEFAULT NULL,
  `footprint` polygon NOT NULL,
  `country` char(2) NOT NULL,
  `city` varchar(255) NOT NULL,
  KEY `height` (`height`),
  SPATIAL KEY `footprint` (`footprint`),
  KEY `country` (`country`),
  KEY `city` (`city`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
