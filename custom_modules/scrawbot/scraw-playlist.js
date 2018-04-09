function run(input, done) {

    console.log(input);

    var link = input.songs[0];
    var voiceChannel = input.vcid;
    let discord = input.dc;

    let channel = discord.channels.get(voiceChannel);
    channel.join().then(connection => {
        console.log("Connected");
    })
}

module.exports = run;