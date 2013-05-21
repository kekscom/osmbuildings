ALTER TABLE `buildings`
  ADD `color` VARCHAR(32) NULL AFTER `min_height`,
  ADD `roof_color` VARCHAR(32) NULL AFTER `color`;
