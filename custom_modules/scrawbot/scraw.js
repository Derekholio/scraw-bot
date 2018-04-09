var fs = require('fs');
var ytdl = require('ytdl-core');
var sqlite3 = require("sqlite3").verbose();
var util = require("util");
var spawn = require("threads").spawn;

class Scraw {
    configure(Discord, bot) {
        this._discord = Discord;
        this._bot = bot;
        console.log("SCRAW configured");
        this._ready = true;
        this._playListShouldPlay = false;
        this._playlistThread = spawn("./custom_modules/scrawbot/scraw-playlist.js");
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
        console.log("Link: " + link);
        if (this._ready) {
            this._setReady(false);
            if (link != null) {
                var voiceChannel = message.member.voiceChannel;
                voiceChannel.join().then(connection => {
                    console.log("Joined; playing song");
                    const dispatcher = connection.playStream(ytdl(link, { filter: "audioonly" }));
                    dispatcher.on("end", end => {
                        voiceChannel.leave();
                        this._setReady(true);
                    });
                })
                    .catch(err => {
                        console.log(err);
                        voiceChannel.leave();
                    })
            } else {
                this.replyToMessageWithAt(message, "You must provide a YouTube link!");
            }
        } else {
            console.log("Play youtube called, but not ready");
        }
    }

    leaveVoiceChannel(message) {
        console.log("Leaving: " + message.member.voiceChannel);
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
        console.log("Stopping playlist");
        this._playListShouldPlay = false;
        message.member.voiceChannel.leave();
    }

    playlistPlay(message) {
        this._playListShouldPlay = true;

        var dbDone = false;

        var dbPromise = new Promise((resolve, reject) => {
            var db = new sqlite3.Database("playlist.db");
            var songData = { message: message, songs: [] };
            db.each("Select Name,Link FROM Playlist", function (err, row) {
                songData.songs.push(row.Link);
            }, () => {
                console.log("DB finished");
                dbDone = true;
                resolve(songData);
            });
            db.close();
        });

        dbPromise.then((songData) => {
            console.log(message.member.voiceChannel.id);
            this._playlistThread.send({ songs: songData.songs, vcid: message.member.voiceChannel.id, dc: this._bot });
        });

        dbPromise.then((songData) => {
            do {
                let message = songData.message;
                let songs = songData.songs;

                var numSongs = songs.length;
                var randSong = Math.floor(Math.random() * numSongs);
                var link = songs[randSong];

                console.log("Playing random song: " + link);

                this.playSongFromLinkInChannel(message, link);
            } while (this._playListShouldPlay);
        }).catch(err => { console.log(err); });
    }

    sleep(time, callback) {
        var stop = new Date().getTime();
        while (new Date().getTime() < stop + time) {
            ;
        }
        callback();
    }

    _setReady(isReady) {
        console.log("Ready being set: " + isReady);
        this._ready = isReady;
    }
}

var instance = new Scraw();
module.exports = instance;