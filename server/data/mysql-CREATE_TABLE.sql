CREATE TABLE IF NOT EXISTS `buildings` (
  `height` int(3) DEFAULT NULL,
  `min_height` INT(3) DEFAULT NULL,
  `footprint` POLYGON NOT NULL,
  `region_id` INT(8) UNSIGNED NOT NULL,
  `deleted` TINYINT(1) UNSIGNED NULL,
  SPATIAL KEY `footprint` (`footprint`),
  KEY `region` (`region_id`),
  KEY `deleted` (`deleted`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `regions` (
  `id` int(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bbox` polygon NOT NULL,
  `num_buildings` INT(16) UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `date_created` DATE NOT NULL,
  PRIMARY KEY (`id`),
  SPATIAL KEY `bbox` (`bbox`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
