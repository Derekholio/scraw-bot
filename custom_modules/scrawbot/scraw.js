var fs = require('fs');
var ytdl = require('ytdl-core');
var sqlite3 = require("sqlite3").verbose();

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

    playSongFromLinkInChannel(message, args) {
        if (this._ready) {
            this._setReady(false);
            var link = args[0];
            if (link != null) {
                var voiceChannel = message.member.voiceChannel;
                voiceChannel.join().then(connection => {
                    const dispatcher = connection.playStream(ytdl(link, { filter: "audioonly" }));
                    dispatcher.on("end", end => {
                        voiceChannel.leave();
                    });
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

    leaveVoiceChannel(message){
        var voiceChannel = message.member.voiceChannel;
        voiceChannel.leave();
    }

    playlistAdd(message, link){
        var db = new sqlite3.Database("playlist.db");
        var info = getInfo(link, function(err, info){
            var title = info.title;
        });
        db.serialize(function() {
            db.run("INSERT INTO Playlist(Name, Link) VALUES('${title}', '${link}');")
        });
        db.close();

        this.replyToMessageWithAt(message, "Added ${title} to playlist!");
    }

    _setReady(isReady) {
        this._ready = isReady;
    }
}

var instance = new Scraw();
module.exports = instance;