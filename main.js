const axios = require('axios');
const Discord = require('discord.js');

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

const getFee = async url => {
  try {
    return axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended', { responseType: 'json', timeout: 10000 });
  } catch(e) {
    console.log(e);
  }
}

/**
 * Connect to Discord
 */
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!\nIf this is your first time connecting, use https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=67176464&scope=bot to authorize your bot for your server.`);
  updateTopic();
  // Poll the servers every X seconds
  client.setInterval(updateTopic, options.pollRate * 1000);
});

/**
 * Update the topic
 */
const updateTopic = async () => {
  
  const prices = [];

  // Fetch every pair
  let pairs = await getPairs(`${options.api}?api_key=${options.apiKey}&fsyms=${options.pairs.join(',')}&tsyms=EUR&e=kraken`);
  for (const key in pairs.data.RAW) {
    let coin = pairs.data.RAW[key].EUR;
    let symbol = '';
    let triangle = '▼';
    if (coin.CHANGE24HOUR > 0) {
      symbol = '+';
      triangle = '▲';
    }
    prices.push(`${coin.FROMSYMBOL}: ${coin.PRICE} (${symbol}${+(coin.CHANGEPCT24HOUR).toFixed(2)}% ${triangle})`);
  }
  
  let fees = await getFee();
  let satPerByte = fees.data.hourFee;
  let feeInEuros = (satPerByte * 226) / 100000000 * pairs.data.RAW.BTC.EUR.PRICE;

  const topic = prices.join(' | ') + ` | 1h fee: ${satPerByte} sat/byte (~ ${feeInEuros.toFixed(2)} eur/tx)`;
  // Set topics for set channels
  for (const channel of options.topicChannels){
    try {
      await client.channels.find('name', channel).setTopic(topic);
    } catch(error){
      console.log(error);
    }
  }
}

// Log in
client.login(options.token);
