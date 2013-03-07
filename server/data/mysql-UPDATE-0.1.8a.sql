ALTER TABLE `buildings`
    CHANGE `region` `region_id` INT(8) UNSIGNED NOT NULL,
    ADD `min_height` INT(3) DEFAULT NULL AFTER `height`,
    ADD `deleted` TINYINT(1) UNSIGNED NULL,
    DROP KEY `height`,
    ADD INDEX (`deleted`);

CREATE TABLE IF NOT EXISTS `regions` (
  `id` int(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bbox` polygon NOT NULL,
  `num_buildings` INT(16) UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `date_created` DATE NOT NULL,
  PRIMARY KEY (`id`),
  SPATIAL KEY `bbox` (`bbox`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
