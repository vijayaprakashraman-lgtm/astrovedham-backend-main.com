const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CONFIG = require("../common/inc.config");

module.exports = {
	generateToken(data) {
		console.log(process.env.JWT_SECRET);
		return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "30d" });
	},

	error() {
		return { status: 'E', msg: 'Error' };
	},

	async generateUserId(dbobj) {

		try {

			// Fetch the last created user_id (sorted in descending order)
			const lastUser = await dbobj.collection('user_accounts').find().sort({ user_id: -1 }).limit(1).toArray();
			console.log('lastuser',lastUser);
	
			let newUserId;
			if (lastUser.length > 0) {
				newUserId = parseInt(lastUser[0].user_id) + 1;
			} else {
				// Start with the first 6-digit ID if no users exist
				newUserId = 10001;
			}

			return newUserId;

		} catch (error) {
			console.error('Error generating user_id:', error);
			throw error;
		} finally {
			// await client.close();
		}
	},

	async handleReferral(dbobj, referelId) {
		let is_valid_referel = false; // Set the flag to false by default

		// Check if the referral ID is valid
		if (referelId && referelId > 0) {
			let referelUser = await dbobj.collection('user_accounts').find({ user_id: referelId }).limit(1).toArray();
			if (referelUser.length > 0) {

				// Update the coin balance of the referred user
				let referelCoin = referelUser[0].coin_balance + CONFIG.REFER_BONUS;
				await dbobj.collection('user_accounts').updateOne({ user_id: referelId }, { $set: { coin_balance: referelCoin, mdy_on: new Date() } });

				// Insert a record in the transaction_history collection
				await dbobj.collection('transaction_history').insertOne({
					user_id: referelId,
					coin: CONFIG.REFER_BONUS,
					type: 'Referral Bonus',
					crd_on: new Date(),
					mdy_on: new Date(),
					stat: 'A'
				});

				is_valid_referel = true; // Set the flag to true if the referral is valid
			}
		}
		return is_valid_referel;
	},
	async reward_distribution(rank, prize_pool, points) {
		try {
			let reward = 0;
			if (points > 0 && prize_pool > 0) {
				if (rank === 1) {
					reward = (prize_pool * 25) / 100;
				} else if (rank === 2) {
					reward = (prize_pool * 18) / 100;
				}
				else if (rank === 3) {
					reward = (prize_pool * 12) / 100;
				} else if (rank === 4) {
					reward = (prize_pool * 9) / 100;
				} else if (rank === 5) {
					reward = (prize_pool * 8) / 100;
				}
				else if (rank === 6) {
					reward = (prize_pool * 7) / 100;
				}
				else if (rank === 7) {
					reward = (prize_pool * 6) / 100;
				}
				else if (rank === 8) {
					reward = (prize_pool * 5) / 100;
				}
				else if (rank === 9) {
					reward = (prize_pool * 4) / 100;
				}
				else if (rank === 10) {
					reward = (prize_pool * 3) / 100;
				}
			}
			return reward
		} catch (error) {
			console.log("Error in reward_distribution", error);

		}

	},
	// 3 functions , add coins, log _transaction, log_winnings, deduct_coins.
	// user_id coins_value ==> add_coins, deduct_coins
	// transaction history ,my winnings ==> 

	async add_coins(user_id, value, dbobj) {
		
			let get_coin_balance = await dbobj.collection('user_accounts').find({ user_id: user_id }).toArray();
			if(get_coin_balance.length > 0){
				let coin_balance = get_coin_balance[0].coin_balance;
				coin_balance = coin_balance + value;
				await dbobj.collection('user_accounts').updateOne({ user_id: user_id }, { $set: { coin_balance } });
			}
			
		return true;
	},
	async deduct_coins(user_id, coins_value, dbobj) {
		let get_coin_balance = await dbobj.collection('user_accounts').find({ user_id: user_id }).toArray();
			if(get_coin_balance.length > 0){
				let coin_balance = get_coin_balance[0].coin_balance;
				coin_balance = coin_balance - value;
				await dbobj.collection('user_accounts').updateOne({ user_id: user_id }, { $set: { coin_balance } });
			}
			return true;
	},
	async log_transactions(user_id, dbobj, reason, type, currency_type, value) {
		let insert_obj = {
			user_id,
			reason,
			type,
			currency_type,
			value,
			crd_on: new Date(),
			stat: 'A'
		};
		await dbobj.collection('transaction_history').insertOne(insert_obj);
		return true;
	},

	async log_mywinnings(user_id, dbobj, source, type, reward) {
		let insert_obj = {
			user_id,
			source,
			type,
			reward,
			crd_on: new Date(),
			stat: 'A'
		};
		await dbobj.collection('my_winnings').insertOne(insert_obj);
		return true;
	},

	async send_email(email_id, subject,template) {
	
		return new Promise((resolve, reject) => {
			let transporter = nodemailer.createTransport({
				
				host: process.env.AWS_SES_SMTP_HOST,
				auth: {
					user: process.env.AWS_SES_SMTP_USER,
					pass: process.env.AWS_SES_SMTP_PASS,
				},
				headers:{"X-SES-CONFIGURATION-SET": process.env.AWS_SES_CONFIG_SET},
			});
	
			let mailOptions = {
				from: {
					name: process.env.AWS_SES_SMTP_FROM_NAME,
					address: process.env.AWS_SES_SMTP_FROM_EMAIL,
				},
				to: email_id,
				subject:subject,
				html:template
				};
			transporter.sendMail(mailOptions, async function (error, info) {
				if (error) {
					reject(error);
					console.log(error);
				} else {
					console.log(info);
					resolve(info);
				}
			});
		})
	
	}
}