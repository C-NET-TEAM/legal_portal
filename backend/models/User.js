import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		clientId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		resetPasswordToken: {
			type: String,
			default: null,
		},
		resetPasswordExpires: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

export default mongoose.model("User", userSchema);
