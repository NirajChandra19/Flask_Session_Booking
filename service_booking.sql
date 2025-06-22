-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema service_booking
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `service_booking` ;

-- -----------------------------------------------------
-- Schema service_booking
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `service_booking` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `service_booking` ;

-- -----------------------------------------------------
-- Table `service_booking`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_booking`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(100) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `password` VARCHAR(255) NULL DEFAULT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `contact` VARCHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `email` ON `service_booking`.`users` (`email` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `service_booking`.`workers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_booking`.`workers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  `name` VARCHAR(100) NULL DEFAULT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL DEFAULT '500.00',
  `available_from` TIME NULL DEFAULT NULL,
  `available_to` TIME NULL DEFAULT NULL,
  `about` TEXT NULL DEFAULT NULL,
  `contact` VARCHAR(20) NULL DEFAULT NULL,
  `status` ENUM('available', 'not available') NULL DEFAULT 'available',
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `email` ON `service_booking`.`workers` (`email` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `service_booking`.`bookings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_booking`.`bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `worker_id` INT NOT NULL,
  `service` VARCHAR(100) NULL DEFAULT NULL,
  `date` DATE NULL DEFAULT NULL,
  `time` TIME NULL DEFAULT NULL,
  `contact` VARCHAR(100) NULL DEFAULT NULL,
  `status` VARCHAR(50) NULL DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  CONSTRAINT `bookings_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `service_booking`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2`
    FOREIGN KEY (`worker_id`)
    REFERENCES `service_booking`.`workers` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `user_id` ON `service_booking`.`bookings` (`user_id` ASC) VISIBLE;

CREATE INDEX `worker_id` ON `service_booking`.`bookings` (`worker_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `service_booking`.`departments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_booking`.`departments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `name` ON `service_booking`.`departments` (`name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `service_booking`.`worker_departments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_booking`.`worker_departments` (
  `worker_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  PRIMARY KEY (`worker_id`, `department_id`),
  CONSTRAINT `worker_departments_ibfk_1`
    FOREIGN KEY (`worker_id`)
    REFERENCES `service_booking`.`workers` (`id`),
  CONSTRAINT `worker_departments_ibfk_2`
    FOREIGN KEY (`department_id`)
    REFERENCES `service_booking`.`departments` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `department_id` ON `service_booking`.`worker_departments` (`department_id` ASC) VISIBLE;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
