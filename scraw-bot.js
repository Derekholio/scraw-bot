var Discord = require('discord.js');
var bot = new Discord.Client();
var scraw = require("scraw");

var configFile = "./config.json"
var config = require(configFile);
var botToken = config.botToken;

bot.login(botToken);
scraw.configure(Discord);

console.log("Started!");

bot.on('message', function (message) {
	var isBotUser = message.author.bot;
	var commands = [ "scraw", "play", "stop" ];

	if(!isBotUser){
		var command = getCommand(message.content);
		if (command != null) {
			console.log("Command: " + command);
			if (commands.includes(command)) {
				var args = getCommandArgs("!" + command, message.content);
				console.log("Args: " + args);
				processCommand(command, args, message);
			}
		}
	}
});

//functions
function getCommand(messageContent) {
	var command_match = messageContent.toLowerCase().match(/^!(.*?)(\s|$)/);
	if (command_match != null) {
		command = command_match[1];
		return command;
	} else {
		return null;
	}
}

function getCommandArgs(command, messageContent) {
	var split = messageContent.split(' ');
	var args = [];
	split.forEach(function (element) {
		if (element !== command) {
			args.push(element);
		}
	});

	return args;
}

function processCommand(command, args, message) {
	if (command == "scraw") {
		scraw.replyWithScraw(message);
	} else if (command == "play") {
		scraw.playSongFromLinkInChannel(message);
	} else if (command = "stop") {
		scraw.leaveVoiceChannel();
	}
}
//end functions