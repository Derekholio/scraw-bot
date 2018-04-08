var fs = require('fs');
var ytdl = require('ytdl-core');

class Scraw {
    configure(Discord) {
        this._discord = Discord;
        console.log("SCRAW configured");
        this._ready = true;
    }

    replyToMessage(message, content) {
        message.channel.send(content);
    }

    replyToMessageWithAt(message, content) {
        message.reply(content);
    }

    replyWithScraw(message) {
        if (this._ready) {
            this._setReady(false);
            this.replyToMessage(message, "SCRAW!");
            var voiceChannel = message.member.voiceChannel;
            voiceChannel.join().then(connection => {
                var path = "./scraws";
                fs.readdir(path, function (err, items) {
                    var count = items.length;
                    var number = Math.floor(Math.random() * count);
                    var fileToPlay = items[number];
                    const dispatcher = connection.playFile(path + "/" + fileToPlay);
                    dispatcher.on("end", end => {
                        voiceChannel.leave();
                        
                    });
                });
            })
                .catch(err => {
                    console.log(err);
                    voiceChannel.leave();
                })
                .then(() => { this._setReady(true); });
        }
    }

    playSongFromLinkInChannel(message) {
        if (this._ready) {
            this._setReady(false);
            var link = message.content.split(' ')[1];
            if (link != null) {
                var voiceChannel = message.member.voiceChannel;
                voiceChannel.join().then(connection => {
                    const dispatcher = connection.playStream(ytdl(link, { filter: "audioonly" }));
                    dispatcher.on("end", end => {
                        voiceChannel.leave();
                    });
                    this._setReady(true);
                })
                    .catch(err => {
                        console.log(err);
                        voiceChannel.leave();
                    })
                    .then(() => { this._setReady(true); });
            } else {
                this.replyToMessageWithAt(message, "You must provide a YouTube link!");
            }
        }
    }

    _setReady(isReady) {
        this._ready = isReady;
    }
}

var instance = new Scraw();
module.exports = instance;