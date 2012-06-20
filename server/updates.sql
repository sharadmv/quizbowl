DROP VIEW tournaments;
CREATE TABLE `tournament` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `year` int(11) unsigned NOT NULL,
  `tournament` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO tournament (year, tournament) (SELECT DISTINCT year,tournament FROM tossups);

CREATE TABLE `tossup` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `tournament` int(11) unsigned DEFAULT 0,
  `question` text,
  `answer` text,
  `round` varchar(200) DEFAULT NULL,
  `question_num` int(11) DEFAULT '0',
  `difficulty` varchar(200) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `question_2` (`question`,`answer`),
  FULLTEXT KEY `answer_2` (`answer`),
  FULLTEXT KEY `question_3` (`question`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


INSERT INTO tossup (question,answer,round,question_num,difficulty,category, tournament) (SELECT question, answer, round, question_num, difficulty, category,(SELECT id FROM tournament WHERE tournament.year=tossups.year AND tournament.name=tossups.tournament) FROM tossups);
