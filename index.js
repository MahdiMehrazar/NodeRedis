const express = require("express");
const axios = require("axios");
const redis = require("redis");
const app = express();

const redisPort = 6379
const client = redis.createClient(redisPort);

client.on("error", (err) => {
    console.log(err);
})

client.connect();

client.on('connect', (msg) => {
  console.log('connected to redis server');
})

app.get("/users", (req, res) => {
    const searchTerm = req.query.search;
    try {
        client.get(searchTerm, async (err, users) => {
            if (err) throw err;
    
            if (users) {
                res.status(200).send({
                  users: JSON.parse(users),
                    message: "data retrieved from the cache"
                });
            }
            else {
                const users = await axios.get(`https://reqres.in/api/users/${searchTerm}`);
                client.setex(searchTerm, 600, JSON.stringify(users));
                res.status(200).send({
                    users,
                    message: "cache miss"
                });
            }
        });
    } catch(err) {
        res.status(500).send({message: err.message});
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Node server started");
});