const express = require("express");
const path = require("path");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json())
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (DbObject) => {
  return {
    playerId: DbObject.player_id,
    playerName: DbObject.player_name,
  };
};
const convertMatchDetailsObjectToResponseObject = (DbObject) => {
  return {
    matchId: DbObject.match_id,
    match: DbObject.match,
    year: DbObject.year,
  };
};

//Returns a list of all the players in the player table

app.get("/players/", async (Request, response) => {
  const getAllPlayersQuery = `SELECT * 
    FROM player_details`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * 
    FROM player_details WHERE player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = 
  `UPDATE 
  player_details
    SET 
    player_name = '${playerName}'
    WHERE
     player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `SELECT * 
    FROM match_details
    WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertMatchDetailsObjectToResponseObject(matchDetails));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT *
     FROM player_match_score
     NATURAL JOIN match_details
     WHERE player_id = ${playerId};`;

  const playerMatches = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsObjectToResponseObject(eachMatch)
    )
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `SELECT  * 
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `SELECT 

  player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes

    FROM player_match_score
    NATURAL JOIN player_details 
    WHERE player_id = ${playerId};`;
  const playerMatchesDetails = await db.get(getPlayerMatchesQuery);
  response.send(playerMatchesDetails);
});

module.exports = app;
