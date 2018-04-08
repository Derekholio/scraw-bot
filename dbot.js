var fs = require('fs');
var ytdl = require('ytdl-core');
var Discord = require('discord.js');
var bot = new Discord.Client();
var isReady = true;

console.log("Started!");

var configFile = "./config.json"

var config = require(configFile);
var botToken = config.botToken;

console.log(botToken);

bot.on('message', function(message) {
	var isUserBot = message.author.bot;
	var voiceChannel = message.member.voiceChannel;
	var commands = ["!scraw", "!play", "!stop"];

	if(!isUserBot && isReady && voiceChannel == null){
		let warning = false;
		commands.forEach(function(element){
			if(!warning && message.content.startsWith(element)){
				warning = true;
			}
		});
		if(warning){
			message.reply("You must be in voice chat to use scraw-bot!");
		}
	}else{
		processVoiceChat(message);
	}
});

bot.login(botToken);

//functions
function processVoiceChat(message){
	var voiceChannel = message.member.voiceChannel;

	if (isReady && message.content.toLowerCase() === '!scraw') {
        isReady = false;
			message.channel.send("SCRAW!");
			voiceChannel.join().then(connection => {
				var path = "./scraws";
				fs.readdir(path, function(err, items){
					var count = items.length;
					var number = Math.floor(Math.random() * count);
					var fileToPlay = items[number];
					const dispatcher = connection.playFile(path + "/" + fileToPlay);
					dispatcher.on("end", end => {
						voiceChannel.leave();
						isReady = true;
					});
				});
				
			}).catch(err => console.log(err));		
    }
	
	if (isReady && message.content.toLowerCase().startsWith("!play")){
		isReady = false;
		var link = message.content.split(' ')[1];
		voiceChannel.join().then(connection => {
			const dispatcher = connection.playStream(ytdl(link, {filter: "audioonly"}));
			dispatcher.on("end", end => {
				voiceChannel.leave();
				isReady = true;
			});
		});
	}
	
	if (message.content.toLowerCase().startsWith("!stop")){
		console.log("stopping");
		voiceChannel.leave();
		isReady = true;
	}
}
//end functions