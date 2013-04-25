ALTER TABLE `buildings`
  ADD `color` CHAR(8) NULL AFTER `min_height`,
  ADD `roof_color` CHAR(8) NULL AFTER `color`;
