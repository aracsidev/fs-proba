# Project overview
ExpressJS / MySQL backend sends data through the API in "./server/api/"

SolidJS front-end uses the built-in API to query the db

# Install

Navigate to client directory then run:
`npm i`

Navigate to server directory then run:
`npm i`

# Initial

> Install mysql and set up a user

> modify .env

.env example:
`SQL_HOST     = 127.0.0.1`
`SQL_USER     = usern`
`SQL_PASSWORD = passw`
`SQL_DATABASE = rickandmorty`
`PORT         = 3000`

Then in the server directory run:

`npm run init`

# Run

Dev server:
`npm run start`

Node:
`npm run serve`

To update the frontend (not necessary) run:
`npm run build`

in the client directory (builds and copies files to server)
