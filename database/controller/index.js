const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const DB_PATH = path.resolve(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: DB_PATH,
	logging: false,
	transactionType: "IMMEDIATE",
	retry: { match: [/SQLITE_BUSY/], name: "query", max: 10 },
	define: { underscored: false, freezeTableName: true, timestamps: true }
});

const ThreadModel = sequelize.define("threads", {
	threadID:    { type: DataTypes.STRING, unique: true, allowNull: false },
	threadName:  { type: DataTypes.STRING, defaultValue: "" },
	memberCount: { type: DataTypes.INTEGER, defaultValue: 0 },
	adminIDs:    { type: DataTypes.JSON, defaultValue: [] },
	members:     { type: DataTypes.JSON, defaultValue: [] },
	nicknames:   { type: DataTypes.JSON, defaultValue: {} },
	emoji:       { type: DataTypes.STRING, defaultValue: "" },
	imageSrc:    { type: DataTypes.STRING, defaultValue: "" },
	isGroup:     { type: DataTypes.BOOLEAN, defaultValue: false },
	data:        { type: DataTypes.JSON, defaultValue: {} },
	settings:    { type: DataTypes.JSON, defaultValue: {} }
});

const UserModel = sequelize.define("users", {
	userID:     { type: DataTypes.STRING, unique: true, allowNull: false },
	name:       { type: DataTypes.STRING, defaultValue: "" },
	profileUrl: { type: DataTypes.STRING, defaultValue: "" },
	gender:     { type: DataTypes.STRING, defaultValue: "" },
	vanity:     { type: DataTypes.STRING, defaultValue: "" },
	isFriend:   { type: DataTypes.BOOLEAN, defaultValue: false },
	currency:   { type: DataTypes.INTEGER, defaultValue: 0 },
	data:       { type: DataTypes.JSON, defaultValue: {} },
	settings:   { type: DataTypes.JSON, defaultValue: {} }
});

const DashBoardModel = sequelize.define("dashboard", {
	key:  { type: DataTypes.STRING, unique: true, allowNull: false },
	data: { type: DataTypes.JSON, defaultValue: {} }
});

const GlobalModel = sequelize.define("globaldata", {
	key:  { type: DataTypes.STRING, unique: true, allowNull: false },
	data: { type: DataTypes.JSON, defaultValue: {} }
});

function makeController(Model, idField) {
	return {
		async getAll(...args) {
			const rows = await Model.findAll();
			return rows.map(r => r.get({ plain: true }));
		},
		async get(id, key, defaultValue) {
			const row = await Model.findOne({ where: { [idField]: String(id) } });
			if (!row) return defaultValue !== undefined ? defaultValue : null;
			const plain = row.get({ plain: true });
			if (key === undefined) return plain;
			return plain.data && plain.data[key] !== undefined ? plain.data[key] : (defaultValue !== undefined ? defaultValue : null);
		},
		async set(id, key, value) {
			const row = await Model.findOne({ where: { [idField]: String(id) } });
			if (!row) {
				const newData = {};
				if (typeof key === "object") Object.assign(newData, key);
				else if (key) newData[key] = value;
				await Model.create({ [idField]: String(id), data: typeof key === "object" ? key : newData });
				return;
			}
			if (typeof key === "object") {
				for (const [k, v] of Object.entries(key)) {
					if (k === "data" || k === idField || k === "createdAt" || k === "updatedAt") {
						if (k === "data") {
							const existing = row.get("data") || {};
							row.set("data", { ...existing, ...v });
						} else {
							row.set(k, v);
						}
					} else {
						row.set(k, v);
					}
				}
			} else {
				const existing = row.get("data") || {};
				existing[key] = value;
				row.set("data", existing);
			}
			await row.save();
		},
		async create(id, data) {
			const exists = await Model.findOne({ where: { [idField]: String(id) } });
			if (exists) {
				if (data && typeof data === "object") {
					const existing = exists.get("data") || {};
					if (data.data) Object.assign(existing, data.data);
					exists.set("data", existing);
					for (const [k, v] of Object.entries(data)) {
						if (k !== "data") exists.set(k, v);
					}
					await exists.save();
				}
				return exists.get({ plain: true });
			}
			const row = await Model.create({
				[idField]: String(id),
				...(data || {})
			});
			return row.get({ plain: true });
		},
		async delete(id) {
			await Model.destroy({ where: { [idField]: String(id) } });
		},
		async remove(id) {
			await Model.destroy({ where: { [idField]: String(id) } });
		},
		async getName(id) {
			const row = await Model.findOne({ where: { [idField]: String(id) } });
			if (!row) return null;
			return row.get("name") || row.get("threadName") || null;
		},
		async refreshInfo(id, info) {
			const row = await Model.findOne({ where: { [idField]: String(id) } });
			if (!row) {
				return (await Model.create({ [idField]: String(id), ...info })).get({ plain: true });
			}
			for (const [k, v] of Object.entries(info || {})) {
				try { row.set(k, v); } catch (e) {}
			}
			await row.save();
			return row.get({ plain: true });
		}
	};
}

module.exports = async function (api) {
	await sequelize.sync({ alter: false, force: false });
	await ThreadModel.sync({ alter: false });
	await UserModel.sync({ alter: false });
	await DashBoardModel.sync({ alter: false });
	await GlobalModel.sync({ alter: false });

	const threadsData   = makeController(ThreadModel, "threadID");
	const usersData     = makeController(UserModel,   "userID");
	const dashBoardData = makeController(DashBoardModel, "key");
	const globalData    = makeController(GlobalModel,    "key");

	const allThreadData = await ThreadModel.findAll().then(rows => rows.map(r => r.get({ plain: true })));
	const allUserData   = await UserModel.findAll().then(rows => rows.map(r => r.get({ plain: true })));

	if (!global.db) global.db = {};
	global.db.allThreadData = allThreadData;
	global.db.allUserData   = allUserData;
	global.db.receivedTheFirstMessage = {};

	return {
		threadModel:    ThreadModel,
		userModel:      UserModel,
		dashBoardModel: DashBoardModel,
		globalModel:    GlobalModel,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize
	};
};
