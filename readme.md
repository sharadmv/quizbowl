Quizbowl DB 
================

Quizbowl DB is an online framework that provides quizbowlers (see ["www.naqt.com"]("NAQT")) with an easy way to learn, practice, and play with others.

Features
----------
* **Search** - a search interface that allows users to find questions in the database. Users can filter based on such parameters as difficulty and category. It can also retrieve randomized results
* **Reader** - a game-like interface, inspired by the UMD Quizbowl Tester. It displays questions word by word at specified speed, and users can then buzz in on questions and answer when they know it. The framework does some smart answer analysis to determine if the answer is correct, and notifies the user
* **Multiplayer** - the newest feature, it allows users to play against each other in the style of the reader. The frameworks allows users to create rooms with certain specifications, join rooms, and play in a realistic quizbowl game, with score tracking and with arbitrary team size specifications

Technology
---------
At the top, Quizbowl DB operates with a MySQL database, with a Solr indexing for full-text search. The core framework is written in node.js, with Expressjs for routing. The framework serves up a REST API that allow access to the 3 features. For the multiplayer game, the realtime communication and server events are handled with ["www.getbridge.com"]("Bridge"). Also implemented is a web interface, also completely in javascript. It uses the REST API and Bridge to interface with the server. It also utilizes ["www.backbonejs.org"]("BackboneJS"), jQuery, some minimal Bootstrap, qTip, and Mustache for templating.

API
--------
To be written...
