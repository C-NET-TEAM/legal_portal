import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		size: {
			type: String,
			default: "",
		},
		mimetype: {
			type: String,
			default: "",
		},
		filename: {
			type: String,
			default: "",
		},
		url: {
			type: String,
			default: "",
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false },
);

const chatSchema = new mongoose.Schema(
	{
		sender: {
			type: String,
			required: true,
			enum: ["cms", "sms", "system"],
		},
		text: {
			type: String,
			default: "",
		},
		documents: [documentSchema],
		phase: {
			type: String,
			enum: ["review1", "review2", "system", "general"],
			default: "review1",
		},
		readByCms: {
			type: Boolean,
			default: false,
		},
		readBySms: {
			type: Boolean,
			default: false,
		},
		editedAt: {
			type: String,
			default: "",
		},
		timestamp: {
			type: String,
			default: () => new Date().toISOString(),
		},
	},
	{ _id: false },
);

const caseSchema = new mongoose.Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		clientId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		clientType: {
			type: String,
			enum: ["Individual", "Institute"],
			default: "Individual",
		},
		title: {
			type: String,
			default: "",
		},
		clientName: {
			type: String,
			required: true,
			trim: true,
		},
		age: {
			type: String,
			default: "",
		},
		sex: {
			type: String,
			default: "",
		},
		city: {
			type: String,
			default: "N/A",
		},
		state: {
			type: String,
			default: "N/A",
		},
		details: {
			type: String,
			required: true,
		},
		summary: {
			type: String,
			default: "",
		},
		caseCategory: {
			type: String,
			default: "",
		},
		caseKeywords: {
			type: String,
			default: "",
		},
		caseVertical: {
			type: String,
			default: "",
		},
		category: {
			type: String,
			default: "",
		},
		documents: [documentSchema],
		selectedDocuments: [documentSchema],
		status: {
			type: String,
			default: "Pending",
			index: true,
		},
		targetSme: {
			type: String,
			default: "",
		},
		smsNotes: {
			type: String,
			default: "",
		},
		lexPrompt: {
			type: String,
			default: "",
		},
		lexOutput: {
			type: String,
			default: "",
		},
		finalFeedback: {
			type: String,
			default: "",
		},
		reviewerInfo: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
		reviewPhase: {
			type: String,
			enum: ["review1", "review2", "completed"],
			default: "review1",
		},
		chats: [chatSchema],
	},
	{
		timestamps: true,
	},
);

export default mongoose.model("Case", caseSchema);
