DROP VIEW tournaments;
CREATE TABLE `tournament` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `year` int(11) unsigned NOT NULL,
  `tournament` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO tournament (year, tournament) (SELECT DISTINCT year,tournament FROM tossups);

CREATE TABLE `tossup_temp` (
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

CREATE TABLE `tossup` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `tournament` int(11) unsigned DEFAULT 0,
  `question` text,
  `answer` text,
  `round` int(11) unsigned default 0,
  `question_num` int(11) DEFAULT '0',
  `difficulty` varchar(200) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `question_2` (`question`,`answer`),
  FULLTEXT KEY `answer_2` (`answer`),
  FULLTEXT KEY `question_3` (`question`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


INSERT INTO tossup_temp (question,answer,round,question_num,difficulty,category, tournament) (SELECT question, answer, round, question_num, difficulty, category,(SELECT id FROM tournament WHERE tournament.year=tossups.year AND tournament.name=tossups.tournament) FROM tossups);

CREATE TABLE `round` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `round` varchar(200) DEFAULT NULL,
  `tournament` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO round (round, tournament) (SELECT DISTINCT round, tournament FROM tossup);

INSERT INTO tossup (question,answer,round,question_num,difficulty,category, tournament) (SELECT question, answer, (SELECT round.id from round WHERE tossup_temp.round=round.round AND tossup_temp.tournament=round.tournament), question_num, difficulty, category,tournament FROM tossup_temp);

DROP TABLE tossup_temp;
