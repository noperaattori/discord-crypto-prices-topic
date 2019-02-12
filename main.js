const axios = require('axios');
const Discord = require('discord.js');
// const _ = require('lodash');

// Check if the config exists
try {
  var options = require('./config/config').options;
} catch(error) {
  console.log('\x1b[41m%s\x1b[0m', '\nMake sure you copy/rename config.js.example to config.js!\n');
}

// Create Discord client instance
const client = new Discord.Client();

/**
 * Get the price information from API
 */
const getPairs = async url => {
  try {
    return axios.get(`${url}`, { responseType: 'json', timeout: 10000 });
  } catch(e) {
    console.log(e);
  }
};

/**
 * Connect to Discord
 */
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!\nIf this is your first time connecting, use https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=67176464&scope=bot to authorize your bot for your server.`);
});

/**
 * Poll the servers every X seconds
 */
client.setInterval(async () => {
  
  const prices = [];
  for (const pair of options.pairs) {
    let players = await getPairs(`${options.api}${pair.pair}`);
    let price = Number(players.data.result[Object.keys(players.data.result)[0]].c[0]);
    prices.push(`${pair.realName}: ${price.toFixed(3)}`);
  };
  const topic = prices.join(' | ');
  console.log(topic);  
  
  // Set topics for set channels
  for (const channel of options.topicChannels){
    try {
      client.channels.find('name', channel).setTopic(topic);
    } catch(error){
      console.log(error);
    }
  }
}, options.pollRate * 1000);

// Log in
client.login(options.token);
