ALTER TABLE `buildings` ADD `min_height` int(3) DEFAULT NULL AFTER `height`;
ALTER TABLE `buildings` CHANGE region region_id int(8) UNSIGNED NOT NULL;

CREATE TABLE IF NOT EXISTS `regions` (
  `id` int(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `bbox` polygon NOT NULL,
  `buildings` int(16) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bbox` (`bbox`(32))
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
