var Discord = require('discord.js');
var bot = new Discord.Client();
var scraw = require("scraw");

var configFile = "./config.json"
var config = require(configFile);
var botToken = config.botToken;

bot.login(botToken);
scraw.configure(Discord, bot);

console.log("Started!");

bot.on('voiceStateUpdate', function (oldMember, newMember) {
	if (newMember.voiceChannelID == null) { //disconnect
		var oldMemberChannelId = oldMember.voiceChannelID;
		var oldChannel = oldMember.guild.channels.find("id", oldMemberChannelId);
		console.log(oldChannel.members.array().length);
		if (oldChannel.members.array().length == 1) {
			var user = oldChannel.members.array()[0];
			if (user.user.username === "Marv") {
				var botCommandsChannel = oldMember.guild.channels.find("name", "bot-commands");
				console.log(botCommandsChannel);
				oldChannel.join().then(connection => {
					botCommandsChannel.send("-disconnect");
					botCommandsChannel.leave();
				});
			}
		}
	}
});

bot.on('message', function (message) {
	var isBotUser = message.author.bot;
	var commands = ["scraw", "play", "stop", "playlist"];

	if (!isBotUser) {
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
		var link = args[0];
		scraw.playSongFromLinkInChannel(message, link);
	} else if (command == "stop") {
		scraw.leaveVoiceChannel(message);
	} else if (command == "playlist") {
		switch (args[0]) {
			case "add":
				var link = args[1];
				scraw.playlistAdd(message, link);
				break;
			case "list":
				scraw.playlistList(message);
				break;
			case "play":
				scraw.playlistPlay(message);
				break;
			case "stop":
				scraw.playlistStop(message);
				break;
		}
	}
}
//end functions