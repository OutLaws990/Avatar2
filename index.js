const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    PermissionsBitField 
} = require('discord.js');

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = ""; // هنا تحط الروم اللي تبي البوت يافك فيه

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        
        if (!channel || !channel.isVoiceBased()) {
            console.log("❌ القناة المحددة ليست صوتية أو غير موجودة.");
            return;
        }

        const existingConnection = getVoiceConnection(channel.guild.id);
        if (!existingConnection) {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: true
            });

            console.log(`🔊 البوت انضم إلى القناة الصوتية: ${channel.name}`);
        } else {
            console.log("⚠️ البوت متصل بالفعل بالقناة الصوتية.");
        }
    } catch (error) {
        console.error("❌ خطأ أثناء محاولة الانضمام إلى القناة الصوتية:", error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!ww') { // اختصار عشان البوت يرسل القائمة
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: '❌ **ليس لديك صلاحية لاستخدام هذا الأمر.**', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Avatar')
            .setDescription("**Avatar:** السطر الاول\n**Banner:**السطر الثاني\n**Profile:** السطر الثالث\n\nاضغط على الزر أدناه لاختيار الأفتار أو البنر أو البروفايل لعضو معين.")
           	.setImage('') // رابط الصورة
            .setColor(0x000000);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('avatar')
                    .setLabel('Avatar')
                    .setEmoji("1338481680863985675")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('banner')
                    .setLabel('Banner')
                    .setEmoji("1338481692100395008")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('profile')
                    .setLabel('Profile')
                    .setEmoji("1338489129620471828")
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    let modalTitle = "";
    let modalId = "";

    if (interaction.customId === 'avatar') {
        modalTitle = 'Avatar Account';
        modalId = 'avatar_modal';
    } else if (interaction.customId === 'banner') {
        modalTitle = 'Banner Account';
        modalId = 'banner_modal';
    } else if (interaction.customId === 'profile') {
        modalTitle = 'Profile Account';
        modalId = 'profile_modal';
    }

    if (modalId) {
        const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(modalTitle);

        const userIdInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('كوبي ايدي الشخص')
            .setPlaceholder('مثال: 123456789012345678')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(userIdInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal).catch(err => {
            console.error("❌ خطأ أثناء عرض الـ Modal:", err);
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const userId = interaction.fields.getTextInputValue('user_id').trim();
    const targetUser = await client.users.fetch(userId).catch(() => null);

    if (!targetUser) {
        return interaction.reply({ content: '❌ **لم أتمكن من العثور على المستخدم.**', ephemeral: true });
    }

    let embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}`)
        .setColor(0x000000);

    let row;

    if (interaction.customId === 'avatar_modal') {
        const avatarURL = targetUser.displayAvatarURL({ size: 1024, dynamic: true });

        embed.setImage(avatarURL);

        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 رابط الصورة")
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatarURL)
            );

    } else if (interaction.customId === 'banner_modal') {
        const user = await client.users.fetch(userId, { force: true });

        if (!user.banner) {
            return interaction.reply({ content: '❌ **هذا المستخدم ليس لديه بنر.**', ephemeral: true });
        }

        const bannerURL = user.bannerURL({ size: 1024, dynamic: true });

        embed.setImage(bannerURL);

        row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 رابط البنر")
                    .setStyle(ButtonStyle.Link)
                    .setURL(bannerURL)
            );
    } else if (interaction.customId === 'profile_modal') {
        const user = await client.users.fetch(userId, { force: true });

        let avatarURL = targetUser.displayAvatarURL({ size: 1024, dynamic: true });
        let bannerURL = user.banner ? user.bannerURL({ size: 1024, dynamic: true }) : null;

        embed.setDescription("📸 **الصورة الشخصية و البنر:**")
             .setImage(avatarURL);

        if (bannerURL) {
            embed.addFields({ name: "🎨 بنر المستخدم:", value: `[🔗 عرض البنر](${bannerURL})` });
        } else {
            embed.addFields({ name: "🎨 بنر المستخدم:", value: "🚫 **هذا المستخدم ليس لديه بنر.**" });
        }

        const buttons = [
            new ButtonBuilder()
                .setLabel("🔗 رابط الأفتار")
                .setStyle(ButtonStyle.Link)
                .setURL(avatarURL)
        ];

        if (bannerURL) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel("🔗 رابط البنر")
                    .setStyle(ButtonStyle.Link)
                    .setURL(bannerURL)
            );
        }

        row = new ActionRowBuilder().addComponents(buttons);
    }

    await interaction.reply({ embeds: [embed], components: row ? [row] : [], ephemeral: true });
});

client.login(TOKEN);
