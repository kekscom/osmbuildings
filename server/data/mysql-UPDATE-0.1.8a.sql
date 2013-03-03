ALTER TABLE `buildings` ADD `min_height` INT(3) DEFAULT NULL AFTER `height`;
ALTER TABLE `buildings` CHANGE `region` `region_id` INT(8) UNSIGNED NOT NULL;
ALTER TABLE `buildings` DROP KEY `height`;

CREATE TABLE IF NOT EXISTS `regions` (
  `id` int(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bbox` polygon NOT NULL,
  `num_buildings` INT(16) UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `date_created` datetime NOT NULL,
  `source` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `timezone` INT(4) NULL,
  PRIMARY KEY (`id`),
  KEY `bbox` (`bbox`(32))
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
