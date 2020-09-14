require('dotenv').config()
const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios')
const querystring = require('querystring')
const cron = require('node-cron');
const DBL = require('dblapi.js')
const dbl = new DBL(process.env.DBL_TOKEN, client)

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('for g!feedback', { type: 'WATCHING'})
});

setInterval(() => {
	client.user.setActivity('you.', { type: 'WATCHING'})
},1200000)

function DTT(message) {
	let text = message.content
	message.mentions.members.forEach(m => {
		var re = new RegExp(m.toString().replace(/\@/gi, "@!"), "gi")
		text = text.replace(re, m.displayName)
	})
	
	message.mentions.channels.forEach(c => {
		text = text.replace(/<#[0-9]{18}>/gi, c.name)
	})

	message.mentions.roles.forEach(r => {
		text = text.replace(/<@&[0-9]{18}>/gi, r.name)
	})

	text = text.replace(/@everyone/gi, "everyone")
	text = text.replace(/@here/gi, "here")

	return text
}

client.on('message', message => {

	if(message.content.startsWith("g!feedback")) return message.channel.send("<@"+ message.author.id +">, DM Aresiel#0666 with feedback.")

	if (message.author.id == client.user.id) return;

	let responseEmbed = new Discord.MessageEmbed()
		.setColor(255)
		.setTitle("Grammar!")
		.setFooter("Powered by LanguageTool.org")
	let count = 0
	axios.post('http://10.0.1.14:25002/v2/check', querystring.stringify({
			'text': DTT(message),
			'language': 'en-US',
			'disabledRules': 'GONNA,WANNA,GOTTA,EN_QUOTES'
		}))
		.then(async response => {
			if (response.data.matches.length != 0) {
				apiResponse = await response.data.matches.map(match => {
					let desc = match.message
					let title = match.shortmessage
					if(title == undefined) title = "Mistake"
					console.log(match)
					
					if (match.rule.id == "MORFOLOGIK_RULE_EN_US") {
						if(match.replacements.length > 0) {
							desc = `You wrote "${match.context.text.substr(match.context.offset,match.context.length)}", may you have meant "${match.replacements[0].value}"?`
						} else {
							desc = `The word "${match.context.text.substr(match.context.offset,match.context.length)} is not spelled correctly."`
						}
						
					}
					if(match.rule.id == "EN_CONTRACTION_SPELLING"){
						if(match.replacements.length > 0) {
							desc = `You wrote "${match.context.text.substr(match.context.offset,match.context.length)}", may you have meant "${match.replacements[0].value}"?`
						} else {
							desc = `The contraction "${match.context.text.substr(match.context.offset,match.context.length)} is not spelled correctly."`
						}
					}
					if(match.rule.id == "UPPERCASE_SENTENCE_START") {
						desc = "In English sentences must start with a capital letter."
					}
					if(match.rule.id == "DOUBLE_PUNCTUATION") {
						desc = "In English, double dots aren't used."
					}
					if(match.rule.id == "I_LOWERCASE") {
						desc = `"I" when used as a pronoun is always uppercase in English.`
					}
					if(match.rule.id == "PROFANITY") {
						desc = `The expression "${match.context.text.substr(match.context.offset,match.context.length)}" may be considered offensive.`
					}
					if(match.rule.id == "BELIVE_BELIEVE"){
						title = "Possible spelling mistake found."
						desc = match.message
					}
					count++
					return responseEmbed.addField(`${count}. ` + title, desc)
				})

				await message.channel.send(responseEmbed)
			}
		})
		.catch(error => console.log(error))

});

client.login(process.env.TOKEN);
