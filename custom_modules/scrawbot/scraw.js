var fs = require('fs');
var ytdl = require('ytdl-core');
var sqlite3 = require("sqlite3").verbose();
var util = require("util");

class Scraw {
    configure(Discord) {
        this._discord = Discord;
        console.log("SCRAW configured");
        this._ready = true;
        this._playListShouldPlay = false;
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

    playSongFromLinkInChannel(message, link) {
        if (this._ready) {
            this._setReady(false);
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

    leaveVoiceChannel(message) {
        var voiceChannel = message.member.voiceChannel;
        voiceChannel.leave();
    }

    playlistAdd(message, link) {
        var db = new sqlite3.Database("playlist.db");
        var title;
        ytdl.getInfo(link, function (err, info) {
            title = info.title;

            db.serialize(function () {
                db.run(util.format("INSERT INTO Playlist(Name, Link) VALUES('%s', '%s');", title, link));
            });
            db.close();

            message.reply(util.format("Added %s to the playlist!", title));
        });
    }

    playlistList(message) {
        var db = new sqlite3.Database("playlist.db");
        var playlistText = "Current playlist:\n";

        db.each("SELECT Name FROM Playlist", function (err, row) {
            playlistText += util.format("%s\n", row.Name);
            console.log(playlistText);
        }, function () {
            message.channel.send(playlistText);
        });

        db.close();
    }

    playlistStop(message) {
        this._playListShouldPlay = false;
        this.leaveVoiceChannel(message);
    }

    playlistPlay(message) {
        console.log("here");
        this._playListShouldPlay = true;
        var db = new sqlite3.Database("playlist.db");
        var songData = { message: message, songs: [] };
        db.each("Select Name,Link FROM Playlist", function (err, row) {
            songData.songs.push(row.Link);
        }, function () {
            console.log(songData);
            var message = songData.message;
            var songs = songData.songs;

            var voiceChannel = message.member.voiceChannel;
            console.log(voiceChannel);
            voiceChannel.join().then(connection => {
                var numSongs = songs.length;
                var randSong = Math.floor(Math.random() * numSongs);
                var song = songs[randSong];
                const dispatcher = connection.playStream(ytdl(song, { filter: "audioonly" }));
                dispatcher.on("end", end => {
                    voiceChannel.leave();
                });
            })
                .catch(err => {
                    console.log(err);
                    voiceChannel.leave();
                })
                .then(() => { this._setReady(true); });
        });

        db.close();
    }

    _setReady(isReady) {
        this._ready = isReady;
    }
}

var instance = new Scraw();
module.exports = instance;