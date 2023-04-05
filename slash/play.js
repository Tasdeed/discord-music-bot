const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { QueryType } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("plays songs from YouTube")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("song")
        .setDescription("Plays a single song")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("the song's url")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("playlist")
        .setDescription("Loads a playlist")
        .addStringOption((option) =>
          option.setName("url").setDescription("the playlist's url")
        )
        .setRequired(true)
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription("Search for songs")
        .addStringOption((option) =>
          option
            .setName("searchWords")
            .setDescription("search keywords")
            .setRequired(true)
        )
    ),
  run: async ({ client, interaction }) => {
    if (!interaction.member.voice.channel) {
      return interaction.editReply(
        "Please join a voice channel to use this command"
      );
    }
    const queue = await client.player.createQueue(interaction.guild);
    if (!queue.connection)
      await queue.connect(interaction.member.voice.channel);

    let embed = new MessageEmbed();

    if (interaction.options.getSubcommand() === "song") {
      let url = interaction.options.getString("url");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_VIDEO,
      });
      if (result.tracks.length === 0) {
        return interaction.editReply("No results");
      }
      const song = result.tracks[0];
      await queue.addTrack(song);
      embed
        .setDescription(
          `**[${song.title}](${song.url})** has been added to queue`
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Duration: ${song.duration}` });
    } else if (interaction.options.getSubcommand() === "playlist") {
      let url = interaction.options.getString("url");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_PLAYLIST,
      });
      if (result.tracks.length === 0) {
        return interaction.editReply("No results");
      }
      const playlist = result.playlist;
      await queue.addTracks(result.tracks);
      embed
        .setDescription(
          `**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** has been added to queue`
        )
        .setThumbnail(playlist.thumbnail)
        .setFooter({ text: `Duration: ${playlist.duration}` });
    } else if (interaction.options.getSubcommand() === "search") {
      let url = interaction.options.getString("searchWords");
      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO,
      });
      if (result.tracks.length === 0) {
        return interaction.editReply("No results");
      }
      const song = result.tracks[0];
      await queue.addTrack(song);
      embed
        .setDescription(
          `**${result.tracks.length} songs from [${song.title}](${song.url})** has been added to queue`
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Duration: ${song.duration}` });
    }
    if (!queue.playing) await queue.play();
    await interaction.editReply({
      embeds: [embed],
    });
  },
};
