use mlt;

create table user_db(username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(50) NOT NULL, password VARCHAR(50) NOT NULL);
select * from user_db;